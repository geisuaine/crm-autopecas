import { useState } from 'react'
import { Shield, User, CheckCircle, Lock, Unlock, ChevronDown, ChevronUp, Plus, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import WhatsAppStatus from './WhatsAppStatus'
import { supabase } from '../lib/supabase'

const SUPABASE_EDGE = 'https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1'
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_KEY

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

const BLANK_FORM = { name: '', email: '', password: '', cargo: 'Vendedor', permissions: new Set(['kanban', 'sales', 'newOrder']) }

export default function SettingsView() {
  const { users, addUser, currentUser, updateUserPermissions, ALL_PERMISSIONS } = useApp()
  const [expanded,     setExpanded]     = useState(null)
  const [showAdd,      setShowAdd]      = useState(false)
  const [form,         setForm]         = useState(BLANK_FORM)
  const [showPass,     setShowPass]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [addError,     setAddError]     = useState('')
  const [addSuccess,   setAddSuccess]   = useState('')

  // Password change
  const [newPass,      setNewPass]      = useState('')
  const [showNewPass,  setShowNewPass]  = useState(false)
  const [passMsg,      setPassMsg]      = useState('')
  const [passSaving,   setPassSaving]   = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const employees = users.filter(u => u.role === 'employee')
  const admins    = users.filter(u => u.role === 'admin')

  function toggleFormPerm(perm) {
    const next = new Set(form.permissions)
    next.has(perm) ? next.delete(perm) : next.add(perm)
    setForm(f => ({ ...f, permissions: next }))
  }

  async function criarFuncionario() {
    if (!form.name.trim())      { setAddError('Informe o nome'); return }
    if (!form.email.trim())     { setAddError('Informe o e-mail'); return }
    if (form.password.length < 6) { setAddError('Senha deve ter ao menos 6 caracteres'); return }

    setSaving(true)
    setAddError('')
    try {
      const res = await fetch(`${SUPABASE_EDGE}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          email: form.email.trim(),
          senha: form.password,
          nome:  form.name.trim(),
          cargo: form.cargo,
          permissoes: [...form.permissions],
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setAddError(json.error || 'Erro ao criar funcionário')
      } else {
        addUser({
          id: json.id,
          name: form.name.trim(),
          avatar: form.name.trim()[0].toUpperCase(),
          role: 'employee',
          pin: '0000',
          permissions: [...form.permissions],
          email: form.email.trim(),
          cargo: form.cargo,
        })
        setAddSuccess(`Funcionário ${form.name.trim()} criado! Login: ${form.email.trim()}`)
        setForm(BLANK_FORM)
        setShowAdd(false)
        setTimeout(() => setAddSuccess(''), 5000)
      }
    } catch (err) {
      setAddError('Erro de conexão: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  async function alterarSenha() {
    if (newPass.length < 6) { setPassMsg('Senha deve ter ao menos 6 caracteres'); return }
    setPassSaving(true)
    setPassMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setPassSaving(false)
    if (error) {
      setPassMsg('Erro: ' + error.message)
    } else {
      setPassMsg('✅ Senha alterada com sucesso!')
      setNewPass('')
      setTimeout(() => setPassMsg(''), 4000)
    }
  }

  return (
    <div className="p-5 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Configurações</h2>
        <p className="text-xs text-gray-500 mt-0.5">Controle de acesso e permissões por funcionário</p>
      </div>

      {/* WhatsApp */}
      <div>
        <p className="text-sm font-black text-white uppercase tracking-wider mb-3">💬 WhatsApp</p>
        <WhatsAppStatus />
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={15} className="text-gray-400" />
            <p className="text-sm font-black text-white uppercase tracking-wider">Funcionários</p>
            {!isAdmin && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Somente admin pode editar</span>}
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowAdd(v => !v); setAddError(''); setAddSuccess('') }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              <Plus size={13} /> Cadastrar Funcionário
            </button>
          )}
        </div>

        {/* Add employee form */}
        {showAdd && isAdmin && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <p className="text-sm font-black text-white mb-4">Novo Funcionário</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Cargo</label>
                <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Vendedor"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">E-mail (login)</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Senha inicial</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-4">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">Permissões de Acesso</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_PERMISSIONS.filter(p => PERM_LABELS[p]).map(perm => {
                  const cfg = PERM_LABELS[perm]
                  const active = form.permissions.has(perm)
                  return (
                    <label key={perm}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/5'}`}>
                      <input type="checkbox" checked={active} onChange={() => toggleFormPerm(perm)} className="accent-blue-500 w-3.5 h-3.5 shrink-0" />
                      <span className="text-sm shrink-0">{cfg.emoji}</span>
                      <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-500'}`}>{cfg.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {addError && <p className="mt-3 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{addError}</p>}

            <div className="flex gap-2 mt-4">
              <button onClick={criarFuncionario} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                {saving ? 'Criando...' : '✅ Criar Funcionário'}
              </button>
              <button onClick={() => { setShowAdd(false); setAddError('') }}
                className="px-4 py-2.5 text-sm rounded-xl font-semibold text-gray-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {addSuccess && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/30">
            <CheckCircle size={15} className="text-green-400 shrink-0" />
            <p className="text-sm font-bold text-green-400">{addSuccess}</p>
          </div>
        )}

        <div className="space-y-2">
          {employees.map(u => {
            const isOpen = expanded === u.id
            const permCount = u.permissions.size
            return (
              <div key={u.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>

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

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mt-3 mb-2">Permissões de Acesso</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ALL_PERMISSIONS.map(perm => {
                        const cfg = PERM_LABELS[perm]
                        const active = u.permissions.has(perm)
                        if (!cfg) return null
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

      {/* ── Minha Conta — Alterar Senha ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={15} className="text-purple-400" />
          <p className="text-sm font-black text-white uppercase tracking-wider">Minha Conta — Alterar Senha</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Altere sua senha de acesso. Você precisa estar logado com e-mail.</p>
        <div className="relative max-w-xs">
          <input
            type={showNewPass ? 'text' : 'password'}
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
            className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <button type="button" onClick={() => setShowNewPass(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {passMsg && (
          <p className={`mt-2 text-xs font-bold px-3 py-2 rounded-lg ${passMsg.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {passMsg}
          </p>
        )}
        <button onClick={alterarSenha} disabled={passSaving || newPass.length < 6}
          className="mt-3 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          {passSaving ? 'Salvando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  )
}
