import { useState } from 'react'
import { X, Send, Mic, Camera, Hash, Car, Clock, Users, ChevronDown, DollarSign, MessageCircle, Truck, Package, Phone, MapPin, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { FREIGHT_TABLE } from '../data/mockData'

function Bubble({ msg }) {
  const isClient       = msg.sender === 'client'
  const isCollaborator = msg.sender === 'collaborator'

  return (
    <div className={`flex mb-3 ${isClient ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar esquerdo */}
      {!isClient && (
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center mr-2 shrink-0 mt-0.5 ${
          isCollaborator ? 'bg-orange-100' : 'bg-blue-100'
        }`}>
          <span className={`text-[10px] font-black ${isCollaborator ? 'text-orange-600' : 'text-blue-600'}`}>
            {isCollaborator ? (msg.collabName?.[0] || 'C') : 'AP'}
          </span>
        </div>
      )}

      <div className="max-w-[80%] flex flex-col">
        {/* Label do colaborador */}
        {isCollaborator && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-black text-orange-600">{msg.collabName || 'Colaborador'}</span>
            {msg.collabPhone && <span className="text-[10px] text-gray-400">{msg.collabPhone}</span>}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">COLABORADOR</span>
          </div>
        )}

        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          isClient       ? 'bg-blue-600 text-white rounded-tr-sm'
          : isCollaborator ? 'rounded-tl-sm text-orange-900'
          : 'bg-gray-100 text-gray-700 rounded-tl-sm'
        }`}
        style={isCollaborator ? { background: '#fff7ed', border: '1.5px solid #fed7aa' } : {}}>
          {msg.type === 'audio' && (
            <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-white/20">
              <Mic size={12} className={isClient ? 'text-blue-200' : 'text-purple-500'} />
              <div className="flex gap-0.5 items-end">
                {[3,5,4,6,3,5,4,6,3].map((h,i) => (
                  <div key={i} className="w-0.5 rounded-full" style={{ height: h*2, backgroundColor: isClient ? '#fff' : '#a78bfa' }} />
                ))}
              </div>
              <span className="text-[10px] opacity-70">0:04</span>
            </div>
          )}
          {msg.type === 'photo' && (
            <div className="w-48 h-28 bg-gray-200 rounded-xl mb-2 flex items-center justify-center">
              <Camera size={22} className="text-gray-400" />
            </div>
          )}
          {msg.content}
        </div>
      </div>

      {/* Avatar direito (cliente) */}
      {isClient && (
        <div className="w-7 h-7 rounded-xl bg-gray-200 flex items-center justify-center ml-2 shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-gray-500">C</span>
        </div>
      )}
    </div>
  )
}

const PIECE_STATUS_CFG = {
  'found':         { label: 'Disponível',     bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  'not-found':     { label: 'Não Encontrada', bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
  'searching':     { label: 'Buscando',       bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  'waiting-price': { label: 'Aguard. Preço',  bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  'delivered':     { label: 'Entregue',       bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
}

function PieceRow({ piece, cardId, cardNumero, cardClientName }) {
  const { updatePieceStatus, updatePiece, collaborators, addMessage, can } = useApp()
  const s = PIECE_STATUS_CFG[piece.status] || PIECE_STATUS_CFG['searching']
  const [priceMode,      setPriceMode]      = useState(false)
  const [collabMode,     setCollabMode]     = useState(false)
  const [collabReply,    setCollabReply]    = useState(false)
  const [replyCollabId,  setReplyCollabId]  = useState('')
  const [replyCost,      setReplyCost]      = useState('')
  const [replyNote,      setReplyNote]      = useState('')
  const [prices,         setPrices]         = useState({ cash: '', pix: '', card: '', collaboratorCost: '' })
  const [selectedCollab, setSelectedCollab] = useState(piece.collaboratorId || '')
  const [sentCollabs, setSentCollabs] = useState([])
  const [storePhoto,  setStorePhoto]  = useState(piece.storePhoto  || null)
  const [collabPhoto, setCollabPhoto] = useState(piece.collabPhoto || null)

  const photoRequested = piece.photoRequested || false
  const photoConfirmed = piece.photoConfirmed || false
  const [quickCollab, setQuickCollab] = useState(false)
  const collab = collaborators.find(c => c.id === (piece.collaboratorId || selectedCollab))
  const canApproveMedia = can('approveMedia')

  function handlePhotoUpload(type, e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target.result
      if (type === 'store') { setStorePhoto(dataUrl); updatePiece(cardId, piece.id, { storePhoto: dataUrl }) }
      else { setCollabPhoto(dataUrl); updatePiece(cardId, piece.id, { collabPhoto: dataUrl }) }
    }
    reader.readAsDataURL(file)
  }

  function sendPhotoToClient(photoDataUrl, caption) {
    if (!cardNumero) return
    // Sends via Evolution API through the notify-client function
    fetch(`https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1/send-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
      body: JSON.stringify({ numero: cardNumero, imageDataUrl: photoDataUrl, caption }),
    }).catch(() => {})
    addMessage(cardId, { sender: 'ai', type: 'photo', content: `📷 Foto enviada: ${caption}`, imageDataUrl: photoDataUrl })
  }

  function clickVerificarColaboradores() {
    // Send WhatsApp to client immediately
    if (cardNumero) {
      fetch(`https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1/notify-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}` },
        body: JSON.stringify({
          numero: cardNumero,
          nome: cardClientName || 'Cliente',
          peca: piece.name,
          status: 'verificando-colaboradores',
        }),
      }).catch(() => {})
    }
    addMessage(cardId, {
      sender: 'ai', type: 'text',
      content: `📲 Mensagem enviada ao cliente: "No momento não tenho a peça *${piece.name}* no estoque, mas já estou verificando com os colaboradores. Assim que tiver resposta, já te aviso!"`,
    })
    setCollabMode(true)
  }

  function assignCollab(collabId) {
    updatePiece(cardId, piece.id, { collaboratorId: collabId })
    setSelectedCollab(collabId)
    setQuickCollab(false)
  }

  function saveCollabReply() {
    if (!replyCollabId || !replyCost) return
    const co = collaborators.find(c => c.id === replyCollabId)
    const costVal = parseFloat(replyCost)

    const novaResposta = {
      collabId: replyCollabId,
      collabName: co?.name || 'Colaborador',
      collabStore: co?.store || '',
      collabPhone: co?.phone || '',
      cost: costVal,
      note: replyNote,
      respondedAt: new Date().toISOString(),
    }

    const respostasAtuais = piece.collabResponses || []
    const todasRespostas = [...respostasAtuais, novaResposta]

    // Best (cheapest) collab becomes the assigned collaborator
    const melhor = [...todasRespostas].sort((a, b) => a.cost - b.cost)[0]

    updatePiece(cardId, piece.id, {
      collaboratorId: melhor.collabId,
      collabResponses: todasRespostas,
      price: { ...(piece.price || {}), collaboratorCost: melhor.cost },
      status: 'waiting-price',
    })

    addMessage(cardId, {
      sender: 'collaborator',
      type: 'text',
      collabName: co?.name,
      collabPhone: co?.phone,
      content: `Tenho a peça *${piece.name}*.\n\n💵 Valor: R$ ${costVal.toFixed(2)}${replyNote ? `\n\n${replyNote}` : ''}`,
    })

    setCollabReply(false)
    setReplyCollabId('')
    setReplyCost('')
    setReplyNote('')
    // Auto-open price form to set client price
    setPriceMode(true)
  }

  function savePrice() {
    if (!prices.cash && !prices.pix && !prices.card) return
    updatePieceStatus(cardId, piece.id, 'found', {
      cash: parseFloat(prices.cash) || null,
      pix:  parseFloat(prices.pix)  || null,
      card: parseFloat(prices.card) || null,
      collaboratorCost: parseFloat(prices.collaboratorCost) || null,
      collaboratorId: selectedCollab || null,
    })
    setPriceMode(false)
  }

  function requestPhoto() {
    const collabName = collab ? collab.name : 'colaborador'
    updatePiece(cardId, piece.id, { photoRequested: true })
    addMessage(cardId, {
      sender: 'ai',
      type: 'text',
      content: `📸 Foto da peça *${piece.name}* foi solicitada ao colaborador ${collabName}.\n\nAguardando recebimento para encaminhar ao cliente.`,
    })
  }

  function confirmPhoto() {
    updatePiece(cardId, piece.id, { photoConfirmed: true })
  }

  function forwardPhoto() {
    addMessage(cardId, {
      sender: 'ai',
      type: 'photo',
      content: `📷 Foto da peça enviada: ${piece.name}`,
    })
    updatePiece(cardId, piece.id, { photoForwarded: true })
  }

  const canShowPhoto = piece.status === 'found' || piece.status === 'waiting-price'

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* Piece header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
          <p className="font-bold text-base text-gray-800 truncate">{piece.name}</p>
          {piece.sku && <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md shrink-0">{piece.sku}</span>}
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 ml-2" style={{ backgroundColor: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Prices */}
        {piece.price && (
          <div className="grid grid-cols-3 gap-2">
            {[['💵','Dinheiro','cash','#f0fdf4','#15803d'],['📲','Pix','pix','#eff6ff','#1d4ed8'],['💳','Cartão','card','#f5f3ff','#6d28d9']].map(([ico,lbl,key,bg,clr]) => piece.price[key] ? (
              <div key={key} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: bg }}>
                <p className="text-base font-black" style={{ color: clr }}>R$ {piece.price[key]}</p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: clr, opacity: 0.75 }}>{ico} {lbl}</p>
              </div>
            ) : null)}
          </div>
        )}

        {/* Collaborator responses — ordered list */}
        {piece.collabResponses?.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-orange-100">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-orange-50" style={{ background: '#fff7ed' }}>
              <Users size={12} className="text-orange-500" />
              <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider">
                {piece.collabResponses.length} loja{piece.collabResponses.length > 1 ? 's' : ''} respondeu
              </p>
            </div>
            {[...piece.collabResponses]
              .sort((a, b) => a.cost - b.cost)
              .map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 last:border-0 bg-white">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ background: i === 0 ? '#16a34a' : '#94a3b8' }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{r.collabName}</p>
                      {r.collabStore && <p className="text-[11px] text-gray-400 truncate">{r.collabStore}</p>}
                      {r.note && <p className="text-[11px] text-gray-500 italic truncate">{r.note}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-black" style={{ color: i === 0 ? '#16a34a' : '#64748b' }}>
                      R$ {r.cost.toFixed(2)}
                    </p>
                    {i === 0 && (
                      <p className="text-[9px] font-bold text-green-600 uppercase">melhor</p>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Collaborator that has the piece */}
        {collab ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
            <Users size={13} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-blue-700 truncate">👤 {collab.name}</p>
              <p className="text-[11px] text-blue-500">{collab.phone}</p>
            </div>
            {piece.price?.collaboratorCost && (
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                Custo R${piece.price.collaboratorCost}
              </span>
            )}
            <button onClick={() => setQuickCollab(v => !v)}
              className="text-[10px] font-bold text-gray-400 hover:text-blue-600 ml-1 shrink-0 transition-colors">
              trocar
            </button>
          </div>
        ) : (
          <button onClick={() => setQuickCollab(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors w-full"
            style={{ background: '#eff6ff', color: '#2563eb', border: '1px dashed #bfdbfe' }}>
            <Users size={12} /> Definir colaborador que tem a peça
          </button>
        )}

        {/* Quick collaborator selector */}
        {quickCollab && (
          <div className="rounded-xl overflow-hidden border border-blue-200 bg-white shadow-sm">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider px-3 pt-2.5 pb-1.5 border-b border-blue-100">Selecionar colaborador</p>
            {collaborators.map(co => (
              <button key={co.id} onClick={() => assignCollab(co.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-left">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[11px] font-black text-blue-600 shrink-0">
                  {co.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{co.name}</p>
                  <p className="text-[11px] text-gray-400">{co.store} · {co.neighborhood}</p>
                </div>
                {piece.collaboratorId === co.id && <CheckCircle size={13} className="text-blue-500 shrink-0" />}
              </button>
            ))}
            <button onClick={() => setQuickCollab(false)}
              className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              cancelar
            </button>
          </div>
        )}

        {/* Photo flow */}
        {canShowPhoto && !piece.photoForwarded && (
          <div className="space-y-2">
            {!photoRequested && (
              <button onClick={requestPhoto}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors">
                <Image size={14} /> Solicitar Foto ao Colaborador
              </button>
            )}
            {photoRequested && !photoConfirmed && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <Clock size={13} className="text-amber-500" />
                  <p className="text-xs font-semibold text-amber-700">Aguardando foto do colaborador...</p>
                </div>
                <button onClick={confirmPhoto}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                  <CheckCircle size={14} /> Confirmar que Recebi a Foto
                </button>
              </div>
            )}
            {photoConfirmed && (
              <button onClick={forwardPhoto}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 3px 10px rgba(109,40,217,0.3)' }}>
                <Send size={14} /> Encaminhar Foto ao Cliente
              </button>
            )}
          </div>
        )}
        {piece.photoForwarded && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle size={13} className="text-green-500" />
            <p className="text-xs font-semibold text-green-700">Foto encaminhada ao cliente</p>
          </div>
        )}

        {/* Price form */}
        {priceMode && (
          <div className="space-y-2">
            {/* Block 1 — Collaborator */}
            <div className="p-3 rounded-xl space-y-2.5" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider">🤝 Colaborador</p>

              <div>
                <p className="text-[11px] text-orange-600 mb-1 font-semibold">Quem tem a peça</p>
                <select value={selectedCollab} onChange={e => setSelectedCollab(e.target.value)}
                  className="w-full text-sm rounded-lg px-2 py-2 text-gray-700 bg-white border border-orange-200 focus:outline-none">
                  <option value="">Selecionar colaborador</option>
                  {collaborators.map(c => <option key={c.id} value={c.id}>{c.name} — {c.neighborhood}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[11px] text-orange-600 mb-1 font-semibold">💵 Valor cobrado pelo colaborador (dinheiro)</p>
                <input type="number" placeholder="R$ valor do colaborador"
                  value={prices.collaboratorCost}
                  onChange={e => setPrices(p => ({ ...p, collaboratorCost: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white border border-orange-200 font-bold" />
              </div>
            </div>

            {/* Block 2 — Client repasse */}
            <div className="p-3 rounded-xl space-y-2.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-[11px] font-black text-green-700 uppercase tracking-wider">💰 Preço de Repasse ao Cliente</p>
              <div className="grid grid-cols-3 gap-2">
                {[['💵','Dinheiro','cash'],['📲','Pix','pix'],['💳','Cartão','card']].map(([ico,lbl,key]) => (
                  <div key={key}>
                    <p className="text-[11px] text-green-600 mb-1 font-semibold">{ico} {lbl}</p>
                    <input type="number" placeholder="R$" value={prices[key]}
                      onChange={e => setPrices(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full text-sm rounded-lg px-2 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 bg-white border border-green-200 font-bold" />
                  </div>
                ))}
              </div>

              {prices.collaboratorCost && prices.cash && (
                <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-green-200">
                  <p className="text-[11px] text-gray-500 font-semibold">Margem no dinheiro:</p>
                  <p className="text-sm font-black text-green-700">
                    R$ {(parseFloat(prices.cash) - parseFloat(prices.collaboratorCost)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={savePrice} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl font-bold transition-colors">Salvar preço</button>
              <button onClick={() => setPriceMode(false)} className="px-4 py-2.5 text-sm rounded-xl text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
            </div>
          </div>
        )}

        {/* Collaborators mode */}
        {collabMode && (
          <div className="p-3 bg-gray-50 rounded-xl space-y-2">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Enviar para colaboradores</p>
            {collaborators.map(co => (
              <label key={co.id} className="flex items-center gap-2.5 cursor-pointer py-1.5 border-b border-gray-100 last:border-0">
                <input type="checkbox" checked={sentCollabs.includes(co.id)} onChange={() => setSentCollabs(prev => prev.includes(co.id) ? prev.filter(x => x !== co.id) : [...prev, co.id])} className="accent-blue-600 w-4 h-4" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 font-semibold">{co.name}</p>
                  <p className="text-[11px] text-gray-400">{co.store} · {co.responseTime}min</p>
                </div>
                {sentCollabs.includes(co.id) && <span className="text-[11px] text-green-600 font-bold shrink-0">✓ Enviado</span>}
              </label>
            ))}
            <button onClick={() => setCollabMode(false)} className="w-full py-2 text-sm rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">Confirmar envio</button>
          </div>
        )}

        {/* ── Register collaborator reply ── */}
        {!priceMode && !collabMode && (piece.status === 'searching' || piece.status === 'not-found') && (
          collabReply ? (
            <div className="rounded-xl p-3 space-y-2.5" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
              <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider">📲 Resposta do Colaborador</p>

              <div>
                <p className="text-[11px] text-orange-600 mb-1 font-semibold">Quem respondeu</p>
                <select value={replyCollabId} onChange={e => setReplyCollabId(e.target.value)}
                  className="w-full text-sm rounded-lg px-2 py-2 text-gray-700 bg-white border border-orange-200 focus:outline-none">
                  <option value="">Selecionar colaborador</option>
                  {collaborators.map(c => <option key={c.id} value={c.id}>{c.name} — {c.neighborhood}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[11px] text-orange-600 mb-1 font-semibold">💵 Valor cobrado (dinheiro)</p>
                <input type="number" placeholder="R$ valor informado pelo colaborador"
                  value={replyCost} onChange={e => setReplyCost(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 text-gray-800 placeholder:text-gray-400 bg-white border border-orange-200 font-bold focus:outline-none focus:ring-2 focus:ring-orange-200" />
              </div>

              <div>
                <p className="text-[11px] text-orange-600 mb-1 font-semibold">Observação (opcional)</p>
                <input placeholder="Ex: Saiu de sucata, entrega hoje..."
                  value={replyNote} onChange={e => setReplyNote(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 text-gray-700 placeholder:text-gray-400 bg-white border border-orange-200 focus:outline-none" />
              </div>

              <div className="flex gap-2">
                <button onClick={saveCollabReply} disabled={!replyCollabId || !replyCost}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)' }}>
                  ✓ Registrar Resposta
                </button>
                <button onClick={() => setCollabReply(false)}
                  className="px-4 py-2.5 text-sm rounded-xl text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCollabReply(true)}
              className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl font-bold transition-all"
              style={{ background: '#fff7ed', color: '#c2410c', border: '1.5px solid #fed7aa' }}>
              📲 Registrar Resposta de Colaborador
            </button>
          )
        )}

        {/* Primary action buttons — Tenho / Verificar com colaboradores */}
        {!priceMode && !collabMode && !collabReply && (piece.status === 'not-found' || piece.status === 'searching') && (
          <div className="flex gap-2">
            <button onClick={() => { updatePieceStatus(cardId, piece.id, 'waiting-price'); setPriceMode(true) }}
              className="flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-2xl font-black text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 14px rgba(22,163,74,0.4)' }}>
              ✅ Tenho
            </button>
            <button onClick={clickVerificarColaboradores}
              className="flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-2xl font-black text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
              <Users size={14} /> Verificar com colaboradores
            </button>
          </div>
        )}

        {/* Photo sections — visible when piece is found or waiting-price */}
        {(piece.status === 'found' || piece.status === 'waiting-price' || piece.status === 'delivered') && (
          <div className="space-y-3 pt-1">
            {/* Store photo */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
                <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">📷 Foto do produto — Loja</p>
                <label className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">
                  {storePhoto ? 'Trocar' : '+ Adicionar'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload('store', e)} />
                </label>
              </div>
              {storePhoto ? (
                <div className="relative">
                  <img src={storePhoto} alt="foto loja" className="w-full max-h-40 object-cover" />
                  {canApproveMedia ? (
                    <button onClick={() => sendPhotoToClient(storePhoto, `Foto da peça: ${piece.name}`)}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs font-black text-white px-3 py-1.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      <Send size={11} /> Enviar ao cliente
                    </button>
                  ) : (
                    <div className="absolute bottom-2 right-2 text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded-lg">
                      Aguard. aprovação
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera size={24} className="text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">Clique para adicionar foto</p>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload('store', e)} />
                </label>
              )}
            </div>

            {/* Collaborator photo */}
            <div className="rounded-2xl overflow-hidden border border-orange-100 bg-white">
              <div className="flex items-center justify-between px-3 py-2 border-b border-orange-50">
                <p className="text-[11px] font-black text-orange-600 uppercase tracking-wider">📷 Foto do produto — Colaborador</p>
                <label className="text-[11px] font-bold text-orange-500 cursor-pointer hover:underline">
                  {collabPhoto ? 'Trocar' : '+ Adicionar'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload('collab', e)} />
                </label>
              </div>
              {collabPhoto ? (
                <div className="relative">
                  <img src={collabPhoto} alt="foto colaborador" className="w-full max-h-40 object-cover" />
                  {canApproveMedia ? (
                    <button onClick={() => sendPhotoToClient(collabPhoto, `Foto da peça: ${piece.name}`)}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs font-black text-white px-3 py-1.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      <Send size={11} /> Enviar ao cliente
                    </button>
                  ) : (
                    <div className="absolute bottom-2 right-2 text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded-lg">
                      Aguard. aprovação
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-orange-50 transition-colors">
                  <Camera size={24} className="text-orange-200 mb-1" />
                  <p className="text-xs text-orange-300">Clique para adicionar foto do colaborador</p>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload('collab', e)} />
                </label>
              )}
            </div>
          </div>
        )}
        {!priceMode && !collabMode && (piece.status === 'waiting-price' || (piece.status === 'found' && !piece.price)) && (
          <button onClick={() => setPriceMode(true)}
            className="w-full flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
            <DollarSign size={14} /> Inserir Preço de Repasse
          </button>
        )}
      </div>
    </div>
  )
}

function PaymentTotal({ pieces, addMessage, cardId }) {
  const [freight, setFreight] = useState(0)
  const numericZones = FREIGHT_TABLE.filter(r => r.value !== null)

  const totals = { cash: 0, pix: 0, card: 0 }
  let hasPrices = false
  pieces.forEach(p => {
    if (p.price) {
      hasPrices = true
      if (p.price.cash) totals.cash += p.price.cash
      if (p.price.pix)  totals.pix  += p.price.pix
      if (p.price.card) totals.card += p.price.card
    }
  })

  if (!hasPrices) return null

  function sendToClient() {
    const lines = []
    if (totals.cash) lines.push(`💵 Dinheiro: R$ ${(totals.cash + freight).toFixed(2)}`)
    if (totals.pix)  lines.push(`📲 Pix: R$ ${(totals.pix + freight).toFixed(2)}`)
    if (totals.card) lines.push(`💳 Cartão: R$ ${(totals.card + freight).toFixed(2)}`)
    if (freight > 0) lines.push(`🚚 Frete: R$ ${freight},00`)
    const msg = `Segue o orçamento:\n\n${pieces.filter(p=>p.price).map(p=>`• ${p.name}`).join('\n')}\n\n${lines.join('\n')}${freight > 0 ? '\n\n*(Frete já incluso nos valores acima)*' : '\n\nObservação: Desconto apenas no pagamento em dinheiro.'}`
    addMessage(cardId, { sender: 'ai', type: 'text', content: msg })
  }

  return (
    <div className="shrink-0 border-t-2 border-green-100 bg-green-50 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black text-green-700 uppercase tracking-wider">💰 Total do Pedido</p>
        <div className="flex items-center gap-2">
          <Truck size={12} className="text-gray-500" />
          <select value={freight} onChange={e => setFreight(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none">
            <option value={0}>Sem frete</option>
            {numericZones.map((r,i) => <option key={i} value={r.value}>{r.zone} — R${r.value}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[['💵','Dinheiro',totals.cash,'#15803d','#f0fdf4'],['📲','Pix',totals.pix,'#1d4ed8','#eff6ff'],['💳','Cartão',totals.card,'#6d28d9','#f5f3ff']].map(([ico,lbl,val,clr,bg]) => val > 0 ? (
          <div key={lbl} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: bg }}>
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: clr, opacity: 0.7 }}>{ico} {lbl}</p>
            <p className="text-lg font-black" style={{ color: clr }}>R$ {(val + freight).toFixed(2)}</p>
          </div>
        ) : null)}
      </div>
      <button onClick={sendToClient}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
        <MessageCircle size={15} /> Enviar Orçamento pro Cliente
      </button>
    </div>
  )
}

function InfoTab({ card }) {
  const { collaborators, addMessage, employees } = useApp()
  const [saveContactMode, setSaveContactMode] = useState({})
  const [contactInputs, setContactInputs] = useState({})
  const [stockistSent, setStockistSent] = useState(false)

  const foundPieces    = card.pieces.filter(p => p.status === 'found' || p.status === 'waiting-price' || p.status === 'delivered')
  const missingPieces  = card.pieces.filter(p => p.status === 'not-found' || p.status === 'searching')
  const waitingPieces  = card.pieces.filter(p => p.status === 'waiting-price')

  const collabIds = [...new Set(card.pieces.filter(p => p.collaboratorId).map(p => p.collaboratorId))]
  const involvedCollabs = collabIds.map(id => collaborators.find(c => c.id === id)).filter(Boolean)

  const totalCash = foundPieces.reduce((s, p) => s + (p.price?.cash || 0), 0)
  const totalPix  = foundPieces.reduce((s, p) => s + (p.price?.pix  || 0), 0)
  const totalCost = foundPieces.reduce((s, p) => s + (p.price?.collaboratorCost || 0), 0)

  const sellers   = employees.filter(e => e.role === 'Vendedor' || e.role === 'Consultora')
  const stockists = employees.filter(e => e.role === 'Estoquista')

  function notifyStockist() {
    const pieceList = card.pieces.map(p => `• ${p.name}${p.sku ? ` [${p.sku}]` : ''}`).join('\n')
    const msg = `📦 *SEPARAÇÃO — ${card.client.name}*\n\nVeículo: ${card.vehicle ? `${card.vehicle.brand} ${card.vehicle.model} ${card.vehicle.year}` : 'N/A'}\n\nPeças para separar:\n${pieceList}\n\nLevar à loja para envio ao cliente.\n\n✅ Cliente confirmou pagamento.`
    addMessage(card.id, { sender: 'ai', type: 'text', content: msg })
    setStockistSent(true)
  }

  return (
    <div className="p-4 space-y-4">

      {/* Pieces summary */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Package size={14} className="text-blue-500" />
          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Resumo das Peças</p>
        </div>

        {/* Found pieces */}
        {foundPieces.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <p className="text-[11px] font-black text-green-600 uppercase tracking-wider mb-2">✅ Encontradas ({foundPieces.length})</p>
            {foundPieces.map(p => {
              const collab = collaborators.find(c => c.id === p.collaboratorId)
              return (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                    {collab && <p className="text-[11px] text-gray-400 mt-0.5">🤝 {collab.name}</p>}
                    {p.price?.collaboratorCost && (
                      <p className="text-[11px] text-orange-500 mt-0.5">Custo: R$ {p.price.collaboratorCost}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {p.price?.cash && <p className="text-sm font-black text-green-700">R$ {p.price.cash}</p>}
                    {p.price?.cash && p.price?.collaboratorCost && (
                      <p className="text-[11px] text-emerald-500 font-semibold">
                        +R${(p.price.cash - p.price.collaboratorCost).toFixed(0)} margem
                      </p>
                    )}
                    {!p.price && <span className="text-[11px] text-amber-600 font-semibold">Sem preço</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Missing pieces */}
        {missingPieces.length > 0 && (
          <div className="px-4 pt-3 pb-3 border-t border-gray-50">
            <p className="text-[11px] font-black text-red-500 uppercase tracking-wider mb-2">❌ Buscando / Não Encontradas ({missingPieces.length})</p>
            {missingPieces.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <p className="text-sm text-gray-600 truncate">{p.name}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0"
                  style={{ backgroundColor: p.status === 'not-found' ? '#fee2e2' : '#fef9c3', color: p.status === 'not-found' ? '#dc2626' : '#a16207' }}>
                  {p.status === 'not-found' ? 'Sem oferta' : 'Buscando'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {totalCash > 0 && (
          <div className="px-4 py-3 bg-green-50 border-t border-green-100">
            <p className="text-[11px] font-black text-green-700 uppercase tracking-wider mb-2">Total cliente pagará</p>
            <div className="flex gap-3">
              {totalCash > 0 && <div><p className="text-lg font-black text-green-700">R$ {totalCash.toFixed(2)}</p><p className="text-[10px] text-green-500">💵 Dinheiro</p></div>}
              {totalPix  > 0 && <div><p className="text-lg font-black text-blue-700">R$ {totalPix.toFixed(2)}</p><p className="text-[10px] text-blue-500">📲 Pix</p></div>}
              {totalCost > 0 && (
                <div className="ml-auto text-right">
                  <p className="text-sm font-black text-orange-600">-R$ {totalCost.toFixed(2)}</p>
                  <p className="text-[10px] text-orange-400">Custo total</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Involved collaborators */}
      {involvedCollabs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <Users size={14} className="text-orange-500" />
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Colaboradores Envolvidos</p>
          </div>
          {involvedCollabs.map(co => {
            const needsContact = !co.phone
            const needsAddress = !co.neighborhood
            const isSavingContact = saveContactMode[co.id]
            return (
              <div key={co.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-gray-800 text-sm">{co.name}</p>
                  <span className="text-[10px] font-semibold text-gray-400">{co.store}</span>
                </div>
                <div className="space-y-1">
                  {co.phone
                    ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><Phone size={10} className="text-green-500" />{co.phone}</div>
                    : <div className="flex items-center gap-1.5 text-xs text-amber-600"><AlertCircle size={10} /><span>Sem telefone salvo</span></div>
                  }
                  {co.neighborhood
                    ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><MapPin size={10} className="text-blue-400" />{co.neighborhood}{co.inRio ? '' : `, ${co.city}`}</div>
                    : <div className="flex items-center gap-1.5 text-xs text-amber-600"><AlertCircle size={10} /><span>Sem endereço salvo</span></div>
                  }
                </div>
                {(needsContact || needsAddress) && !isSavingContact && (
                  <button onClick={() => setSaveContactMode(p => ({ ...p, [co.id]: true }))}
                    className="mt-2 text-[11px] font-bold text-blue-600 hover:underline">
                    + Salvar dados do colaborador
                  </button>
                )}
                {isSavingContact && (
                  <div className="mt-2 space-y-1.5">
                    <input placeholder="Telefone / WhatsApp" value={contactInputs[co.id + '_phone'] || ''}
                      onChange={e => setContactInputs(p => ({ ...p, [co.id + '_phone']: e.target.value }))}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 focus:outline-none" />
                    <input placeholder="Endereço / Bairro" value={contactInputs[co.id + '_addr'] || ''}
                      onChange={e => setContactInputs(p => ({ ...p, [co.id + '_addr']: e.target.value }))}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 focus:outline-none" />
                    <button className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Sellers on this order */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Users size={14} className="text-blue-500" />
          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Vendedores</p>
        </div>
        {sellers.map(emp => (
          <div key={emp.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-700">{emp.avatar}</div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{emp.name}</p>
                <p className="text-[10px] text-gray-400">{emp.role}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${emp.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {emp.available ? 'Disponível' : 'Ocupado'}
            </span>
          </div>
        ))}
      </div>

      {/* Stockist notification */}
      {(card.column === 'aguardando-envio' || card.column === 'peca-encontrada') && (
        <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(124,58,237,0.08)' }}>
          <div className="px-4 py-3 border-b border-purple-50 flex items-center gap-2">
            <Package size={14} className="text-purple-500" />
            <p className="text-xs font-black text-purple-700 uppercase tracking-wider">Estoquista / Separação</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 mb-3">
              Notifique o estoquista para separar as peças e levar à loja para envio ao cliente.
            </p>
            {stockists.length > 0 && (
              <div className="mb-3">
                {stockists.map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-[10px] font-bold text-purple-700">{e.avatar}</div>
                    {e.name} — {e.role}
                  </div>
                ))}
              </div>
            )}
            {!stockistSent ? (
              <button onClick={notifyStockist}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 3px 10px rgba(109,40,217,0.25)' }}>
                <Package size={14} /> Notificar Estoquista para Separar
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle size={14} className="text-green-500" />
                <p className="text-sm font-bold text-green-700">Estoquista notificado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CardModal({ card, onClose }) {
  const { columns, moveCard, addMessage, confirmCardPayment, can, currentUser } = useApp()
  const canChat = can('sales') || currentUser?.role === 'admin'
  const [tab,   setTab]   = useState(canChat ? 'chat' : 'pieces')
  const [reply, setReply] = useState('')
  const col = columns.find(c => c.id === card.column)

  function sendReply() {
    if (!reply.trim()) return
    addMessage(card.id, { sender: 'system', type: 'text', content: reply })
    setReply('')
  }

  const piecesWithPrice = card.pieces.filter(p => p.price)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div
        className="bg-white w-full md:w-[700px] md:max-w-[96vw] max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden slide-up"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)', border: '1px solid #e2e8f0' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-700 text-xl shrink-0">
            {card.client.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-black text-gray-900 text-lg truncate leading-tight">{card.client.name}</p>
              {card.client.isReturning && (
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold shrink-0">⭐ Recorrente</span>
              )}
              {card.client.type && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold shrink-0">{card.client.type}</span>
              )}
            </div>
            {card.vehicle && (
              <div className="flex items-center gap-1.5">
                <Car size={13} className="text-gray-400" />
                <p className="text-sm font-bold text-gray-600">{card.vehicle.brand} {card.vehicle.model} <span className="text-blue-600">{card.vehicle.year}</span></p>
              </div>
            )}
            {card.client.phone && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone size={11} className="text-green-500" />
                <p className="text-xs text-gray-500">{card.client.phone}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select value={card.column} onChange={e => moveCard(card.id, e.target.value)}
                className="appearance-none pl-2 pr-6 py-1.5 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-blue-300 font-semibold">
                {columns.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* AI strip */}
        {(card.ai.audioConverted || card.ai.photoAnalyzed || card.ai.codeIdentified) && (
          <div className="bg-violet-50 border-b border-violet-100 px-5 py-2 flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-wider">IA</span>
            {card.ai.audioConverted && (
              <div className="flex items-center gap-1 text-[11px] text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full font-medium">
                <Mic size={10} /> Áudio convertido
              </div>
            )}
            {card.ai.photoAnalyzed && (
              <div className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                <Camera size={10} /> Foto analisada
              </div>
            )}
            {card.ai.codeIdentified && (
              <div className="flex items-center gap-1 text-[11px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full font-mono">
                <Hash size={10} /> {card.ai.codeIdentified}
              </div>
            )}
          </div>
        )}

        {/* ── Aguardando Repasse banner ── */}
        {card.column === 'aguardando-repasse' && (
          <div className="shrink-0 px-5 py-3 flex items-center justify-between gap-3"
            style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', borderBottom: '1px solid #fecdd3' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: '#fda4af' }}>
                💳
              </div>
              <div>
                <p className="text-sm font-black text-rose-800">Aguardando Pagamento do Cliente</p>
                <p className="text-[11px] text-rose-500">Card bloqueado até confirmação do repasse</p>
              </div>
            </div>
            <button
              onClick={() => confirmCardPayment(card.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 shrink-0"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 3px 10px rgba(22,163,74,0.35)' }}>
              <CheckCircle size={15} /> Confirmar Pagamento
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 flex shrink-0">
          {[
            canChat ? ['chat','💬 Conversa'] : null,
            ['pieces','🔧 Peças'],
            ['info','📋 Informações'],
          ].filter(Boolean).map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === id ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>
              {lbl}
              {id === 'pieces' && piecesWithPrice.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black">R$</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {tab === 'chat' && (
            <div className="p-4">
              {card.messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
              {card.messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-10">Nenhuma mensagem ainda</p>
              )}
            </div>
          )}

          {tab === 'pieces' && (
            <div className="p-4 space-y-3">
              {card.pieces.length === 0
                ? <p className="text-center text-gray-400 text-sm py-10">Nenhuma peça registrada</p>
                : card.pieces.map(p => <PieceRow key={p.id} piece={p} cardId={card.id} cardNumero={card.numero} cardClientName={card.client?.name} />)
              }
              {card.collaboratorsSent > 0 && (
                <div className="bg-orange-50 rounded-2xl p-4 flex items-center gap-4 border border-orange-100">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-700">{card.collaboratorsSent} colaboradores notificados</p>
                    <p className="text-xs text-orange-500 mt-0.5">Aguardando resposta dos parceiros</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'info' && <InfoTab card={card} />}
        </div>

        {/* Payment total bar */}
        {tab === 'pieces' && (
          <PaymentTotal pieces={card.pieces} addMessage={addMessage} cardId={card.id} />
        )}

        {/* Reply bar — only for authorized users */}
        {tab === 'chat' && canChat && (
          <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0">
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
              placeholder="Enviar mensagem ao cliente via WhatsApp..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 text-gray-800"
            />
            <button onClick={sendReply}
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0">
              <Send size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
