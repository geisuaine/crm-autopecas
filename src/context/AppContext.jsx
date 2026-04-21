import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { COLUMNS, EMPLOYEES, COLLABORATORS, FREIGHT_TABLE } from '../data/mockData'
import { supabase, buscarPedidos, atualizarPedido, buscarMensagens } from '../lib/supabase'

const AppContext = createContext(null)

function autoMsg(text) {
  return { sender: 'ai', type: 'text', content: text, id: `msg-${Date.now()}-${Math.random()}`, time: new Date() }
}

function buildPriceMsg(pieceName, price) {
  const lines = []
  if (price.cash) lines.push(`💵 Dinheiro: R$ ${price.cash}`)
  if (price.pix)  lines.push(`📲 Pix: R$ ${price.pix}`)
  if (price.card) lines.push(`💳 Cartão: R$ ${price.card}`)
  return `✅ Temos a peça que você procura!\n\n🔧 ${pieceName}\n\nFormas de pagamento:\n${lines.join('\n')}\n\nObservação: Desconto exclusivo para pagamento em dinheiro. Pix e cartão seguem o valor integral.\n\nAguardamos sua confirmação! 😊`
}

const STATUS_MSGS = {
  'found':         (name) => `✅ Boa notícia! Encontramos a peça *${name}* que você precisava.\n\nAguarde — já estamos verificando os valores para te passar o melhor preço! 💪`,
  'not-found':     (name) => `🔍 Estamos procurando a peça *${name}* na nossa rede de colaboradores.\n\nAssim que tivermos uma resposta, avisamos você! Por favor, aguarde.`,
  'searching':     (name) => `⏳ Nossa equipe está buscando a peça *${name}* para você.\n\nEm breve retornamos com novidades!`,
  'waiting-price': (name) => `📋 A peça *${name}* foi localizada e estamos aguardando a confirmação do preço.\n\nRetornamos em breve! 🙏`,
  'delivered':     (name) => `🏁 A peça *${name}* foi entregue com sucesso!\n\nMuito obrigado pela preferência. Qualquer dúvida, estamos à disposição! ⭐`,
}

const ALL_PERMISSIONS = ['kanban','sales','repasse','collaborators','freight','reports','newOrder','prospect','settings','approveMedia']

const INITIAL_USERS = [
  {
    id: 'admin',
    name: 'Carlos (Admin)',
    avatar: 'C',
    role: 'admin',
    pin: '1234',
    permissions: new Set(ALL_PERMISSIONS),
  },
  {
    id: 'e1',
    name: 'Carlos',
    avatar: 'C',
    role: 'employee',
    pin: '0000',
    permissions: new Set(['kanban', 'sales', 'newOrder']),
  },
  {
    id: 'e2',
    name: 'Ana',
    avatar: 'A',
    role: 'employee',
    pin: '0000',
    permissions: new Set(['kanban', 'sales', 'newOrder']),
  },
  {
    id: 'e3',
    name: 'Pedro',
    avatar: 'P',
    role: 'employee',
    pin: '0000',
    permissions: new Set(['kanban']),
  },
  {
    id: 'e4',
    name: 'Geisa',
    avatar: 'G',
    role: 'admin',
    pin: '1234',
    permissions: new Set(ALL_PERMISSIONS),
  },
  {
    id: 'e5',
    name: 'Rodrigo',
    avatar: 'R',
    role: 'employee',
    pin: '0000',
    permissions: new Set(['kanban']),
  },
]

function pedidoParaCard(p) {
  // Split multiple pieces stored as "farol, radiador, paralama"
  const pecaNomes = p.peca
    ? p.peca.split(',').map(s => s.trim()).filter(Boolean)
    : ['Peça não identificada']

  return {
    id: p.id,
    column: p.status || 'novo-pedido',
    client: { name: p.nome_cliente || 'Cliente', phone: p.numero },
    vehicle: p.veiculo ? { brand: '', model: p.veiculo, year: '' } : null,
    pieces: pecaNomes.map((nome, i) => ({
      id: p.id + `-p${i}`,
      name: nome,
      status: 'searching',
      price: i === 0 && (p.preco_dinheiro || p.preco_pix || p.preco_cartao)
        ? { cash: p.preco_dinheiro, pix: p.preco_pix, card: p.preco_cartao }
        : null,
    })),
    messages: [],
    priority: 'normal',
    createdAt: new Date(p.criado_em),
    numero: p.numero,
    fromWhatsapp: true,
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
  }
}

