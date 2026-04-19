import { useState } from 'react'
import { X, Search, MapPin, Phone, CheckCircle, Plus, ExternalLink, Send, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TYPES = [
  'Todos',
  // Funilaria & Pintura
  'Funilaria', 'Centro Automotivo', 'Martelinho de Ouro', 'Estética Automotiva', 'Preparação de Veículos',
  // Mecânica
  'Mecânica', 'Auto Elétrica', 'Alinhamento & Balanceamento', 'Ar Condicionado Auto', 'Suspensão',
  // Redes
  'Bosch Car Service', 'Rede Autorizada', 'Concessionária',
  // Frota & Outros
  'Seguradora', 'Locadora', 'Transportadora / Frota', 'Associação', 'Oficina',
]

const TYPE_GROUPS = {
  'Funilaria & Pintura': ['Funilaria', 'Centro Automotivo', 'Martelinho de Ouro', 'Estética Automotiva', 'Preparação de Veículos'],
  'Mecânica & Elétrica': ['Mecânica', 'Auto Elétrica', 'Alinhamento & Balanceamento', 'Ar Condicionado Auto', 'Suspensão', 'Oficina'],
  'Redes': ['Bosch Car Service', 'Rede Autorizada', 'Concessionária'],
  'Frota & Outros': ['Seguradora', 'Locadora', 'Transportadora / Frota', 'Associação'],
}

const TYPE_COLORS = {
  'Funilaria':                  { bg: '#15803d', text: '#bbf7d0' },
  'Centro Automotivo':          { bg: '#0e7490', text: '#a5f3fc' },
  'Martelinho de Ouro':         { bg: '#065f46', text: '#6ee7b7' },
  'Estética Automotiva':        { bg: '#155e75', text: '#67e8f9' },
  'Preparação de Veículos':     { bg: '#166534', text: '#86efac' },
  'Mecânica':                   { bg: '#b45309', text: '#fde68a' },
  'Auto Elétrica':              { bg: '#92400e', text: '#fcd34d' },
  'Alinhamento & Balanceamento':{ bg: '#78350f', text: '#fbbf24' },
  'Ar Condicionado Auto':       { bg: '#1e3a5f', text: '#93c5fd' },
  'Suspensão':                  { bg: '#7c2d12', text: '#fdba74' },
  'Oficina':                    { bg: '#1d4ed8', text: '#bfdbfe' },
  'Bosch Car Service':          { bg: '#1e1b4b', text: '#a5b4fc' },
  'Rede Autorizada':            { bg: '#312e81', text: '#c7d2fe' },
  'Concessionária':             { bg: '#4c1d95', text: '#ddd6fe' },
  'Seguradora':                 { bg: '#7c3aed', text: '#e9d5ff' },
  'Locadora':                   { bg: '#6d28d9', text: '#ede9fe' },
  'Transportadora / Frota':     { bg: '#5b21b6', text: '#ddd6fe' },
  'Associação':                 { bg: '#c2410c', text: '#fed7aa' },
}

const INITIAL_PROSPECTS = [
  // Funilaria & Pintura
  { id: 1,  name: 'Funilaria do Mário',          type: 'Funilaria',                  address: 'R. Icaraí, 789 - Méier, RJ',              whatsapp: '(21) 9 7700-3456', contacted: false, saved: false },
  { id: 2,  name: 'Speed Funilaria',             type: 'Funilaria',                  address: 'Estr. do Cabral, 88 - Campo Grande, RJ',  whatsapp: '(21) 9 3300-7890', contacted: false, saved: false },
  { id: 3,  name: 'Centro Automotivo Silva',      type: 'Centro Automotivo',          address: 'Av. Brasil, 1200 - Penha, RJ',            whatsapp: '(21) 9 8800-1111', contacted: false, saved: false },
  { id: 4,  name: 'Martelinho Master',            type: 'Martelinho de Ouro',         address: 'R. Conde de Bonfim, 55 - Tijuca, RJ',     whatsapp: '(21) 9 9100-2222', contacted: false, saved: false },
  { id: 5,  name: 'Car Beauty Estética',          type: 'Estética Automotiva',        address: 'Av. Atlântica, 200 - Barra, RJ',          whatsapp: '(21) 9 9200-3333', contacted: false, saved: false },
  { id: 6,  name: 'PrepCar Preparação',           type: 'Preparação de Veículos',     address: 'R. General Canabarro, 10 - Maracanã, RJ', whatsapp: '(21) 9 9300-4444', contacted: false, saved: false },
  // Mecânica & Elétrica
  { id: 7,  name: 'AMS Mecânica Avançada',        type: 'Mecânica',                   address: 'R. General, 321 - Ramos, RJ',             whatsapp: '(21) 9 5500-5678', contacted: true,  saved: true  },
  { id: 8,  name: 'Top Mecânica Diesel',          type: 'Mecânica',                   address: 'R. Marechal, 45 - Madureira, RJ',         whatsapp: '(21) 9 0000-0123', contacted: false, saved: false },
  { id: 9,  name: 'Auto Elétrica Rex',            type: 'Auto Elétrica',              address: 'Av. Brasil, 456 - Bangu, RJ',             whatsapp: '(21) 9 8800-2345', contacted: false, saved: true  },
  { id: 10, name: 'Elétrica do Carlos',           type: 'Auto Elétrica',              address: 'R. Leopoldina, 88 - Méier, RJ',           whatsapp: '(21) 9 8700-5555', contacted: false, saved: false },
  { id: 11, name: 'Alinha Já',                    type: 'Alinhamento & Balanceamento',address: 'Av. Suburbana, 300 - Del Castilho, RJ',   whatsapp: '(21) 9 7600-6666', contacted: false, saved: false },
  { id: 12, name: 'Gelo Auto Ar Condicionado',    type: 'Ar Condicionado Auto',       address: 'R. Dias da Cruz, 50 - Méier, RJ',         whatsapp: '(21) 9 7500-7777', contacted: false, saved: false },
  { id: 13, name: 'Suspensão Total',              type: 'Suspensão',                  address: 'R. Padre Miguel, 120 - Padre Miguel, RJ', whatsapp: '(21) 9 7400-8888', contacted: false, saved: false },
  { id: 14, name: 'Oficina São Jorge',            type: 'Oficina',                    address: 'Estr. do Gabinal, 300 - Vargem, RJ',      whatsapp: '(21) 9 2200-8901', contacted: false, saved: false },
  { id: 15, name: 'Oficina do João',              type: 'Oficina',                    address: 'R. das Flores, 123 - Tijuca, RJ',         whatsapp: '(21) 9 9900-1234', contacted: true,  saved: true  },
  // Redes
  { id: 16, name: 'Bosch Car Service Tijuca',     type: 'Bosch Car Service',          address: 'Av. Maracanã, 987 - Tijuca, RJ',          whatsapp: '(21) 9 6600-9999', contacted: false, saved: false },
  { id: 17, name: 'Bosch Car Service Barra',      type: 'Bosch Car Service',          address: 'Av. das Américas, 3434 - Barra, RJ',      whatsapp: '(21) 9 6500-1010', contacted: false, saved: false },
  { id: 18, name: 'Bardahl Service Norte',        type: 'Rede Autorizada',            address: 'Av. Brasil, 5000 - Vigário Geral, RJ',    whatsapp: '(21) 9 6400-1111', contacted: false, saved: false },
  { id: 19, name: 'Concessionária Fiat Centro',   type: 'Concessionária',             address: 'Av. Rio Branco, 50 - Centro, RJ',         whatsapp: '(21) 9 6300-1212', contacted: false, saved: false },
  // Frota & Outros
  { id: 20, name: 'Porto Seguro RJ',              type: 'Seguradora',                 address: 'Av. Rio Branco, 100 - Centro, RJ',        whatsapp: '(21) 9 6600-4567', contacted: false, saved: false },
  { id: 21, name: 'Sulamerica Seguros',           type: 'Seguradora',                 address: 'Av. das Américas, 700 - Barra, RJ',       whatsapp: '(21) 9 1100-9012', contacted: true,  saved: true  },
  { id: 22, name: 'Localiza Frota RJ',            type: 'Locadora',                   address: 'Av. Presidente Vargas, 509 - Centro, RJ', whatsapp: '(21) 9 5900-1313', contacted: false, saved: false },
  { id: 23, name: 'TransLog Transportes',         type: 'Transportadora / Frota',     address: 'Estr. do Mendanha, 500 - Campo Grande, RJ',whatsapp: '(21) 9 5800-1414', contacted: false, saved: false },
  { id: 24, name: 'Assoc. Veicular Carioca',      type: 'Associação',                 address: 'Av. Atlântica, 500 - Copacabana, RJ',     whatsapp: '(21) 9 4400-6789', contacted: false, saved: false },
]

export default function ProspectingPanel({ open, onClose }) {
  const { adicionarAoDisparo, setView } = useApp()
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('Todos')
  const [statusFilter,setStatusFilter]= useState('Todos')
  const [prospects,   setProspects]   = useState(INITIAL_PROSPECTS)
  const [addingNew,   setAddingNew]   = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Oficina', address: '', whatsapp: '' })
  const [feedback, setFeedback]       = useState(null)

  function enviarDisparo(prospect) {
    const ok = adicionarAoDisparo(prospect)
    if (ok) {
      toggleContacted(prospect.id)
      saveProspect(prospect.id)
      setFeedback(prospect.id)
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  function irParaDisparos() {
    onClose()
    setView('disparos')
  }

  const filtered = prospects.filter(p => {
    const q    = search.toLowerCase()
    const mQ   = !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    const mT   = typeFilter   === 'Todos' || p.type === typeFilter
    const mS   = statusFilter === 'Todos' ||
                 (statusFilter === 'Contatados' && p.contacted) ||
                 (statusFilter === 'Pendentes'  && !p.contacted)
    return mQ && mT && mS
  })

  const contacted = prospects.filter(p => p.contacted).length
  const pending   = prospects.filter(p => !p.contacted).length

  function toggleContacted(id) {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, contacted: !p.contacted } : p))
  }
  function saveProspect(id) {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, saved: true } : p))
  }
  function addProspect() {
    if (!form.name) return
    setProspects(prev => [...prev, { ...form, id: Date.now(), contacted: false, saved: true }])
    setForm({ name: '', type: 'Mecânica', address: '', whatsapp: '' })
    setAddingNew(false)
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] z-50 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#060d1f', borderLeft: '1px solid #1e3a5f', boxShadow: '-12px 0 60px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-blue-900/40" style={{ background: 'linear-gradient(135deg,#0d1f42 0%,#1a3a6e 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-black text-white text-base">🎯 Prospecção de Clientes</p>
              <p className="text-xs text-blue-300 mt-0.5">Funilaria · Mecânica · Elétrica · Redes · Frota</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Contatados', value: contacted, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Pendentes',  value: pending,   color: 'text-yellow-400',bg: 'bg-yellow-500/10 border-yellow-500/20' },
              { label: 'Total',      value: prospects.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border rounded-xl px-3 py-2 text-center`}>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className={`text-[10px] ${s.color} opacity-70`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="shrink-0 px-5 py-3 border-b border-gray-800 space-y-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou endereço..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Filtro por grupo */}
          <div className="space-y-1.5">
            <button onClick={() => setTypeFilter('Todos')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${typeFilter === 'Todos' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              Todos
            </button>
            {Object.entries(TYPE_GROUPS).map(([grupo, tipos]) => (
              <div key={grupo}>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-wider px-1 mb-1">{grupo}</p>
                <div className="flex gap-1 flex-wrap">
                  {tipos.map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5">
            {['Todos','Pendentes','Contatados'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-gray-600 text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
                {s === 'Pendentes' ? '🔴 ' : s === 'Contatados' ? '🟢 ' : ''}{s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.map(p => {
            const tc = TYPE_COLORS[p.type] || { bg: '#334155', text: '#e2e8f0' }
            return (
              <div key={p.id} className={`rounded-2xl p-4 border transition-all ${p.contacted ? 'border-green-800/40 bg-green-950/20' : 'border-white/8 bg-white/5 hover:border-white/15'}`}>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-white text-sm">{p.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: tc.bg, color: tc.text }}>{p.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <MapPin size={11} className="text-gray-600 shrink-0" />
                      <p className="text-xs text-gray-500 truncate">{p.address}</p>
                    </div>
                    {p.whatsapp && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-gray-600 shrink-0" />
                        <p className="text-xs text-gray-500 font-mono">{p.whatsapp}</p>
                      </div>
                    )}
                  </div>
                  {p.contacted && (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full font-bold">
                      <CheckCircle size={9} /> Enviado
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!p.contacted ? (
                    <button onClick={() => enviarDisparo(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-colors">
                      <Send size={12} /> {feedback === p.id ? 'Adicionado! ✓' : 'Enviar Disparo'}
                    </button>
                  ) : (
                    <button onClick={irParaDisparos}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600/15 text-green-400 rounded-xl text-xs font-semibold border border-green-600/25 hover:bg-green-600/25 transition-colors">
                      <CheckCircle size={12} /> Ver na fila →
                    </button>
                  )}
                  {!p.saved && (
                    <button onClick={() => saveProspect(p.id)}
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-600/30 transition-colors border border-blue-600/30">
                      Salvar
                    </button>
                  )}
                  <button className="w-9 flex items-center justify-center bg-white/5 text-gray-500 rounded-xl hover:bg-white/10 hover:text-gray-300 transition-colors border border-white/8">
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-600 text-sm">Nenhum resultado encontrado</p>
              <button onClick={() => setAddingNew(true)} className="mt-3 text-blue-400 text-xs hover:text-blue-300 underline">Adicionar manualmente</button>
            </div>
          )}
        </div>

        {/* Add new */}
        <div className="shrink-0 px-4 py-4 border-t border-gray-800">
          {addingNew ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-300 mb-2">Adicionar Manualmente</p>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da empresa *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  {Object.entries(TYPE_GROUPS).map(([grupo, tipos]) => (
                    <optgroup key={grupo} label={grupo}>
                      {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  ))}
                </select>
                <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
              </div>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Endereço"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
              <div className="flex gap-2">
                <button onClick={addProspect} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors">Salvar</button>
                <button onClick={() => setAddingNew(false)} className="px-4 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm hover:bg-gray-700 transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
              <Plus size={16} /> Adicionar Manualmente
            </button>
          )}
        </div>
      </div>
    </>
  )
}
