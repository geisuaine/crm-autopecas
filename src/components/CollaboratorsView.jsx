import { MapPin, Phone, Clock, Plus, Search, Star, Trash2, Edit2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const BLANK = {
  name: '', store: '', phone: '', neighborhood: '', city: 'Rio de Janeiro',
  cargo: '', comissao: '', repasse: '', vale: '', pagamento: 'pix', delivery: false, obs: '',
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"

export default function CollaboratorsView() {
  const { collaborators, addCollaborator, updateCollaborator } = useApp()
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(BLANK)
  const [editForm, setEditForm] = useState(null)

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function fe(k, v) { setEditForm(p => ({ ...p, [k]: v })) }

  function salvar() {
    if (!form.name.trim()) return
    addCollaborator(form)
    setForm(BLANK)
    setShowAdd(false)
  }

  function startEdit(col) {
    setEditId(col.id)
    setEditForm({ ...col })
  }

  function saveEdit() {
    updateCollaborator(editId, editForm)
    setEditId(null)
    setEditForm(null)
  }

  function deleteCollab(id) {
    if (!confirm('Remover este colaborador?')) return
    // updateCollaborator with _deleted flag — handled via filter in context
    updateCollaborator(id, { _deleted: true })
  }

  const visible = collaborators
    .filter(c => !c._deleted)
    .filter(c => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (c.name || '').toLowerCase().includes(q) ||
        (c.neighborhood || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
    })

  return (
    <div className="min-h-full p-5 max-w-6xl" style={{ background: 'linear-gradient(135deg,#e0f2fe 0%,#f0fdf4 50%,#eff6ff 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-gray-800">Colaboradores</h2>
          <p className="text-xs text-gray-500 mt-0.5">{visible.length} parceiros cadastrados</p>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setForm(BLANK) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}
        >
          <Plus size={15} /> Adicionar
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl p-5 mb-5 border border-blue-100 shadow-sm">
          <p className="font-black text-gray-800 mb-4">Novo Colaborador / Funcionário</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *"><input value={form.name}         onChange={e => f('name', e.target.value)}         placeholder="Nome completo"        className={inp} /></Field>
            <Field label="Loja / Empresa"><input value={form.store}  onChange={e => f('store', e.target.value)}       placeholder="Nome da loja ou empresa" className={inp} /></Field>
            <Field label="Cargo / Função"><input value={form.cargo}  onChange={e => f('cargo', e.target.value)}       placeholder="Ex: Vendedor, Motoboy"  className={inp} /></Field>
            <Field label="Telefone / WhatsApp"><input value={form.phone}  onChange={e => f('phone', e.target.value)}  placeholder="(21) 9 9999-9999"       className={inp} /></Field>
            <Field label="Bairro"><input value={form.neighborhood}   onChange={e => f('neighborhood', e.target.value)} placeholder="Bairro"               className={inp} /></Field>
            <Field label="Cidade"><input value={form.city}           onChange={e => f('city', e.target.value)}         placeholder="Cidade"               className={inp} /></Field>
            <Field label="Comissão (%)">
              <input type="number" value={form.comissao} onChange={e => f('comissao', e.target.value)} placeholder="Ex: 10" className={inp} />
            </Field>
            <Field label="Repasse (R$)">
              <input type="number" value={form.repasse}  onChange={e => f('repasse', e.target.value)}  placeholder="Valor de repasse fixo" className={inp} />
            </Field>
            <Field label="Vale (R$)">
              <input type="number" value={form.vale}     onChange={e => f('vale', e.target.value)}     placeholder="Saldo de vale" className={inp} />
            </Field>
            <Field label="Forma de Pagamento">
              <select value={form.pagamento} onChange={e => f('pagamento', e.target.value)} className={inp}>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="transferencia">Transferência</option>
                <option value="boleto">Boleto</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Observações">
                <input value={form.obs} onChange={e => f('obs', e.target.value)} placeholder="Observações gerais..." className={inp} />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input type="checkbox" checked={form.delivery} onChange={e => f('delivery', e.target.checked)} id="del" className="accent-green-600 w-4 h-4" />
              <label htmlFor="del" className="text-sm font-semibold text-gray-700 cursor-pointer">Faz entrega</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl font-bold transition-colors">Salvar</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm rounded-xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancelar</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, bairro, telefone..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 placeholder:text-gray-400"
          style={{ boxShadow: '0 1px 6px rgba(37,99,235,0.08)' }} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map(col => {
          const isEditing = editId === col.id
          const d = isEditing ? editForm : col
          return (
            <div key={col.id} className="bg-white rounded-2xl p-4 transition-all hover:shadow-lg"
              style={{ border: '1px solid #e0f2fe', boxShadow: '0 2px 10px rgba(37,99,235,0.07)' }}>

              {/* Top */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  {isEditing
                    ? <input value={d.name} onChange={e => fe('name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm font-black text-gray-800 focus:outline-none mb-1" />
                    : <p className="font-black text-gray-800 text-sm truncate">{d.name}</p>
                  }
                  {isEditing
                    ? <input value={d.cargo || ''} onChange={e => fe('cargo', e.target.value)} placeholder="Cargo" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-500 focus:outline-none" />
                    : <p className="text-xs text-gray-500 truncate">{d.cargo || d.store}</p>
                  }
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors">
                        <Check size={12} className="text-white" />
                      </button>
                      <button onClick={() => { setEditId(null); setEditForm(null) }} className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                        <X size={12} className="text-gray-600" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(col)} className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors" title="Editar">
                        <Edit2 size={11} className="text-blue-600" />
                      </button>
                      <button onClick={() => deleteCollab(col.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors" title="Remover">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5 text-xs mb-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={11} className="text-green-500 shrink-0" />
                  {isEditing
                    ? <input value={d.phone || ''} onChange={e => fe('phone', e.target.value)} placeholder="Telefone" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs focus:outline-none" />
                    : <span className="font-mono">{d.phone || '—'}</span>
                  }
                </div>
                {(d.neighborhood || d.city) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={11} className="text-blue-400 shrink-0" />
                    <span className="truncate">{d.neighborhood ? `${d.neighborhood}, ${d.city}` : d.city}</span>
                  </div>
                )}
                {d.responseTime && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={11} className="text-amber-400 shrink-0" />
                    <span>~{d.responseTime} min</span>
                  </div>
                )}
              </div>

              {/* Financial info */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  { label: 'Comissão', value: d.comissao ? `${d.comissao}%` : null, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Repasse', value: d.repasse ? `R$${parseFloat(d.repasse).toFixed(0)}` : null, color: 'bg-green-50 text-green-700' },
                  { label: 'Vale', value: d.vale ? `R$${parseFloat(d.vale).toFixed(0)}` : null, color: 'bg-amber-50 text-amber-700' },
                ].filter(x => x.value).map(x => (
                  <div key={x.label} className={`rounded-lg px-2 py-1 text-center ${x.color}`}>
                    <p className="text-[9px] font-bold uppercase opacity-60">{x.label}</p>
                    <p className="text-[12px] font-black">{x.value}</p>
                  </div>
                ))}
              </div>

              {/* Stars + tags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={10} className={i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {d.delivery && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Entrega</span>}
                  {d.pagamento && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize">{d.pagamento}</span>}
                </div>
              </div>

              {d.obs && <p className="text-[11px] text-gray-400 italic mt-2 truncate" title={d.obs}>{d.obs}</p>}
            </div>
          )
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold">Nenhum colaborador cadastrado</p>
          <p className="text-sm mt-1">Clique em "Adicionar" para cadastrar</p>
        </div>
      )}
    </div>
  )
}