export function AppProvider({ children, session, onLogout }) {
  const [cards, setCards]                         = useState([])
  const [view, setView]                           = useState('kanban')
  const [selectedCard, setSelectedCard]           = useState(null)
  const [geisaMode, setGeisaMode]                 = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery]             = useState('')
  const [users, setUsers]                         = useState(INITIAL_USERS)
  const [currentUserId, setCurrentUserId]         = useState('admin')
  const [collaboratorsList, setCollaboratorsList] = useState(COLLABORATORS)

  const addCollaborator = useCallback((dados) => {
    const novo = {
      id: `co${Date.now()}`,
      name: dados.name,
      store: dados.store || dados.name,
      phone: dados.phone || '',
      neighborhood: dados.neighborhood || '',
      city: dados.city || 'Rio de Janeiro',
      inRio: (dados.city || '').toLowerCase().includes('rio') || !dados.city,
      delivery: dados.delivery || false,
      responseTime: 30,
    }
    setCollaboratorsList(prev => [...prev, novo])
    return novo
  }, [])

  // Carregar pedidos do Supabase + Realtime
  useEffect(() => {
    buscarPedidos().then(pedidos => {
      setCards(pedidos.map(pedidoParaCard))
    })

    const channel = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, ({ new: p }) => {
        setCards(prev => [pedidoParaCard(p), ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, ({ new: p }) => {
        setCards(prev => prev.map(c => c.id === p.id ? { ...pedidoParaCard(p), messages: c.messages } : c))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Carregar mensagens do WhatsApp quando card é selecionado
  useEffect(() => {
    if (!selectedCard?.numero || !selectedCard?.fromWhatsapp) return
    buscarMensagens(selectedCard.numero).then(msgs => {
      if (!msgs.length) return
      const convertidas = msgs.map(m => ({
        id: m.id,
        sender: m.de_mim ? 'ai' : 'client',
        type: 'text',
        content: m.mensagem,
        time: new Date(m.criado_em),
      }))
      setCards(prev => prev.map(c =>
        c.id === selectedCard.id ? { ...c, messages: convertidas } : c
      ))
    })
  }, [selectedCard?.id])

  // Usuário do Supabase (sessão real)
  const supabaseUser = session?.user ?? null

  const currentUser = users.find(u => u.id === currentUserId) || users[0]

  function can(permission) {
    return currentUser.role === 'admin' || currentUser.permissions.has(permission)
  }

  function updateUserPermissions(userId, permission, enabled) {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      const perms = new Set(u.permissions)
      enabled ? perms.add(permission) : perms.delete(permission)
      return { ...u, permissions: perms }
    }))
  }

  const notifications = [
    { id: 'n1', text: 'Maria Santos aguardando há 40 min',    type: 'urgent',    time: new Date() },
    { id: 'n2', text: 'Peça encontrada para Paulo Mendes',    type: 'info',      time: new Date() },
    { id: 'n3', text: 'Reclamação urgente de Antônio Braga',  type: 'complaint', time: new Date() },
  ]

  const NOTIFICAR_STATUS = ['em-busca','peca-encontrada','aguardando-preco','aguardando-repasse','aguardando-envio','finalizado']

  const moveCard = useCallback((cardId, newColumn) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (card?.fromWhatsapp && card?.numero && NOTIFICAR_STATUS.includes(newColumn)) {
        fetch('https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1/notify-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
          body: JSON.stringify({
            numero: card.numero,
            nome: card.client?.name,
            peca: card.pieces?.map(p => p.name).join(', '),
            status: newColumn,
          }),
        }).catch(() => {})
      }
      return prev.map(c => c.id === cardId ? { ...c, column: newColumn } : c)
    })
    atualizarPedido(cardId, { status: newColumn }).catch(() => {})
  }, [])

  const updatePiece = useCallback((cardId, pieceId, fields) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      return { ...c, pieces: c.pieces.map(p => p.id === pieceId ? { ...p, ...fields } : p) }
    }))
  }, [])

  const addMessage = useCallback((cardId, msg) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      return { ...c, messages: [...c.messages, { ...msg, id: msg.id || `msg-${Date.now()}`, time: new Date() }] }
    }))
  }, [])

  // Updates piece status and auto-sends message to client
  const WAITING_PAYMENT_COLS = ['novo-pedido','em-busca','peca-encontrada','aguardando-preco']
  const EARLY_COLS = ['novo-pedido', 'em-busca', 'aguardando-preco']

  const updatePieceStatus = useCallback((cardId, pieceId, status, price = null) => {
    setCards(prev => {
      const c = prev.find(card => card.id === cardId)
      if (!c) return prev

      const piece = c.pieces.find(p => p.id === pieceId)
      if (!piece) return prev

      const updatedPieces = c.pieces.map(p =>
        p.id === pieceId ? { ...p, status, ...(price ? { price } : {}) } : p
      )

      let msg = null
      if (price) {
        msg = autoMsg(buildPriceMsg(piece.name, price))
      } else if (STATUS_MSGS[status] && piece.status !== status) {
        msg = autoMsg(STATUS_MSGS[status](piece.name))
      }

      const newColumn = price && WAITING_PAYMENT_COLS.includes(c.column)
        ? 'aguardando-repasse'
        : (status === 'waiting-price' || status === 'found') && EARLY_COLS.includes(c.column)
        ? 'peca-encontrada'
        : c.column

      // Side effects after render (notify + DB sync)
      if (newColumn !== c.column) {
        Promise.resolve().then(() => {
          atualizarPedido(cardId, { status: newColumn }).catch(() => {})
          if (c.fromWhatsapp && c.numero && NOTIFICAR_STATUS.includes(newColumn)) {
            fetch('https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1/notify-client', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
              body: JSON.stringify({
                numero: c.numero,
                nome: c.client?.name,
                peca: updatedPieces.map(p => p.name).join(', '),
                status: newColumn,
              }),
            }).catch(() => {})
          }
        })
      }

      return prev.map(card =>
        card.id === cardId
          ? { ...card, column: newColumn, pieces: updatedPieces, messages: msg ? [...card.messages, msg] : card.messages }
          : card
      )
    })
  }, [])

  const addCard = useCallback(({ client, vehicle, pieces: pieceNames, welcomeMsg }) => {
    const newCard = {
      id: `card-${Date.now()}`,
      column: 'novo-pedido',
      client,
      vehicle: vehicle || null,
      pieces: pieceNames.map((name, i) => ({
        id: `p-${Date.now()}-${i}`,
        name,
        status: 'searching',
        price: null,
      })),
      messages: welcomeMsg
        ? [{ id: `msg-${Date.now()}`, sender: 'ai', type: 'text', content: welcomeMsg, time: new Date() }]
        : [],
      priority: 'normal',
      createdAt: new Date(),
    }
    setCards(prev => [newCard, ...prev])
    return newCard
  }, [])

  const addPiecesToCard = useCallback((cardId, pieceNames, msg) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      const newPieces = pieceNames.map((name, i) => ({
        id: `p-${Date.now()}-${i}`,
        name,
        status: 'searching',
        price: null,
      }))
      const newMsg = msg
        ? [{ id: `msg-${Date.now()}`, sender: 'ai', type: 'text', content: msg, time: new Date() }]
        : []
      return { ...c, pieces: [...c.pieces, ...newPieces], messages: [...c.messages, ...newMsg] }
    }))
  }, [])

  // paidCollabPieces: Set of "pieceId" strings already paid to collaborator
  const [paidCollabPieces, setPaidCollabPieces] = useState(new Set())

  const [disparosQueue, setDisparosQueue] = useState([])

  function adicionarAoDisparo(prospect) {
    const num = (prospect.whatsapp || '').replace(/\D/g, '')
    if (!num || num.length < 10) return false
    if (disparosQueue.some(d => d.numero === num)) return false
    setDisparosQueue(prev => [...prev, {
      id: Date.now(),
      numero: num,
      nome: prospect.name,
      texto: null,
      delay: null,
      status: 'pendente',
      horaEnvio: null,
    }])
    return true
  }

  const confirmCardPayment = useCallback((cardId) => {
    // Single setCards call — do everything atomically
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card) return prev

      // Mark collab pieces as paid
      const pieceIds = card.pieces
        .filter(p => p.collaboratorId && p.price?.collaboratorCost)
        .map(p => p.id)
      if (pieceIds.length > 0) {
        setPaidCollabPieces(s => {
          const next = new Set(s)
          pieceIds.forEach(id => next.add(id))
          return next
        })
      }

      const msg = autoMsg('✅ Pagamento confirmado! Pedido liberado para separação e envio.\n\n🚚 Encaminhando para Aguardando Envio.')
      return prev.map(c =>
        c.id === cardId
          ? { ...c, column: 'aguardando-envio', messages: [...c.messages, msg] }
          : c
      )
    })
  }, [])

  const filteredCards = searchQuery.trim()
    ? cards.filter(c =>
        c.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pieces.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.vehicle && `${c.vehicle.brand} ${c.vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : cards

  return (
    <AppContext.Provider value={{
      cards: filteredCards,
      setCards,
      view, setView,
      selectedCard, setSelectedCard,
      geisaMode, setGeisaMode,
      showNotifications, setShowNotifications,
      searchQuery, setSearchQuery,
      notifications,
      columns: COLUMNS,
      employees: EMPLOYEES,
      collaborators: collaboratorsList,
      addCollaborator,
      freightTable: FREIGHT_TABLE,
      moveCard,
      updatePieceStatus,
      updatePiece,
      addMessage,
      addCard,
      addPiecesToCard,
      confirmCardPayment,
      paidCollabPieces,
      users, currentUser: supabaseUser ?? currentUser, currentUserId, setCurrentUserId, can, updateUserPermissions, ALL_PERMISSIONS,
      disparosQueue, setDisparosQueue, adicionarAoDisparo,
      onLogout,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
