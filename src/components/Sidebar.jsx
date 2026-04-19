import { useState } from 'react'
import { LayoutDashboard, Users, Truck, BarChart3, Settings, ChevronLeft, MessageCircle, Target, Plus, Trash2, DollarSign, ShoppingBag, Banknote, Send } from 'lucide-react'
import { useApp } from '../context/AppContext'

const NAV = [
  { id: 'kanban',        label: 'Painel',          icon: LayoutDashboard },
  { id: 'sales',         label: 'Vendas',          icon: ShoppingBag     },
  { id: 'repasse',       label: 'Repasse & Vale',  icon: Banknote        },
  { id: 'collaborators', label: 'Colaboradores',   icon: Users           },
  { id: 'freight',       label: 'Tabela de Frete', icon: Truck           },
  { id: 'reports',       label: 'Relatórios',      icon: BarChart3       },
  { id: 'disparos',       label: 'Disparos',        icon: Send            },
  { id: 'settings',      label: 'Configurações',   icon: Settings        },
]

const INITIAL_EXPENSES = [
  { id: 1, desc: 'Combustível motoboy', value: 80 },
  { id: 2, desc: 'Embalagens',          value: 35 },
]

export default function Sidebar({ onProspect }) {
  const { view, setView, cards, disparosQueue } = useApp()
  const [collapsed,   setCollapsed]   = useState(false)
  const [expenses,    setExpenses]    = useState(INITIAL_EXPENSES)
  const [expDesc,     setExpDesc]     = useState('')
  const [expVal,      setExpVal]      = useState('')
  const [addingExp,   setAddingExp]   = useState(false)

  const active  = cards.filter(c => !['finalizado'].includes(c.column)).length
  const urgent  = cards.filter(c => c.priority === 'urgent').length
  const totalExp = expenses.reduce((s, e) => s + e.value, 0)

  function addExpense() {
    if (!expDesc || !expVal) return
    setExpenses(prev => [...prev, { id: Date.now(), desc: expDesc, value: parseFloat(expVal) }])
    setExpDesc(''); setExpVal(''); setAddingExp(false)
  }
  function removeExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-56'}`}
      style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0', position: 'relative', zIndex: 1, boxShadow: '2px 0 12px rgba(0,0,0,0.25)' }}
    >
      {/* Collapse */}
      <div className="flex justify-end p-2 pt-3 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 transition-all hover:bg-gray-100"
        >
          <ChevronLeft size={15} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate flex-1">{label}</span>}
            {!collapsed && id === 'disparos' && disparosQueue.length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-green-500 text-white shrink-0">
                {disparosQueue.length}
              </span>
            )}
          </button>
        ))}

        {/* Prospectar */}
        {!collapsed && (
          <button
            onClick={onProspect}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mt-1"
            style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
          >
            <Target size={18} className="shrink-0" />
            <span className="truncate">Prospectar</span>
          </button>
        )}
      </nav>

      {/* Stats pill */}
      {!collapsed && (
        <div className="px-2 mb-2">
          <div className="rounded-2xl p-3 bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">WhatsApp</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div>
                <p className="font-bold text-blue-700 text-base leading-none">{active}</p>
                <p className="text-blue-500 mt-0.5">ativos</p>
              </div>
              {urgent > 0 && (
                <div>
                  <p className="font-bold text-red-500 text-base leading-none">{urgent}</p>
                  <p className="text-red-400 mt-0.5">urgentes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Expenses */}
      {!collapsed && (
        <div className="px-2 pb-3 shrink-0">
          <div className="rounded-2xl overflow-hidden bg-white border border-gray-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <DollarSign size={13} className="text-green-400" />
                <p className="text-xs font-bold text-green-700">Gastos do Dia</p>
              </div>
              <button onClick={() => setAddingExp(!addingExp)} className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Plus size={11} className="text-gray-400" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-28 overflow-y-auto">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between px-3 py-1.5 group border-b border-gray-50">
                  <p className="text-[11px] text-gray-600 truncate flex-1 mr-2">{e.desc}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-[11px] font-bold text-red-400">-R${e.value}</p>
                    <button onClick={() => removeExpense(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={10} className="text-gray-600 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-[11px] text-gray-400 text-center py-3">Nenhum gasto hoje</p>
              )}
            </div>

            {/* Add form */}
            {addingExp && (
              <div className="px-2 py-2 space-y-1.5 border-t border-gray-100">
                <input
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  placeholder="Descrição"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <input
                    value={expVal}
                    onChange={e => setExpVal(e.target.value)}
                    placeholder="R$ valor"
                    type="number"
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button onClick={addExpense} className="px-2 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg font-bold transition-colors">OK</button>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-3 py-2 bg-red-50 border-t border-red-100">
              <p className="text-[11px] text-gray-600 font-semibold">Total</p>
              <p className="text-sm font-black text-red-400">R$ {totalExp.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
