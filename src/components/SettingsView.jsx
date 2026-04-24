import { useState, useEffect } from 'react'
import {
  Shield, User, CheckCircle, Lock, Unlock, ChevronDown, ChevronUp,
  Plus, Eye, EyeOff, KeyRound, Banknote, CreditCard, Percent,
  Settings as SettingsIcon, Trash2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import WhatsAppStatus from './WhatsAppStatus'
import { supabase } from '../lib/supabase'

const SUPABASE_EDGE = 'https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1'
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_KEY

const PERM_LABELS = {
  kanban:        { label: 'Painel Kanban',       desc: 'Ver e gerenciar atendimentos',      emoji: '📋' },
  sales:         { label: 'Vendas',              desc: 'Registrar e ver vendas',            emoji: '🛍️' },
  repasse:       { label: 'Repasse & Vale',      desc: 'Pagamentos, vales e boletos',       emoji: '💳' },
  collaborators: { label: 'Colaboradores',       desc: 'Ver e gerenciar colaboradores',     emoji: '🤝' },
  freight:       { label: 'Tabela de Frete',     desc: 'Consultar tabela de frete',         emoji: '🚚' },
  reports:       { label: 'Relatórios',          desc: 'Ver relatórios e métricas',         emoji: '📊' },
  newOrder:      { label: 'Criar Pedido',        desc: 'Cadastrar novo pedido por telefone', emoji: '📞' },
  prospect:      { label: 'Prospectar',          desc: 'Acessar painel de prospecção',      emoji: '🎯' },
  settings:      { label: 'Configurações',       desc: 'Alterar configurações do sistema',  emoji: '⚙️' },
}

const BLANK_FUNC = { name: '', email: '', password: '', cargo: 'Vendedor', permissions: new Set(['kanban', 'sales', 'newOrder']) }

const TABS = [
  { id: 'funcionarios', label: 'Funcionários',     icon: User     },
  { id: 'repasse',      label: 'Repasse & Vale',   icon: Banknote },
  { id: 'pagamento',    label: 'Pagamento',        icon: CreditCard },
  { id: 'comissoes',    label: 'Comissões',        icon: Percent  },
  { id: 'geral',        label: 'Geral',            icon: SettingsIcon },
]

// ── Persistence helpers ─────────────────────────────────────────────
function loadSetting(key, def) {
  try { const v = localStorage.getItem(`crm-cfg-${key}`); return v ? JSON.parse(v) : def } catch { return def }
}
function saveSetting(key, val) {
  try { localStorage.setItem(`crm-cfg-${key}`, JSON.stringify(val)) } catch {}
}

// ── Repasse tab ──────────────────────────────────────────────────────
function RepasseTab() {
  const [cfg, setCfg] = useState(() => loadSetting('repasse', {
    pixKey: '', pixTitular: '', pixBanco: '',
    contaBanco: '', contaAgencia: '', contaNumero: '', contaTitular: '',
    limiteVale: '500', diasPagamento: '5',
    regras: 'O repasse é realizado toda semana após confirmação de entrega.',
  }))
  const [saved, setSaved] = useState(false)

  function f(k, v) { setCfg(p => ({ ...p, [k]: v })) }

  function salvar() {
    saveSetting('repasse', cfg)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inp = "w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Chave Pix</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Chave Pix</label><input value={cfg.pixKey} onChange={e => f('pixKey', e.target.value)} placeholder="CPF, CNPJ, e-mail ou celular" className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Titular</label><input value={cfg.pixTitular} onChange={e => f('pixTitular', e.target.value)} placeholder="Nome do titular" className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Banco</label><input value={cfg.pixBanco} onChange={e => f('pixBanco', e.target.value)} placeholder="Ex: Nubank, Itaú" className={inp} /></div>
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Dados Bancários (TED/DOC)</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Banco</label><input value={cfg.contaBanco} onChange={e => f('contaBanco', e.target.value)} placeholder="Nome do banco" className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Agência</label><input value={cfg.contaAgencia} onChange={e => f('contaAgencia', e.target.value)} placeholder="0000" className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Conta</label><input value={cfg.contaNumero} onChange={e => f('contaNumero', e.target.value)} placeholder="00000-0" className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Titular</label><input value={cfg.contaTitular} onChange={e => f('contaTitular', e.target.value)} placeholder="Nome" className={inp} /></div>
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Regras de Vale e Repasse</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Limite Vale (R$)</label><input type="number" value={cfg.limiteVale} onChange={e => f('limiteVale', e.target.value)} className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Dias p/ Pagamento</label><input type="number" value={cfg.diasPagamento} onChange={e => f('diasPagamento', e.target.value)} className={inp} /></div>
        </div>
        <div className="mt-3">
          <label className="text-[11px] font-bold text-gray-500 block mb-1">Regras Gerais</label>
          <textarea value={cfg.regras} onChange={e => f('regras', e.target.value)} rows={3}
            className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none" />
        </div>
      </div>

      <button onClick={salvar} className="px-6 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        {saved ? '✅ Salvo!' : 'Salvar Configurações'}
      </button>
    </div>
  )
}

// ── Pagamento tab ────────────────────────────────────────────────────
function PagamentoTab() {
  const [cfg, setCfg] = useState(() => loadSetting('pagamento', {
    aceitaDinheiro: true, aceitaPix: true, aceitaCartao: true, aceitaBoleto: false,
    taxaCartao: '3', pixDesconto: '5', freteGratis: '0',
    msgPagamento: 'Formas de pagamento: 💵 Dinheiro | 📲 Pix (5% desc) | 💳 Cartão (+3%)',
  }))
  const [saved, setSaved] = useState(false)

  function f(k, v) { setCfg(p => ({ ...p, [k]: v })) }
  function salvar() { saveSetting('pagamento', cfg); setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const inp = "bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
  const toggle = (key) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => f(key, !cfg[key])}
        className={`w-10 h-5 rounded-full transition-colors relative ${cfg[key] ? 'bg-green-500' : 'bg-gray-600'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${cfg[key] ? 'left-5' : 'left-0.5'}`} />
      </div>
    </label>
  )

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Formas Aceitas</p>
        <div className="space-y-3">
          {[
            { key: 'aceitaDinheiro', label: '💵 Dinheiro' },
            { key: 'aceitaPix',      label: '📲 Pix' },
            { key: 'aceitaCartao',   label: '💳 Cartão de Crédito/Débito' },
            { key: 'aceitaBoleto',   label: '🏦 Boleto Bancário' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-sm font-semibold text-white">{label}</span>
              {toggle(key)}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Taxas e Descontos</p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Taxa Cartão (%)</label><input type="number" value={cfg.taxaCartao} onChange={e => f('taxaCartao', e.target.value)} className={`w-full ${inp}`} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Desconto Pix (%)</label><input type="number" value={cfg.pixDesconto} onChange={e => f('pixDesconto', e.target.value)} className={`w-full ${inp}`} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Frete grátis acima (R$)</label><input type="number" value={cfg.freteGratis} onChange={e => f('freteGratis', e.target.value)} placeholder="0 = nunca" className={`w-full ${inp}`} /></div>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-500 block mb-1">Mensagem padrão de pagamento (enviada no WhatsApp)</label>
        <textarea value={cfg.msgPagamento} onChange={e => f('msgPagamento', e.target.value)} rows={3}
          className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none" />
      </div>

      <button onClick={salvar} className="px-6 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        {saved ? '✅ Salvo!' : 'Salvar Configurações'}
      </button>
    </div>
  )
}

// ── Comissões tab ────────────────────────────────────────────────────
function ComissoesTab() {
  const [rows, setRows] = useState(() => loadSetting('comissoes', [
    { id: 1, cargo: 'Vendedor',   tipo: 'percentual', valor: '5',  sobre: 'venda' },
    { id: 2, cargo: 'Motoboy',    tipo: 'fixo',       valor: '15', sobre: 'entrega' },
    { id: 3, cargo: 'Consultor',  tipo: 'percentual', valor: '8',  sobre: 'venda' },
  ]))
  const [saved, setSaved] = useState(false)

  function addRow() {
    setRows(p => [...p, { id: Date.now(), cargo: '', tipo: 'percentual', valor: '', sobre: 'venda' }])
  }
  function delRow(id) { setRows(p => p.filter(r => r.id !== id)) }
  function upd(id, k, v) { setRows(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)) }
  function salvar() { saveSetting('comissoes', rows); setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const cellInp = "bg-white/10 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none w-full"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Tabela de Comissões</p>
        <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          <Plus size={12} /> Adicionar
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="grid grid-cols-5 px-4 py-2 text-[11px] font-black text-gray-500 uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span>Cargo</span><span>Tipo</span><span>Valor</span><span>Sobre</span><span />
        </div>
        {rows.map(r => (
          <div key={r.id} className="grid grid-cols-5 items-center gap-2 px-4 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <input value={r.cargo} onChange={e => upd(r.id, 'cargo', e.target.value)} placeholder="Cargo" className={cellInp} />
            <select value={r.tipo} onChange={e => upd(r.id, 'tipo', e.target.value)} className={cellInp}>
              <option value="percentual">% Percentual</option>
              <option value="fixo">R$ Fixo</option>
            </select>
            <input type="number" value={r.valor} onChange={e => upd(r.id, 'valor', e.target.value)} placeholder="0" className={cellInp} />
            <select value={r.sobre} onChange={e => upd(r.id, 'sobre', e.target.value)} className={cellInp}>
              <option value="venda">Por Venda</option>
              <option value="entrega">Por Entrega</option>
              <option value="pedido">Por Pedido</option>
            </select>
            <button onClick={() => delRow(r.id)} className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-center text-gray-600 text-xs py-6">Nenhuma regra de comissão. Clique em Adicionar.</p>
        )}
      </div>

      <button onClick={salvar} className="px-6 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        {saved ? '✅ Salvo!' : 'Salvar Comissões'}
      </button>
    </div>
  )
}

// ── Geral tab ────────────────────────────────────────────────────────
function GeralTab() {
  const [cfg, setCfg] = useState(() => loadSetting('geral', {
    nomeEmpresa: 'Auto Peças', cidade: 'Rio de Janeiro', telefone: '', whatsapp: '',
    horario: 'Seg-Sex 8h-17h | Sáb 8h-12h30', geisaPhone: '',
    botNome: 'Marcelo', msgBoasVindas: '',
  }))
  const [saved, setSaved] = useState(false)

  function f(k, v) { setCfg(p => ({ ...p, [k]: v })) }
  function salvar() { saveSetting('geral', cfg); setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const inp = "w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Dados da Empresa</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Nome da Empresa</label><input value={cfg.nomeEmpresa} onChange={e => f('nomeEmpresa', e.target.value)} className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Cidade</label><input value={cfg.cidade} onChange={e => f('cidade', e.target.value)} className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Telefone Fixo</label><input value={cfg.telefone} onChange={e => f('telefone', e.target.value)} placeholder="(21) 0000-0000" className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">WhatsApp da Loja</label><input value={cfg.whatsapp} onChange={e => f('whatsapp', e.target.value)} placeholder="(21) 9 0000-0000" className={inp} /></div>
        </div>
        <div className="mt-3"><label className="text-[11px] font-bold text-gray-500 block mb-1">Horário de Funcionamento</label><input value={cfg.horario} onChange={e => f('horario', e.target.value)} className={inp} /></div>
      </div>

      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Configurações do Bot</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Nome do Atendente Virtual</label><input value={cfg.botNome} onChange={e => f('botNome', e.target.value)} className={inp} /></div>
          <div><label className="text-[11px] font-bold text-gray-500 block mb-1">WhatsApp da Geisa (notificações)</label><input value={cfg.geisaPhone} onChange={e => f('geisaPhone', e.target.value)} placeholder="5521900000000" className={inp} /></div>
        </div>
        <div className="mt-3">
          <label className="text-[11px] font-bold text-gray-500 block mb-1">Mensagem de Boas-vindas (primeiro contato)</label>
          <textarea value={cfg.msgBoasVindas} onChange={e => f('msgBoasVindas', e.target.value)} rows={3} placeholder="Deixe em branco para usar o padrão automático"
            className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none" />
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">WhatsApp API</p>
        <WhatsAppStatus />
      </div>

      <button onClick={salvar} className="px-6 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        {saved ? '✅ Salvo!' : 'Salvar Configurações'}
      </button>
    </div>
  )
}

// ── Funcionários tab ─────────────────────────────────────────────────
function FuncionariosTab() {
  const { users, addUser, currentUser, updateUserPermissions, ALL_PERMISSIONS } = useApp()
  const [expanded,   setExpanded]   = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [form,       setForm]       = useState(BLANK_FUNC)
  const [showPass,   setShowPass]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [addError,   setAddError]   = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [showNP,     setShowNP]     = useState(false)
  const [passMsg,    setPassMsg]    = useState('')
  const [passSaving, setPassSaving] = useState(false)

  const isAdmin = currentUser?.role === 'admin'
  const employees = users.filter(u => u.role === 'employee')
  const admins    = users.filter(u => u.role === 'admin')

  function togglePerm(perm) {
    const next = new Set(form.permissions); next.has(perm) ? next.delete(perm) : next.add(perm)
    setForm(f => ({ ...f, permissions: next }))
  }

  async function criar() {
    if (!form.name.trim())      { setAddError('Informe o nome'); return }
    if (!form.email.trim())     { setAddError('Informe o e-mail'); return }
    if (form.password.length < 6) { setAddError('Senha mínimo 6 caracteres'); return }
    setSaving(true); setAddError('')
    try {
      const res = await fetch(`${SUPABASE_EDGE}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ email: form.email.trim(), senha: form.password, nome: form.name.trim(), cargo: form.cargo, permissoes: [...form.permissions] }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setAddError(json.error || 'Erro ao criar'); return }
      addUser({ id: json.id, name: form.name.trim(), avatar: form.name.trim()[0].toUpperCase(), role: 'employee', pin: '0000', permissions: [...form.permissions], email: form.email.trim(), cargo: form.cargo })
      setAddSuccess(`Funcionário ${form.name.trim()} criado!`)
      setForm(BLANK_FUNC); setShowAdd(false)
      setTimeout(() => setAddSuccess(''), 5000)
    } catch (err) { setAddError('Erro: ' + String(err)) } finally { setSaving(false) }
  }

  async function alterarSenha() {
    if (newPass.length < 6) { setPassMsg('Mínimo 6 caracteres'); return }
    setPassSaving(true); setPassMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setPassSaving(false)
    if (error) setPassMsg('Erro: ' + error.message)
    else { setPassMsg('✅ Senha alterada!'); setNewPass(''); setTimeout(() => setPassMsg(''), 4000) }
  }

  const fieldCls = "w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"

  return (
    <div className="space-y-6">
      {/* Admins */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-blue-400" />
          <p className="text-sm font-black text-white uppercase tracking-wider">Administradores</p>
        </div>
        <div className="space-y-2">
          {admins.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400">{u.avatar}</div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{u.name}</p>
                <p className="text-[11px] text-blue-400">Acesso total</p>
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
            <User size={14} className="text-gray-400" />
            <p className="text-sm font-black text-white uppercase tracking-wider">Funcionários</p>
          </div>
          {isAdmin && (
            <button onClick={() => { setShowAdd(v => !v); setAddError(''); setAddSuccess('') }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              <Plus size={13} /> Cadastrar
            </button>
          )}
        </div>

        {showAdd && isAdmin && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <p className="text-sm font-black text-white mb-4">Novo Funcionário</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Nome</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className={fieldCls} /></div>
              <div><label className="text-[11px] font-bold text-gray-500 block mb-1">Cargo</label><input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Vendedor" className={fieldCls} /></div>
              <div><label className="text-[11px] font-bold text-gray-500 block mb-1">E-mail (login)</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={fieldCls} /></div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Senha</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mín. 6 caracteres" className={`${fieldCls} pr-10`} />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">Permissões</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_PERMISSIONS.filter(p => PERM_LABELS[p]).map(perm => {
                  const cfg = PERM_LABELS[perm]; const active = form.permissions.has(perm)
                  return (
                    <label key={perm} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${active ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/5'}`}>
                      <input type="checkbox" checked={active} onChange={() => togglePerm(perm)} className="accent-blue-500 w-3.5 h-3.5 shrink-0" />
                      <span className="text-sm shrink-0">{cfg.emoji}</span>
                      <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-500'}`}>{cfg.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            {addError && <p className="mt-3 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{addError}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={criar} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                {saving ? 'Criando...' : '✅ Criar Funcionário'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm rounded-xl text-gray-400" style={{ background: 'rgba(255,255,255,0.06)' }}>Cancelar</button>
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
            const isOpen = expanded === u.id; const pc = u.permissions.size
            return (
              <div key={u.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors" onClick={() => setExpanded(isOpen ? null : u.id)}>
                  <div className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center text-sm font-black text-gray-300">{u.avatar}</div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white text-sm">{u.name}</p>
                    <p className="text-[11px] text-gray-500">{pc} permissão{pc !== 1 ? 'ões' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-600/30 text-gray-400">FUNC.</span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mt-3 mb-2">Permissões</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ALL_PERMISSIONS.map(perm => {
                        const cfg = PERM_LABELS[perm]; const active = u.permissions.has(perm)
                        if (!cfg) return null
                        return (
                          <label key={perm} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isAdmin ? 'cursor-pointer hover:bg-white/5' : 'cursor-default opacity-60'} ${active ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/5'}`}>
                            <input type="checkbox" checked={active} disabled={!isAdmin} onChange={e => isAdmin && updateUserPermissions(u.id, perm, e.target.checked)} className="accent-green-500 w-4 h-4 shrink-0" />
                            <span className="text-base shrink-0">{cfg.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{cfg.label}</p>
                              <p className="text-[10px] text-gray-600 truncate">{cfg.desc}</p>
                            </div>
                            {active ? <Unlock size={12} className="text-green-400 shrink-0" /> : <Lock size={12} className="text-gray-600 shrink-0" />}
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

      {/* Alterar senha */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={14} className="text-purple-400" />
          <p className="text-sm font-black text-white uppercase tracking-wider">Alterar Minha Senha</p>
        </div>
        <div className="relative max-w-xs">
          <input type={showNP ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)"
            className={`${fieldCls} pr-10`} />
          <button type="button" onClick={() => setShowNP(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
            {showNP ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {passMsg && <p className={`mt-2 text-xs font-bold px-3 py-2 rounded-lg ${passMsg.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{passMsg}</p>}
        <button onClick={alterarSenha} disabled={passSaving || newPass.length < 6}
          className="mt-3 px-5 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          {passSaving ? 'Salvando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
export default function SettingsView() {
  const [tab, setTab] = useState('funcionarios')

  return (
    <div className="p-5 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">Configurações</h2>
        <p className="text-xs text-gray-500 mt-0.5">Gerencie funcionários, pagamentos e preferências do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} className="shrink-0" />
            <span className="hidden sm:inline truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'funcionarios' && <FuncionariosTab />}
      {tab === 'repasse'      && <RepasseTab />}
      {tab === 'pagamento'    && <PagamentoTab />}
      {tab === 'comissoes'    && <ComissoesTab />}
      {tab === 'geral'        && <GeralTab />}
    </div>
  )
}
