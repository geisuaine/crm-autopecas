import { useState } from 'react'
import { Shield, User, CheckCircle, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'

const PERM_LABELS = {
  kanban:        { label: 'Painel Kanban',       desc: 'Ver e gerenciar atendimentos',     emoji: '📋' },
  sales:         { label: 'Vendas',              desc: 'Registrar e ver vendas',           emoji: '🛍️' },
  repasse:       { label: 'Repasse & Vale',      desc: 'Pagamentos, vales e boletos',      emoji: '💳' },
  collaborators: { label: 'Colaboradores',       desc: 'Ver e gerenciar colaboradores',    emoji: '🤝' },
  freight:       { label: 'Tabela de Frete',     desc: 'Consultar tabela de frete',        emoji: '🚚' },
  reports:       { label: 'Relatórios',          desc: 'Ver relatórios e métricas',        emoji: '📊' },
  newOrder:      { label: 'Criar Pedido',        desc: 'Cadastrar novo pedido por telefone',emoji: '📞' },
  prospect:      { label: 'Prospectar',          desc: 'Acessar painel de prospecção',     emoji: '🎯' },
  settings:      { label: 'Configurações',       desc: 'Alterar configurações do sistema', emoji: '⚙️' },
}

export default function SettingsView() {
  const { users, currentUser, updateUserPermissions, ALL_PERMISSIONS } = useApp()
  const [expanded, setExpanded] = useState(null)
  const isAdmin = currentUser.role === 'admin'

  const employees = users.filter(u => u.role === 'employee')
  const admins    = users.filter(u => u.role === 'admin')

  return (
    <div className="p-5 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Configurações</h2>
        <p className="text-xs text-gray-500 mt-0.5">Controle de acesso e permissões por funcionário</p>
      </div>

      {/* Admins */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} className="text-blue-400" />
          <p className="text-sm font-black text-white uppercase tracking-wider">Administradores</p>
        </div>
        <div className="space-y-2">
          {admins.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400">
                {u.avatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{u.name}</p>
                <p className="text-[11px] text-blue-400">Acesso total a todos os módulos</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20">
                <Shield size={11} className="text-blue-400" />
                <span className="text-[10px] font-black text-blue-400">ADMIN</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employees */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User size={15} className="text-gray-400" />
          <p className="text-sm font-black text-white uppercase tracking-wider">Funcionários</p>
          {!isAdmin && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Somente admin pode editar</span>}
        </div>
        <div className="space-y-2">
          {employees.map(u => {
            const isOpen = expanded === u.id
            const permCount = u.permissions.size
            return (
              <div key={u.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>

                {/* Employee row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : u.id)}>
                  <div className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center text-sm font-black text-gray-300">
                    {u.avatar}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white text-sm">{u.name}</p>
                    <p className="text-[11px] text-gray-500">{permCount} permissão{permCount !== 1 ? 'ões' : ''} ativa{permCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-600/30 text-gray-400">FUNC.</span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                  </div>
                </button>

                {/* Permissions grid */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mt-3 mb-2">Permissões de Acesso</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ALL_PERMISSIONS.map(perm => {
                        const cfg = PERM_LABELS[perm]
                        const active = u.permissions.has(perm)
                        return (
                          <label key={perm}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                              isAdmin ? 'hover:bg-white/5' : 'cursor-default opacity-60'
                            } ${active ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/5'}`}>
                            <input
                              type="checkbox"
                              checked={active}
                              disabled={!isAdmin}
                              onChange={e => isAdmin && updateUserPermissions(u.id, perm, e.target.checked)}
                              className="accent-green-500 w-4 h-4 shrink-0"
                            />
                            <span className="text-base shrink-0">{cfg.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{cfg.label}</p>
                              <p className="text-[10px] text-gray-600 truncate">{cfg.desc}</p>
                            </div>
                            {active
                              ? <Unlock size={12} className="text-green-400 shrink-0" />
                              : <Lock   size={12} className="text-gray-600 shrink-0" />
                            }
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
