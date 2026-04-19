export const COLUMNS = [
  { id: 'novo-pedido',      label: 'Novo Pedido',       emoji: '📋', color: '#bfdbfe', accent: '#1d4ed8', textColor: '#1e3a8a' },
  { id: 'em-busca',         label: 'Em Busca',          emoji: '🔍', color: '#fed7aa', accent: '#c2410c', textColor: '#7c2d12' },
  { id: 'peca-encontrada',  label: 'Peça Encontrada',   emoji: '✅', color: '#86efac', accent: '#15803d', textColor: '#14532d' },
  { id: 'aguardando-preco',   label: 'Aguardando Preço',   emoji: '⏳', color: '#fde68a', accent: '#b45309', textColor: '#78350f' },
  { id: 'aguardando-repasse', label: 'Aguardando Repasse', emoji: '💳', color: '#fda4af', accent: '#be123c', textColor: '#881337' },
  { id: 'aguardando-envio',   label: 'Aguardando Envio',   emoji: '🚚', color: '#d8b4fe', accent: '#7c3aed', textColor: '#4c1d95' },
  { id: 'finalizado',       label: 'Finalizado',        emoji: '🏁', color: '#cbd5e1', accent: '#475569', textColor: '#1e293b' },
  { id: 'geisa',            label: 'Painel Geisa',      emoji: '🩷', color: '#f9a8d4', accent: '#be185d', textColor: '#831843' },
  { id: 'reclamacoes',      label: 'Reclamações',       emoji: '⚠️', color: '#fca5a5', accent: '#b91c1c', textColor: '#7f1d1d' },
]

export const EMPLOYEES = [
  { id: 'e1', name: 'Carlos',  avatar: 'C', role: 'Vendedor',    available: true  },
  { id: 'e2', name: 'Ana',     avatar: 'A', role: 'Consultora',  available: true  },
  { id: 'e3', name: 'Pedro',   avatar: 'P', role: 'Vendedor',    available: false },
  { id: 'e4', name: 'Geisa',   avatar: 'G', role: 'Gerente',     available: true, isOwner: true },
  { id: 'e5', name: 'Rodrigo', avatar: 'R', role: 'Estoquista',  available: true  },
]

export const COLLABORATORS = [
  { id: 'co1', name: 'Auto Peças Norte',  store: 'Loja Norte',      phone: '(21) 9 9700-1234', neighborhood: 'Tijuca',  city: 'Rio de Janeiro', inRio: true,  delivery: true,  responseTime: 15 },
  { id: 'co2', name: 'Mecânica do Sul',   store: 'Sul Center',       phone: '(21) 9 9600-9876', neighborhood: 'Bangu',   city: 'Rio de Janeiro', inRio: true,  delivery: false, responseTime: 30 },
  { id: 'co3', name: 'Peças Express',     store: 'Express Niterói',  phone: '(21) 9 9400-5555', neighborhood: 'Icaraí',  city: 'Niterói',        inRio: false, delivery: true,  responseTime: 45 },
  { id: 'co4', name: 'Auto Total',        store: 'Total Duque',      phone: '(21) 9 9300-4444', neighborhood: 'Centro',  city: 'Duque de Caxias',inRio: false, delivery: true,  responseTime: 60 },
  { id: 'co5', name: 'Top Peças',         store: 'Top Méier',        phone: '(21) 9 9100-2222', neighborhood: 'Méier',   city: 'Rio de Janeiro', inRio: true,  delivery: true,  responseTime: 20 },
  { id: 'co6', name: 'Peças & Cia',       store: 'Cia Bonsucesso',   phone: '(21) 9 9200-3333', neighborhood: 'Ramos',   city: 'Rio de Janeiro', inRio: true,  delivery: true,  responseTime: 25 },
]

