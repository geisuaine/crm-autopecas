import { Package, Clock, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ReportsView() {
  const { cards, collaborators } = useApp()
  const total     = cards.length
  const active    = cards.filter(c => !['finalizado'].includes(c.column)).length
  const finished  = cards.filter(c => c.column === 'finalizado').length
  const urgent    = cards.filter(c => c.priority === 'urgent').length
  const complaint = cards.filter(c => c.column === 'reclamacoes').length

  const statCards = [
    { label: 'Total de Pedidos',  value: total,    icon: Package,     bg: 'rgba(29,78,216,0.15)',   text: '#60a5fa', ic: '#3b82f6'  },
    { label: 'Em Andamento',      value: active,   icon: Clock,       bg: 'rgba(234,88,12,0.15)',   text: '#fb923c', ic: '#f97316' },
    { label: 'Finalizados',       value: finished, icon: CheckCircle, bg: 'rgba(22,163,74,0.15)',   text: '#4ade80', ic: '#22c55e' },
    { label: 'Urgentes',          value: urgent,   icon: AlertCircle, bg: 'rgba(220,38,38,0.15)',   text: '#f87171', ic: '#ef4444' },
    { label: 'Reclamações',       value: complaint,icon: TrendingUp,  bg: 'rgba(236,72,153,0.15)',  text: '#f472b6', ic: '#ec4899' },
    { label: 'Colaboradores',     value: collaborators.length, icon: Users, bg: 'rgba(147,51,234,0.15)', text: '#c084fc', ic: '#a855f7' },
  ]

  const colDist = [
    { id: 'novo-pedido',      label: 'Novo Pedido',      color: '#2563eb' },
    { id: 'aguardando-preco', label: 'Aguardando Preço', color: '#ca8a04' },
    { id: 'em-busca',         label: 'Em Busca',         color: '#ea580c' },
    { id: 'peca-encontrada',  label: 'Peça Encontrada',  color: '#16a34a' },
    { id: 'aguardando-envio', label: 'Ag. Envio',        color: '#9333ea' },
    { id: 'finalizado',       label: 'Finalizado',       color: '#64748b' },
  ]

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Relatórios</h2>
        <p className="text-xs text-gray-500 mt-0.5">Resumo do dia — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, text, bg }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-3xl font-black mt-1" style={{ color: text }}>{value}</p>
            <p className="text-xs text-gray-500 mt-2 font-semibold leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Column distribution */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="font-bold text-white mb-4">Distribuição por Coluna</p>
        <div className="space-y-3">
          {colDist.map(({ id, label, color }) => {
            const cnt = cards.filter(c => c.column === id).length
            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0
            return (
              <div key={id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-400 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{cnt}</span>
                    <span className="text-gray-600 text-xs">({pct}%)</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
