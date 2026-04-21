import { useState, useRef } from 'react'
import { Plus, X, CheckCircle, Trash2, Copy, CreditCard, DollarSign, MessageCircle, FileText, Camera, AlertCircle, BarChart2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'

const INITIAL_PEOPLE = [
  { id: 'p1', name: 'Carlos',  role: 'Vendedor',   phone: '21999001111', pix: '21999001111',      pixType: 'telefone', bank: 'Nubank'    },
  { id: 'p2', name: 'Ana',     role: 'Consultora', phone: '21988002222', pix: 'ana@email.com',    pixType: 'email',    bank: 'Itaú'      },
  { id: 'p3', name: 'Pedro',   role: 'Vendedor',   phone: '21977003333', pix: '123.456.789-00',   pixType: 'cpf',      bank: 'Bradesco'  },
  { id: 'p4', name: 'Rodrigo', role: 'Estoquista', phone: '21966004444', pix: 'rodrigo@email.com',pixType: 'email',    bank: 'Inter'     },
]

const PIX_TYPES = ['telefone', 'cpf', 'email', 'aleatória']

function buildPixMsg(name, value, storeName = 'Auto Peças') {
  return `✅ *${storeName}*\n\nOlá, ${name.split(' ')[0]}! 👋\n\nVocê recebeu um Pix no valor de *R$ ${parseFloat(value).toFixed(2)}*.\n\nObrigado pelo seu trabalho! 🙏`
}

function buildClientPixMsg(person, storeName = 'Auto Peças') {
  return `💳 *Dados para pagamento via Pix*\n\n🏦 Banco: *${person.bank || 'Não informado'}*\n👤 Nome: *${person.name}*\n🔑 Chave Pix (${person.pixType}): *${person.pix}*\n\nApós realizar o pagamento, envie o comprovante. Obrigado! 😊`
}

export default function RepasseView() {
  const { cards, collaborators, paidCollabPieces } = useApp()
  const [people,      setPeople]      = useState(INITIAL_PEOPLE)
  const [history,     setHistory]     = useState([])
  const [showAdd,     setShowAdd]     = useState(false)
  const [form,        setForm]        = useState({ name: '', role: '', phone: '', pix: '', pixType: 'telefone', bank: '' })
  const [sendPixTo,   setSendPixTo]   = useState(null)   // personId with open send-pix panel
  const [clientPhone, setClientPhone] = useState('')
  const [pixCopied,   setPixCopied]   = useState(false)
  // Session: one active repasse at a time with target + partial payments
  const [session,     setSession]     = useState(null)
  // { person, targetValue, payments: [{id, value, desc, date}], done: false }
  const [targetInput, setTargetInput] = useState('')   // target total to repasse
  const [partialVal,  setPartialVal]  = useState('')   // each partial send
  const [partialDesc, setPartialDesc] = useState('')
  const [copied,      setCopied]      = useState(false)
  const [wasSentId,   setWasSentId]   = useState(null) // last payment id just sent

  // Vale section
  const [vales,     setVales]     = useState([])
  const [valeForm,  setValeForm]  = useState({ personId: '', value: '', desc: '' })
  const [showVale,  setShowVale]  = useState(false)
  const [valeError, setValeError] = useState('')

  const [showQr,         setShowQr]         = useState(null)  // personId with QR open
  const [showPayPanel,   setShowPayPanel]   = useState(false)
  const [collabPaidLocal, setCollabPaidLocal] = useState({}) // manual overrides
  const isPiecePaid = (pieceId) => paidCollabPieces?.has(pieceId) || !!collabPaidLocal[pieceId]
  const [showCollabPay,  setShowCollabPay]  = useState(false)
  const [editingTarget, setEditingTarget] = useState(null) // personId being edited
  const [targetEditVal, setTargetEditVal] = useState('')

  // Boletos section
  const [boletos,   setBoletos]   = useState([])
  const [showBoleto,setShowBoleto]= useState(false)
  const [boletoForm,setBoletoForm]= useState({ desc: '', value: '', vencimento: '', codigo: '', photoUrl: null })
  const [viewPhoto, setViewPhoto] = useState(null)
  const fileRef = useRef(null)

  function saveTarget(personId) {
    if (!targetEditVal) return
    setPeople(prev => prev.map(p => p.id === personId ? { ...p, paymentTarget: parseFloat(targetEditVal) } : p))
    setEditingTarget(null)
    setTargetEditVal('')
  }

  function getPersonPaid(personId) {
    return history.filter(h => h.personId === personId).reduce((s, h) => s + h.value, 0)
  }

  function addPerson() {
    if (!form.name || !form.pix) return
    setPeople(prev => [...prev, { ...form, id: 'p' + Date.now() }])
    setForm({ name: '', role: '', phone: '', pix: '', pixType: 'telefone' })
    setShowAdd(false)
  }

  function removePerson(id) {
    setPeople(prev => prev.filter(p => p.id !== id))
    if (session?.person.id === id) setSession(null)
  }

  function startSession(person) {
    if (session && !session.done) return  // already has active session
    setSession({ person, targetValue: 0, payments: [], done: false })
    setTargetInput('')
    setPartialVal('')
    setPartialDesc('')
  }

  function confirmTarget() {
    if (!targetInput || !session) return
    setSession(s => ({ ...s, targetValue: parseFloat(targetInput) }))
  }

  function confirmPartial() {
    if (!partialVal || !session) return
    const pay = { id: Date.now(), value: parseFloat(partialVal), desc: partialDesc, date: new Date() }
    const updatedPayments = [...session.payments, pay]
    const sent = updatedPayments.reduce((s, p) => s + p.value, 0)
    const isComplete = sent >= session.targetValue
    setSession(s => ({ ...s, payments: updatedPayments, done: isComplete }))
    setHistory(prev => [{
      id: pay.id, personId: session.person.id, person: session.person.name, phone: session.person.phone,
      pix: session.person.pix, value: pay.value, desc: pay.desc || `Parcela ${updatedPayments.length}`, date: pay.date,
    }, ...prev])
    setWasSentId(pay.id)
    setPartialVal('')
    setPartialDesc('')
  }

  function finalizeSession() {
    setSession(s => s ? { ...s, done: true } : null)
  }

  function closeSession() {
    setSession(null)
    setTargetInput('')
    setPartialVal('')
    setWasSentId(null)
  }

  function copyMsg(name, value) {
    navigator.clipboard.writeText(buildPixMsg(name, value)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleBoletoPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBoletoForm(f => ({ ...f, photoUrl: url }))
  }

  function addBoleto() {
    if (!boletoForm.desc && !boletoForm.value) return
    setBoletos(prev => [...prev, { id: Date.now(), ...boletoForm, paid: false, date: new Date() }])
    setBoletoForm({ desc: '', value: '', vencimento: '', codigo: '', photoUrl: null })
    setShowBoleto(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function markBoletoPaid(id) {
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, paid: true, paidAt: new Date() } : b))
  }

  function removeBoleto(id) {
    setBoletos(prev => prev.filter(b => b.id !== id))
  }

  function addVale() {
    if (!valeForm.personId) { setValeError('Selecione um funcionário'); return }
    if (!valeForm.value || parseFloat(valeForm.value) <= 0) { setValeError('Informe o valor do vale'); return }
    const person = people.find(p => p.id === valeForm.personId)
    setVales(prev => [...prev, { id: Date.now(), person: person?.name, personId: valeForm.personId, value: parseFloat(valeForm.value), desc: valeForm.desc, date: new Date() }])
    setValeForm({ personId: '', value: '', desc: '' })
    setValeError('')
    setShowVale(false)
  }

  const sessionSent    = session ? session.payments.reduce((s, p) => s + p.value, 0) : 0
  const sessionRemain  = session ? Math.max(0, session.targetValue - sessionSent) : 0
  const lastPayment    = session?.payments.slice(-1)[0] || null

  const totalVales    = vales.reduce((s, v) => s + v.value, 0)
  const totalRepasses = history.reduce((s, r) => s + r.value, 0)
  const totalBoletos  = boletos.filter(b => !b.paid).reduce((s, b) => s + (parseFloat(b.value) || 0), 0)

  return (
    <div className="p-5 max-w-4xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white">Repasse & Vale</h2>
        <p className="text-xs text-gray-500 mt-0.5">Gestão de pagamentos, repasses, vales e boletos</p>
      </div>

      {/* Payment targets panel toggle */}
      <div>
        <button
          onClick={() => setShowPayPanel(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: showPayPanel ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <BarChart2 size={15} />
          <span>Painel de Pagamentos</span>
          {showPayPanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showPayPanel && (
          <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="px-5 py-3 border-b border-indigo-500/20">
              <p className="text-xs font-black text-indigo-300 uppercase tracking-wider">Valor a receber por funcionário</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Defina quanto cada pessoa deve receber e acompanhe o saldo pendente</p>
            </div>
            <div className="divide-y divide-indigo-500/10">
              {people.map(person => {
                const target = person.paymentTarget || 0
                const paid   = getPersonPaid(person.id)
                const remain = Math.max(0, target - paid)
                const pct    = target > 0 ? Math.min(100, Math.round(paid / target * 100)) : 0
                const isEditing = editingTarget === person.id

                return (
                  <div key={person.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400">
                          {person.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{person.name}</p>
                          <p className="text-[11px] text-gray-500">{person.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[10px] text-gray-500 font-semibold">A Receber</p>
                          {isEditing ? (
                            <div className="flex gap-1 mt-0.5">
                              <input autoFocus type="number" value={targetEditVal}
                                onChange={e => setTargetEditVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveTarget(person.id)}
                                placeholder="0"
                                className="w-24 bg-white/10 border border-indigo-500/40 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none" />
                              <button onClick={() => saveTarget(person.id)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg font-bold transition-colors">
                                OK
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingTarget(person.id); setTargetEditVal(person.paymentTarget ? String(person.paymentTarget) : '') }}
                              className="text-base font-black text-white hover:text-indigo-300 transition-colors text-right block">
                              {target > 0 ? `R$ ${target.toFixed(2)}` : <span className="text-gray-600 text-xs">Definir</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {target > 0 && (
                      <>
                        <div className="h-2 rounded-full overflow-hidden bg-white/10 mb-1.5">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: remain === 0 ? '#16a34a' : 'linear-gradient(90deg,#6366f1,#2563eb)' }} />
                        </div>
                        <div className="flex justify-between text-[10px] mb-2">
                          <span className="text-indigo-400 font-bold">Pago: R$ {paid.toFixed(2)} ({pct}%)</span>
                          {remain > 0
                            ? <span className="text-amber-400 font-bold">Falta: R$ {remain.toFixed(2)}</span>
                            : <span className="text-green-400 font-bold">✓ Quitado</span>
                          }
                        </div>
                      </>
                    )}

                    {/* Repasses sent to this person */}
                    {(() => {
                      const personRepasses = history.filter(h => h.personId === person.id)
                      if (personRepasses.length === 0) return null
                      return (
                        <div className="space-y-1">
                          {personRepasses.map(r => (
                            <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                              <CheckCircle size={10} className="text-green-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 truncate">{r.desc}</p>
                                <p className="text-[10px] text-gray-600">{new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <p className="text-xs font-black text-green-400 shrink-0">R$ {r.value.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
          <p className="text-xs font-semibold text-blue-400 mb-1">Total Repassado (hoje)</p>
          <p className="text-2xl font-black text-blue-400">R$ {totalRepasses.toFixed(2)}</p>
          <p className="text-[11px] text-blue-500 mt-0.5 opacity-70">{history.length} repasse{history.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
          <p className="text-xs font-semibold text-red-400 mb-1">Total em Vales</p>
          <p className="text-2xl font-black text-red-400">R$ {totalVales.toFixed(2)}</p>
          <p className="text-[11px] text-red-500 mt-0.5 opacity-70">{vales.length} vale{vales.length !== 1 ? 's' : ''} em aberto</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}>
          <p className="text-xs font-semibold text-yellow-400 mb-1">Boletos a Pagar</p>
          <p className="text-2xl font-black text-yellow-400">R$ {totalBoletos.toFixed(2)}</p>
          <p className="text-[11px] text-yellow-500 mt-0.5 opacity-70">{boletos.filter(b=>!b.paid).length} pendente{boletos.filter(b=>!b.paid).length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── REPASSE SECTION ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-white uppercase tracking-wider">📲 Repasse de Pagamento</p>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
            <Plus size={13} /> Cadastrar Pessoa
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-xs font-black text-white mb-3">Nova Pessoa para Repasse</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Função</label>
                <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Vendedor"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">WhatsApp</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="21999999999"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tipo de Chave Pix</label>
                <select value={form.pixType} onChange={e => setForm(f => ({ ...f, pixType: e.target.value }))}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  {PIX_TYPES.map(t => <option key={t} value={t} className="bg-gray-800">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Banco</label>
                <input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} placeholder="Ex: Nubank, Itaú..."
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Chave Pix</label>
                <input value={form.pix} onChange={e => setForm(f => ({ ...f, pix: e.target.value }))} placeholder="CPF, telefone, e-mail ou chave aleatória"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addPerson} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-bold transition-colors">Salvar</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm rounded-xl font-semibold text-gray-400 hover:text-gray-200 transition-colors" style={{ background: 'rgba(255,255,255,0.06)' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* People cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map(person => {
            const inSession  = session?.person.id === person.id
            const isDone     = inSession && session.done
            const inProgress = inSession && !session.done && session.targetValue > 0
            const sent_      = inSession ? session.payments.reduce((s,p) => s+p.value, 0) : 0
            const remain_    = inSession ? Math.max(0, session.targetValue - sent_) : 0
            const pct        = inSession && session.targetValue > 0 ? Math.min(100, Math.round(sent_ / session.targetValue * 100)) : 0
            const locked     = session && !inSession && !session.done

            return (
              <div key={person.id}
                className={`rounded-2xl p-4 transition-all ${locked ? 'opacity-40' : 'cursor-pointer'}`}
                style={{
                  background: isDone ? 'rgba(22,163,74,0.15)' : inProgress ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.05)',
                  border: isDone ? '2px solid rgba(22,163,74,0.5)' : inProgress ? '2px solid rgba(37,99,235,0.6)' : '1px solid rgba(255,255,255,0.09)',
                }}
                onClick={() => !locked && !isDone && startSession(person)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400">
                      {person.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{person.name}</p>
                      <p className="text-[11px] text-gray-500">{person.role}</p>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removePerson(person.id) }}
                    className="opacity-40 hover:opacity-100 transition-opacity p-1">
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>

                {/* Pix info — large key */}
                <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard size={12} className="text-green-400 shrink-0" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">{person.pixType}</span>
                    {person.bank && <span className="text-[10px] text-gray-500 ml-auto">🏦 {person.bank}</span>}
                  </div>
                  <p className="text-base font-black text-green-300 font-mono leading-tight break-all">{person.pix}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(person.pix)
                        setPixCopied(person.id)
                        setTimeout(() => setPixCopied(null), 2000)
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                      style={{ background: pixCopied === person.id ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: pixCopied === person.id ? '#4ade80' : '#9ca3af' }}>
                      {pixCopied === person.id ? <CheckCircle size={10} /> : <Copy size={10} />}
                      {pixCopied === person.id ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setSendPixTo(v => v === person.id ? null : person.id); setClientPhone('') }}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                      style={{ background: sendPixTo === person.id ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: sendPixTo === person.id ? '#4ade80' : '#9ca3af' }}>
                      <MessageCircle size={10} /> Enviar ao cliente
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setShowQr(v => v === person.id ? null : person.id) }}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                      style={{ background: showQr === person.id ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: showQr === person.id ? '#4ade80' : '#9ca3af' }}>
                      QR
                    </button>
                  </div>

                  {/* QR Code do Pix */}
                  {showQr === person.id && (
                    <div className="mt-2 pt-2 border-t border-green-500/20 flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-wider">QR Code — Chave Pix</p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(person.pix)}&bgcolor=1a1a2e&color=4ade80&qzone=2`}
                        alt="QR Code Pix"
                        className="rounded-xl border border-green-500/30"
                        style={{ width: 140, height: 140 }}
                      />
                      <p className="text-[10px] text-gray-500 text-center">Mostre na tela ao cliente</p>
                    </div>
                  )}

                  {/* Send pix to client panel */}
                  {sendPixTo === person.id && (
                    <div className="mt-2 pt-2 border-t border-green-500/20 space-y-2" onClick={e => e.stopPropagation()}>
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-wider">Enviar dados do Pix ao cliente</p>
                      <div className="p-2 rounded-lg bg-black/20 text-[10px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
                        {buildClientPixMsg(person)}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          value={clientPhone}
                          onChange={e => setClientPhone(e.target.value)}
                          placeholder="WhatsApp do cliente (ex: 21999...)"
                          className="flex-1 bg-white/10 border border-green-500/30 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none"
                        />
                        <a
                          href={clientPhone ? `https://wa.me/55${clientPhone.replace(/\D/g,'')}?text=${encodeURIComponent(buildClientPixMsg(person))}` : '#'}
                          target="_blank" rel="noreferrer"
                          onClick={e => { if (!clientPhone) e.preventDefault() }}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black text-white transition-all ${clientPhone ? 'hover:opacity-90' : 'opacity-40 pointer-events-none'}`}
                          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                          <MessageCircle size={11} /> Enviar
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar when in session */}
                {inProgress && session.targetValue > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-green-400 font-bold">Enviado: R$ {sent_.toFixed(2)}</span>
                      <span className="text-amber-400 font-bold">Falta: R$ {remain_.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-white/10">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#16a34a)' }} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 text-center">{pct}% de R$ {session.targetValue.toFixed(2)}</p>
                  </div>
                )}

                {isDone && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-green-500/15 rounded-lg mt-1">
                    <CheckCircle size={12} className="text-green-400" />
                    <p className="text-[11px] font-bold text-green-400">Repasse finalizado ✓</p>
                  </div>
                )}
                {!inSession && !isDone && (
                  <p className="text-[11px] text-center font-semibold text-gray-600 py-1 mt-1">
                    {locked ? '🔒 Finalizar sessão atual primeiro' : 'Clique para iniciar repasse'}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Active session panel ── */}
        {session && !session.done && session.collapsed && (
          <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:opacity-90 transition-all"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)' }}
            onClick={() => setSession(s => s ? { ...s, collapsed: false } : null)}>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400">
              {session.person.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">{session.person.name}</p>
              <p className="text-[11px] text-gray-400">Repasse em andamento · Enviado: R$ {sessionSent.toFixed(2)} · Falta: R$ {sessionRemain.toFixed(2)}</p>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-3 py-1 rounded-full">Retomar</span>
          </div>
        )}
        {session && !session.done && !session.collapsed && (
          <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(37,99,235,0.10)', border: '2px solid rgba(37,99,235,0.35)' }}>

            {/* Session header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-base font-black text-blue-400">
                  {session.person.name[0]}
                </div>
                <div>
                  <p className="font-black text-white">{session.person.name}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{session.person.pix}</p>
                </div>
              </div>
              <button onClick={closeSession} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                <X size={14} className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1: set target */}
              {session.targetValue === 0 ? (
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                    Valor total a repassar para {session.person.name.split(' ')[0]}
                  </label>
                  <div className="flex gap-2">
                    <input type="number" value={targetInput} onChange={e => setTargetInput(e.target.value)}
                      placeholder="R$ valor total"
                      className="flex-1 bg-white/10 border border-blue-500/30 rounded-xl px-4 py-3 text-xl text-white font-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <button onClick={confirmTarget} disabled={!targetInput}
                      className="px-6 py-3 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                      Definir
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress summary */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Total</p>
                        <p className="text-lg font-black text-white">R$ {session.targetValue.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Enviado</p>
                        <p className="text-lg font-black text-green-400">R$ {sessionSent.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Falta</p>
                        <p className="text-lg font-black text-amber-400">R$ {sessionRemain.toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-3 rounded-full overflow-hidden bg-white/10">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, sessionSent/session.targetValue*100)}%`, background: 'linear-gradient(90deg,#2563eb,#16a34a)' }} />
                    </div>
                    <p className="text-center text-[11px] text-gray-500 mt-1.5">
                      {Math.min(100, Math.round(sessionSent/session.targetValue*100))}% concluído
                      {session.payments.length > 0 && ` · ${session.payments.length} envio${session.payments.length > 1 ? 's' : ''}`}
                    </p>
                  </div>

                  {/* Partial payment form — only if not complete */}
                  {sessionRemain > 0 ? (
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2">Valor do próximo envio</label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input type="number" value={partialVal} onChange={e => setPartialVal(e.target.value)}
                          placeholder={`Máx R$ ${sessionRemain.toFixed(2)}`}
                          className="bg-white/10 border border-blue-500/30 rounded-xl px-4 py-3 text-lg text-white font-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        <input value={partialDesc} onChange={e => setPartialDesc(e.target.value)}
                          placeholder="Descrição (opcional)"
                          className="bg-white/10 border border-white/15 rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none" />
                      </div>

                      {partialVal && (
                        <div className="mb-3 p-3 rounded-xl bg-black/20 border border-white/10">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Mensagem</p>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{buildPixMsg(session.person.name, partialVal)}</pre>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={confirmPartial} disabled={!partialVal}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                          <CheckCircle size={15} /> Confirmar Envio
                        </button>
                        {partialVal && (
                          <button onClick={() => copyMsg(session.person.name, partialVal)}
                            className="px-4 py-3 rounded-xl font-bold transition-all"
                            style={{ background: copied ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.08)', color: copied ? '#4ade80' : '#9ca3af' }}>
                            {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* All paid — show finalize */
                    <div className="p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-center">
                      <p className="text-sm font-black text-green-400 mb-1">✅ Valor total enviado!</p>
                      <p className="text-xs text-green-600">Clique em Finalizar para liberar esta pessoa</p>
                    </div>
                  )}

                  {/* WA button after last send — closes panel on click */}
                  {wasSentId && lastPayment && (
                    <a
                      href={`https://wa.me/55${session.person.phone.replace(/\D/g,'')}?text=${encodeURIComponent(buildPixMsg(session.person.name, lastPayment.value))}`}
                      target="_blank" rel="noreferrer"
                      onClick={() => {
                        setWasSentId(null)
                        // If fully paid, finalize; otherwise just collapse the panel
                        if (sessionRemain === 0) {
                          finalizeSession()
                        } else {
                          setSession(s => s ? { ...s, collapsed: true } : null)
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                      <MessageCircle size={14} /> Enviar no WhatsApp (R$ {lastPayment.value.toFixed(2)}) e fechar painel
                    </a>
                  )}

                  {/* Finalize button — only enabled when fully paid */}
                  {sessionRemain === 0 ? (
                    <button onClick={finalizeSession}
                      className="w-full py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                      🏁 Finalizar Repasse
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-gray-600"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      🔒 Finalize quando enviar R$ {sessionRemain.toFixed(2)} restantes
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Done session summary */}
        {session?.done && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.3)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-400" />
                <div>
                  <p className="font-black text-white">Repasse de {session.person.name} finalizado</p>
                  <p className="text-xs text-green-400">{session.payments.length} envio{session.payments.length>1?'s':''} · Total: R$ {sessionSent.toFixed(2)}</p>
                </div>
              </div>
              <button onClick={closeSession} className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── COLABORADORES — PAGAMENTOS DE PEÇAS ── */}
      {(() => {
        // Collect all pieces that have a collaborator assigned and a cost
        const collabPieces = []
        cards.forEach(card => {
          card.pieces.forEach(piece => {
            if (piece.collaboratorId && piece.price?.collaboratorCost) {
              collabPieces.push({ card, piece })
            }
          })
        })

        // Group by collaborator
        const byCollab = {}
        collabPieces.forEach(({ card, piece }) => {
          const key = piece.collaboratorId
          if (!byCollab[key]) byCollab[key] = { collab: collaborators.find(c => c.id === key), items: [] }
          byCollab[key].items.push({ card, piece })
        })

        const groups = Object.values(byCollab).filter(g => g.collab)
        if (groups.length === 0) return null

        const totalOwed = collabPieces.reduce((s, { piece }) => {
          return s + (isPiecePaid(piece.id) ? 0 : (piece.price?.collaboratorCost || 0))
        }, 0)
        const totalPaid = collabPieces.reduce((s, { piece }) => {
          return s + (isPiecePaid(piece.id) ? (piece.price?.collaboratorCost || 0) : 0)
        }, 0)

        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-white uppercase tracking-wider">🤝 Pagamentos a Colaboradores</p>
                {totalOwed > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                    R$ {totalOwed.toFixed(2)} a pagar
                  </span>
                )}
              </div>
              <button onClick={() => setShowCollabPay(v => !v)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                style={{ background: showCollabPay ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }}>
                {showCollabPay ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showCollabPay ? 'Fechar' : 'Ver detalhes'}
              </button>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <p className="text-[10px] font-bold text-orange-400 mb-0.5">Total Peças</p>
                <p className="text-lg font-black text-orange-300">{collabPieces.length}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <p className="text-[10px] font-bold text-red-400 mb-0.5">A Pagar</p>
                <p className="text-lg font-black text-red-400">R$ {totalOwed.toFixed(2)}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}>
                <p className="text-[10px] font-bold text-green-400 mb-0.5">Pago</p>
                <p className="text-lg font-black text-green-400">R$ {totalPaid.toFixed(2)}</p>
              </div>
            </div>

            {showCollabPay && (
              <div className="space-y-3">
                {groups.map(({ collab, items }) => {
                  const groupOwed = items.reduce((s, { piece }) => s + (isPiecePaid(piece.id) ? 0 : (piece.price?.collaboratorCost || 0)), 0)
                  const groupPaid = items.reduce((s, { piece }) => s + (isPiecePaid(piece.id) ? (piece.price?.collaboratorCost || 0) : 0), 0)
                  return (
                    <div key={collab.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)' }}>
                      {/* Collab header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-500/15">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-sm font-black text-orange-400 shrink-0">
                          {collab.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-sm truncate">{collab.name}</p>
                          <p className="text-[11px] text-gray-500">{collab.store} · {collab.phone}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {groupOwed > 0
                            ? <p className="text-sm font-black text-red-400">-R$ {groupOwed.toFixed(2)}</p>
                            : <p className="text-sm font-black text-green-400">✓ Quitado</p>
                          }
                          {groupPaid > 0 && <p className="text-[10px] text-gray-500">Pago: R$ {groupPaid.toFixed(2)}</p>}
                        </div>
                      </div>

                      {/* Pieces */}
                      <div className="divide-y divide-orange-500/10">
                        {items.map(({ card, piece }) => {
                          const paid = !!isPiecePaid(piece.id)
                          return (
                            <div key={piece.id} className="flex items-center gap-3 px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{piece.name}</p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {card.client.name} · {card.vehicle ? `${card.vehicle.brand} ${card.vehicle.model}` : 'Sem veículo'}
                                  {piece.sku && <span className="ml-1 font-mono text-gray-600">{piece.sku}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <p className={`text-base font-black ${paid ? 'text-green-400 line-through opacity-60' : 'text-orange-300'}`}>
                                  💵 R$ {piece.price.collaboratorCost.toFixed(2)}
                                </p>
                                <button
                                  onClick={() => setCollabPaidLocal(prev => ({ ...prev, [piece.id]: !prev[piece.id] }))}
                                  className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${paid ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-gray-400 hover:bg-orange-500/15 hover:text-orange-400'}`}>
                                  {paid ? '✓ Pago' : 'Marcar pago'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── VALE SECTION ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-white uppercase tracking-wider">💸 Vale de Funcionário</p>
          <button onClick={() => { setShowVale(v => !v); setValeError('') }}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
            <Plus size={13} /> Lançar Vale
          </button>
        </div>

        {showVale && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <p className="text-xs font-black text-red-400 mb-3">Novo Vale</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Funcionário</label>
                <select value={valeForm.personId} onChange={e => setValeForm(f => ({ ...f, personId: e.target.value }))}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="" className="bg-gray-800">Selecionar</option>
                  {people.map(p => <option key={p.id} value={p.id} className="bg-gray-800">{p.name} — {p.role}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Valor (R$)</label>
                <input type="number" value={valeForm.value} onChange={e => setValeForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white font-bold placeholder:text-gray-600 focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Descrição</label>
                <input value={valeForm.desc} onChange={e => setValeForm(f => ({ ...f, desc: e.target.value }))} placeholder="Ex: Adiantamento quinzena"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none" />
              </div>
            </div>
            {valeError && (
              <p className="mt-2 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{valeError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={addVale} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors" style={{ background: '#dc2626' }}>Lançar Vale</button>
              <button onClick={() => { setShowVale(false); setValeError('') }} className="px-4 py-2.5 text-sm rounded-xl font-semibold text-gray-400 transition-colors" style={{ background: 'rgba(255,255,255,0.06)' }}>Cancelar</button>
            </div>
          </div>
        )}

        {vales.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-gray-600 text-sm">Nenhum vale lançado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vales.map(v => (
              <div key={v.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <DollarSign size={16} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{v.person}</p>
                  <p className="text-[11px] text-gray-500 truncate">{v.desc || 'Vale'} · {new Date(v.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <p className="text-base font-black text-red-400 shrink-0">-R$ {v.value.toFixed(2)}</p>
                <button onClick={() => setVales(prev => prev.filter(x => x.id !== v.id))} className="opacity-40 hover:opacity-100 transition-opacity ml-1">
                  <Trash2 size={12} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BOLETOS SECTION ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-white uppercase tracking-wider">🧾 Boletos / Pagamentos do Dia</p>
          <button onClick={() => setShowBoleto(!showBoleto)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(234,179,8,0.18)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)' }}>
            <Plus size={13} /> Cadastrar Boleto
          </button>
        </div>

        {/* Boleto form */}
        {showBoleto && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <p className="text-xs font-black text-yellow-400 mb-3">Novo Boleto / Pagamento</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Descrição</label>
                <input value={boletoForm.desc} onChange={e => setBoletoForm(f => ({ ...f, desc: e.target.value }))}
                  placeholder="Ex: Fornecedor Peças Norte, Aluguel..."
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/30" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Valor (R$)</label>
                <input type="number" value={boletoForm.value} onChange={e => setBoletoForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="0,00"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white font-bold placeholder:text-gray-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vencimento</label>
                <input type="date" value={boletoForm.vencimento} onChange={e => setBoletoForm(f => ({ ...f, vencimento: e.target.value }))}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Código de Barras (opcional)</label>
                <input value={boletoForm.codigo} onChange={e => setBoletoForm(f => ({ ...f, codigo: e.target.value }))}
                  placeholder="Cole o código aqui..."
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white font-mono text-xs placeholder:text-gray-600 focus:outline-none" />
              </div>

              {/* Photo upload */}
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Foto do Boleto</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleBoletoPhoto} className="hidden" id="boleto-photo" />
                {boletoForm.photoUrl ? (
                  <div className="relative">
                    <img src={boletoForm.photoUrl} alt="boleto" className="w-full h-36 object-cover rounded-xl border border-yellow-500/30" />
                    <button onClick={() => { setBoletoForm(f => ({ ...f, photoUrl: null })); if(fileRef.current) fileRef.current.value = '' }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X size={13} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="boleto-photo"
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all hover:border-yellow-500/40"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(234,179,8,0.25)' }}>
                    <Camera size={22} className="text-yellow-500 opacity-60" />
                    <p className="text-xs text-gray-500 font-semibold">Tirar foto ou anexar boleto</p>
                    <p className="text-[10px] text-gray-700">JPG, PNG</p>
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addBoleto}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: '#ca8a04' }}>
                Salvar Boleto
              </button>
              <button onClick={() => setShowBoleto(false)}
                className="px-4 py-2.5 text-sm rounded-xl font-semibold text-gray-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Boletos list */}
        {boletos.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-gray-600 text-sm">Nenhum boleto cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {boletos.map(b => {
              const today = new Date().toISOString().slice(0,10)
              const overdue = b.vencimento && b.vencimento < today && !b.paid
              return (
                <div key={b.id} className="rounded-2xl overflow-hidden"
                  style={{
                    background: b.paid ? 'rgba(22,163,74,0.08)' : overdue ? 'rgba(220,38,38,0.1)' : 'rgba(234,179,8,0.08)',
                    border: b.paid ? '1px solid rgba(22,163,74,0.2)' : overdue ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(234,179,8,0.2)',
                  }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Photo thumb */}
                    {b.photoUrl ? (
                      <button onClick={() => setViewPhoto(b.photoUrl)} className="w-12 h-12 rounded-xl overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
                        <img src={b.photoUrl} alt="boleto" className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
                        style={{ background: b.paid ? 'rgba(22,163,74,0.15)' : 'rgba(234,179,8,0.15)' }}>
                        <FileText size={20} className={b.paid ? 'text-green-400' : overdue ? 'text-red-400' : 'text-yellow-400'} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm truncate">{b.desc || 'Boleto'}</p>
                        {b.paid && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Pago</span>}
                        {overdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 flex items-center gap-1"><AlertCircle size={9} />Vencido</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {b.vencimento && <p className="text-[11px] text-gray-500">Venc: {new Date(b.vencimento + 'T12:00').toLocaleDateString('pt-BR')}</p>}
                        {b.codigo && <p className="text-[10px] text-gray-600 font-mono truncate max-w-[160px]">{b.codigo}</p>}
                      </div>
                      {b.paid && b.paidAt && (
                        <p className="text-[10px] text-green-500 mt-0.5">Pago em {new Date(b.paidAt).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p className={`text-base font-black ${b.paid ? 'text-green-400' : overdue ? 'text-red-400' : 'text-yellow-400'}`}>
                        R$ {parseFloat(b.value || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!b.paid && (
                    <div className="flex gap-2 px-4 pb-3">
                      <button onClick={() => markBoletoPaid(b.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                        <CheckCircle size={12} /> Marcar como Pago
                      </button>
                      {b.codigo && (
                        <button onClick={() => { navigator.clipboard.writeText(b.codigo) }}
                          className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                          <Copy size={12} />
                        </button>
                      )}
                      <button onClick={() => removeBoleto(b.id)}
                        className="px-3 py-2 rounded-xl transition-all hover:bg-red-500/15">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Photo viewer */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setViewPhoto(null)}>
          <div className="relative max-w-lg w-full mx-4">
            <img src={viewPhoto} alt="boleto" className="w-full rounded-2xl" />
            <button onClick={() => setViewPhoto(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-black/60 rounded-xl flex items-center justify-center hover:bg-black/80 transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <div>
          <p className="text-sm font-black text-white uppercase tracking-wider mb-3">📋 Histórico de Repasses</p>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)' }}>
                <CheckCircle size={14} className="text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{h.person}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Pix: {h.pix}{h.desc ? ` · ${h.desc}` : ''} · {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-base font-black text-green-400 shrink-0">R$ {h.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