export const FREIGHT_TABLE = [
  { zone: 'Tijuca / Vila Isabel',            value: 15 },
  { zone: 'Méier / Engenho Novo',            value: 20 },
  { zone: 'Bonsucesso / Ramos',              value: 25 },
  { zone: 'Campo Grande / Bangu',            value: 35 },
  { zone: 'Barra da Tijuca / Recreio',       value: 30 },
  { zone: 'Zona Sul (Copacabana, Ipanema)',  value: 30 },
  { zone: 'Baixada Fluminense',              value: 45 },
  { zone: 'Niterói / São Gonçalo',           value: 40 },
  { zone: 'Outras cidades',                  value: null },
]

const m = (min) => new Date(Date.now() - min * 60 * 1000)

export const INITIAL_CARDS = [
  {
    id: 'c1', column: 'novo-pedido', priority: 'normal',
    client: { name: 'João Silva', phone: '21999887766', isReturning: true, type: 'Oficina', address: 'R. das Flores, 123 - Tijuca, RJ' },
    vehicle: { brand: 'Toyota',     model: 'Corolla', year: '2018' },
    pieces: [
      { id: 'p1', name: 'Farol Dianteiro Esquerdo', status: 'searching', price: null, assignedTo: 'e1' },
    ],
    messages: [
      { id: 'm1', sender: 'client', type: 'text',  content: 'Olá, preciso de um farol do Corolla 2018',                                                            time: m(5)  },
      { id: 'm2', sender: 'ai',     type: 'text',  content: 'Olá, João.\n\nAmigo, que bom ter você aqui novamente.\n\nComo posso te ajudar?',                        time: m(5)  },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 0, createdAt: m(5),
  },
  {
    id: 'c2', column: 'novo-pedido', priority: 'normal',
    client: { name: 'Fernanda Lima',  phone: '21988001234', isReturning: false, type: 'Oficina', address: 'Av. Brasil, 456 - Bangu, RJ' },
    vehicle: { brand: 'Honda',      model: 'Civic',   year: '2021' },
    pieces: [
      { id: 'p2', name: 'Para-choque Traseiro',    status: 'searching', price: null, assignedTo: 'e2' },
      { id: 'p3', name: 'Sensor de Estacionamento',status: 'searching', price: null, assignedTo: 'e2' },
    ],
    messages: [
      { id: 'm3', sender: 'client', type: 'audio', content: 'preciso de um para-choque do civic 2021',                                                                time: m(8)  },
      { id: 'm4', sender: 'ai',     type: 'text',  content: 'Recebi sua mensagem.\n\nJá converti as informações para nossa equipe verificar para você.',               time: m(8)  },
    ],
    ai: { audioConverted: true, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 0, createdAt: m(8),
  },
  {
    id: 'c3', column: 'aguardando-preco', priority: 'normal',
    client: { name: 'Roberto Alves',  phone: '21977002345', isReturning: false },
    vehicle: { brand: 'Chevrolet',  model: 'Onix',    year: '2022' },
    pieces: [
      { id: 'p4', name: 'Farol de Milha', status: 'waiting-price', price: null, assignedTo: 'e1' },
    ],
    messages: [
      { id: 'm5', sender: 'client', type: 'photo', content: 'foto_farol_onix.jpg',                                                                                    time: m(25) },
      { id: 'm6', sender: 'ai',     type: 'text',  content: 'Recebi a imagem.\n\nJá estou analisando para localizar a peça correta para você.',                        time: m(25) },
    ],
    ai: { audioConverted: false, photoAnalyzed: true, codeIdentified: 'ABD-43921' },
    collaboratorsSent: 0, createdAt: m(25),
  },
  {
    id: 'c4', column: 'em-busca', priority: 'urgent',
    client: { name: 'Maria Santos',   phone: '21966003456', isReturning: false },
    vehicle: { brand: 'Volkswagen', model: 'Gol',     year: '2019' },
    pieces: [
      { id: 'p5', name: 'Retrovisor Esquerdo', status: 'not-found', price: null, assignedTo: 'e2' },
      { id: 'p6', name: 'Vidro Retrovisor',    status: 'not-found', price: null, assignedTo: 'e2' },
    ],
    messages: [
      { id: 'm7', sender: 'client', type: 'text',  content: 'O retrovisor do meu Gol foi quebrado ontem, preciso urgente',                                            time: m(40) },
      { id: 'm8', sender: 'ai',     type: 'text',  content: 'Não se preocupe.\n\nEstamos verificando com nossos colaboradores para localizar o máximo de peças possível para você.', time: m(38) },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 5, createdAt: m(40),
  },
  {
    id: 'c5', column: 'em-busca', priority: 'normal',
    client: { name: 'Paulo Mendes',   phone: '21955004567', isReturning: true  },
    vehicle: { brand: 'Ford',       model: 'Ka',      year: '2020' },
    pieces: [
      { id: 'p7', name: 'Farol Dianteiro', status: 'found',     price: { cash: 380, pix: 420, card: 420, collaboratorCost: 290 }, sku: 'FAR-KA-20-E', collaboratorId: 'co1', assignedTo: 'e1' },
      { id: 'p8', name: 'Grade Frontal',   status: 'not-found', price: null,                               sku: 'GRD-KA-20',   assignedTo: 'e1' },
      { id: 'p9', name: 'Moldura do Farol',status: 'found',     price: { cash:  90, pix: 100, card: 100, collaboratorCost: 65 },  sku: 'MOL-KA-20',   collaboratorId: 'co5', assignedTo: 'e1' },
    ],
    messages: [
      { id: 'm9', sender: 'client', type: 'text', content: 'Preciso de farol, grade e moldura do Ka 2020', time: m(55) },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 3, createdAt: m(55),
  },
  {
    id: 'c6', column: 'peca-encontrada', priority: 'normal',
    client: { name: 'Carla Ferreira', phone: '21944005678', isReturning: false },
    vehicle: { brand: 'Fiat',       model: 'Uno',     year: '2017' },
    pieces: [
      { id: 'p10', name: 'Caixa de Direção', status: 'found', price: { cash: 350, pix: 390, card: 390 }, assignedTo: 'e3' },
    ],
    messages: [
      { id: 'm10', sender: 'client', type: 'text', content: 'Preciso da caixa de direção do Uno 2017',                                                                time: m(90) },
      { id: 'm11', sender: 'ai',     type: 'text', content: 'Localizamos a peça solicitada.\n\nSegue a foto para sua conferência.',                                    time: m(30) },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: '7D1-CX892' },
    collaboratorsSent: 2, createdAt: m(90),
  },
  {
    id: 'c7', column: 'aguardando-repasse', priority: 'normal',
    client: { name: 'Marcos Oliveira',phone: '21933006789', isReturning: true  },
    vehicle: { brand: 'Hyundai',    model: 'HB20',    year: '2021' },
    pieces: [
      { id: 'p11', name: 'Amortecedor Dianteiro', status: 'found', price: { cash: 280, pix: 310, card: 310 }, assignedTo: 'e1' },
    ],
    messages: [
      { id: 'm12', sender: 'ai',     type: 'text', content: 'Segue as formas de pagamento disponíveis:\n\n💵 Dinheiro: R$ 280\n📲 Pix: R$ 310\n💳 Cartão: R$ 310\n\n🚚 Taxa de frete: R$ 35\n\nObservação: O desconto é aplicado exclusivamente para pagamento em dinheiro.', time: m(20) },
      { id: 'm13', sender: 'client', type: 'text', content: 'Vou pagar no Pix',                                                                                       time: m(15) },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 1, createdAt: m(120),
    payment: { method: 'pix', value: 310, freight: 35 },
  },
  {
    id: 'c8', column: 'geisa', priority: 'normal',
    client: { name: 'Carlos Eduardo', phone: '21922007890', isReturning: false },
    vehicle: null,
    pieces: [],
    messages: [
      { id: 'm14', sender: 'client', type: 'text', content: 'Preciso falar com a Geisa',                                                                              time: m(10) },
      { id: 'm15', sender: 'ai',     type: 'text', content: 'Olá.\n\nNo momento a Geisa não se encontra disponível, mas posso falar com ela para você.\n\nSeria sobre alguma peça? Posso verificar para você.', time: m(10) },
      { id: 'm16', sender: 'client', type: 'text', content: 'É pessoal',                                                                                              time: m(9)  },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 0, createdAt: m(10),
  },
  {
    id: 'c9', column: 'reclamacoes', priority: 'urgent',
    client: { name: 'Antônio Braga',  phone: '21911008901', isReturning: true  },
    vehicle: { brand: 'Toyota',     model: 'Hilux',   year: '2019' },
    pieces: [],
    messages: [
      { id: 'm17', sender: 'client', type: 'text', content: 'Recebi a peça errada, preciso resolver isso urgente',                                                    time: m(30) },
      { id: 'm18', sender: 'ai',     type: 'text', content: 'Olá, Antônio.\n\nAmigo, que bom ter você aqui novamente.\n\nEntendi sua situação. Vou encaminhar para nossa equipe resolver o mais rápido possível.', time: m(30) },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 0, createdAt: m(30),
  },
  {
    id: 'c11', column: 'aguardando-preco', priority: 'normal',
    client: { name: 'Rafael Souza', phone: '21987654321', isReturning: false, type: 'PF', address: 'R. Conde de Bonfim, 88 - Tijuca, RJ' },
    vehicle: { brand: 'Volkswagen', model: 'Polo', year: '2023' },
    pieces: [
      {
        id: 'p13', name: 'Retrovisor Elétrico Direito', status: 'waiting-price',
        price: null, collaboratorId: 'co1', sku: 'RET-POLO-23-D', assignedTo: 'e1',
      },
    ],
    messages: [
      { id: 'dm1', sender: 'client',       type: 'text',        content: 'Boa tarde! Quebrei o retrovisor do meu Polo 2023, o direito. Tem?',                                                                                       time: m(42) },
      { id: 'dm2', sender: 'ai',           type: 'text',        content: '📋 Olá, Rafael! Recebemos seu pedido.\n\n🔧 Peça solicitada:\n• Retrovisor Elétrico Direito\n\n🚗 Veículo: Volkswagen Polo 2023\n\nEstamos verificando a disponibilidade com nossos colaboradores e retornamos em breve! ⏳', time: m(42) },
      { id: 'dm3', sender: 'ai',           type: 'text',        content: '🔍 Nossa equipe está buscando a peça *Retrovisor Elétrico Direito* para você.\n\nEm breve retornamos com novidades!',                                      time: m(38) },
      { id: 'dm4', sender: 'collaborator', type: 'text',        content: 'Oi! Tenho o retrovisor do Polo 2023 aqui na loja.\n\nÉ o elétrico com pisca? Tá em perfeito estado, saiu de sucata com 12 mil km.\n\nValor: R$ 220 no dinheiro. Posso entregar hoje.',  collabName: 'Auto Peças Norte', collabPhone: '(21) 9 9700-1234', time: m(25) },
      { id: 'dm5', sender: 'ai',           type: 'text',        content: '📋 A peça *Retrovisor Elétrico Direito* foi localizada e estamos aguardando a confirmação do preço.\n\nRetornamos em breve! 🙏',                           time: m(20) },
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 3, createdAt: m(45),
  },
  {
    id: 'c10', column: 'finalizado', priority: 'normal',
    client: { name: 'Luciana Costa',  phone: '21900009012', isReturning: false },
    vehicle: { brand: 'Renault',    model: 'Sandero', year: '2020' },
    pieces: [
      { id: 'p12', name: 'Filtro de Óleo', status: 'delivered', price: { cash: 45, pix: 50, card: 50 }, assignedTo: 'e2' },
    ],
    messages: [
      { id: 'm19', sender: 'client', type: 'text', content: 'Recebi a peça, muito obrigada!',                                                                         time: m(150)},
      { id: 'm20', sender: 'ai',     type: 'text', content: 'Fico feliz que tenha recebido com sucesso!\n\nQualquer coisa, estamos à disposição.',                     time: m(148)},
    ],
    ai: { audioConverted: false, photoAnalyzed: false, codeIdentified: null },
    collaboratorsSent: 0, createdAt: m(200),
    payment: { method: 'cash', value: 45, freight: 0 },
  },
]
