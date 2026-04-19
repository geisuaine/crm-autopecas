import { MapPin, Phone, Clock, Truck, Plus, Search, Star, Package } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function CollaboratorsView() {
  const { collaborators } = useApp()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', store: '', phone: '', neighborhood: '', city: 'Rio de Janeiro', delivery: false })

  const filtered = collaborators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <div className="p-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-800">Colaboradores</h2>
            <p className="text-xs text-gray-500 mt-0.5">{collaborators.length} parceiros cadastrados na rede</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}
          >
            <Plus size={15} /> Adicionar Colaborador
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-2xl p-5 mb-5 border border-blue-100" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.10)' }}>
            <p className="font-black text-gray-800 mb-4">Novo Colaborador</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do colaborador"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Loja</label>
                <input value={form.store} onChange={e => setForm(f => ({ ...f, store: e.target.value }))} placeholder="Nome da loja"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Telefone / WhatsApp</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(21) 9 9999-9999"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Bairro</label>
                <input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} placeholder="Bairro"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Cidade</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input type="checkbox" checked={form.delivery} onChange={e => setForm(f => ({ ...f, delivery: e.target.checked }))}
                  id="delivery" className="accent-green-600 w-4 h-4" />
                <label htmlFor="delivery" className="text-sm font-semibold text-gray-700 cursor-pointer">Faz entrega</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl font-bold transition-colors">Salvar Colaborador</button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm rounded-xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar colaborador, bairro..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 placeholder:text-gray-400"
            style={{ boxShadow: '0 1px 6px rgba(37,99,235,0.08)' }}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(col => (
            <div key={col.id}
              className="bg-white rounded-2xl p-4 transition-all hover:shadow-lg cursor-pointer"
              style={{ border: '1px solid #e0f2fe', boxShadow: '0 2px 10px rgba(37,99,235,0.07)' }}>

              {/* Top */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-gray-800 text-sm truncate">{col.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{col.store}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {col.delivery && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Entrega</span>
                  )}
                  <div className={`w-2.5 h-2.5 rounded-full ${col.delivery ? 'bg-green-400' : 'bg-gray-300'}`} />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={11} className="text-blue-400 shrink-0" />
                  <span className="truncate">{col.inRio ? col.neighborhood : `${col.neighborhood}, ${col.city}`}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={11} className="text-green-500 shrink-0" />
                  <span className="font-mono tracking-tight">{col.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={11} className="text-amber-400 shrink-0" />
                  <span>~{col.responseTime} min de resposta</span>
                </div>
              </div>

              {/* Rating bar */}
              <div className="flex items-center gap-1 mt-3 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className={i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                ))}
                <span className="text-[11px] text-gray-400 ml-1">4.0</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2 text-xs font-bold rounded-xl transition-colors text-blue-700 hover:bg-blue-50"
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  Contatar
                </button>
                <button className="flex-1 py-2 text-xs font-bold rounded-xl transition-colors text-gray-600 hover:bg-gray-100"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  Ver Peças
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
