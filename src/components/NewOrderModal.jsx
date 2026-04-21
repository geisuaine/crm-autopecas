import { useState } from 'react'
import { X, Phone, Plus, Trash2, Car, User, AlertCircle, CheckCircle, ArrowRight, Store, PhoneCall } from 'lucide-react'
import { useApp } from '../context/AppContext'

function isBusinessHours() {
  const now  = new Date()
  const day  = now.getDay()
  const hour = now.getHours()
  const min  = now.getMinutes()
  const time = hour + min / 60
  if (day === 0) return false
  if (day >= 1 && day <= 5) return time >= 8 && time < 17
  if (day === 6) return time >= 8 && time < 12.5
  return false
}

function buildBalcaoMsg(name, pieces, vehicle) {
  const pieceList = pieces.map(p => `• ${p}`).join('\n')
  const veh = vehicle?.brand ? `${vehicle.brand} ${vehicle.model}${vehicle.year ? ' ' + vehicle.year : ''}` : null
  return `Olá, ${name.split(' ')[0]}! 👋

Obrigado pela sua visita! Salvamos seu contato e seu pedido já entrou no nosso painel de atendimento. ✅

🔧 Peça${pieces.length > 1 ? 's' : ''} solicitada${pieces.length > 1 ? 's' : ''}:
${pieceList}${veh ? `\n\n🚗 Veículo: ${veh}` : ''}

As informações acima estão corretas? ☝️

Tem mais alguma peça para incluir neste pedido? Pode responder aqui! 😊

Estamos buscando a disponibilidade e retornamos em breve! 💪`
}

function buildPhoneMsg(name, pieces, vehicle) {
  const pieceList = pieces.map(p => `• ${p}`).join('\n')
  const veh = vehicle?.brand ? `${vehicle.brand} ${vehicle.model}${vehicle.year ? ' ' + vehicle.year : ''}` : null
  return `Olá, ${name.split(' ')[0]}! 👋\n\nRecebemos seu pedido.\n\n🔧 Peça${pieces.length > 1 ? 's' : ''} solicitada${pieces.length > 1 ? 's' : ''}:\n${pieceList}${veh ? `\n\n🚗 Veículo: ${veh}` : ''}\n\nEstamos verificando a disponibilidade com nossos colaboradores e retornamos em breve! ⏳\n\nAguarde, estamos no seu pedido! 💪`
}

function buildOutOfHoursMsg(name, pieces, vehicle) {
  const pieceList = pieces.map(p => `• ${p}`).join('\n')
  const veh = vehicle?.brand ? `${vehicle.brand} ${vehicle.model}${vehicle.year ? ' ' + vehicle.year : ''}` : null
  const now = new Date()
  const day = now.getDay()
  const isWeekend = day === 0 || day === 6
  return `Olá, ${name.split(' ')[0]}! 👋

Obrigado por entrar em contato com a *Auto Peças*!

Recebemos o seu pedido:
${pieceList}${veh ? `\n🚗 Veículo: ${veh}` : ''}

${isWeekend ? '📅 Estamos fora do expediente no momento.' : '⏰ Estamos fora do horário comercial no momento.'}

🕐 *Horário de atendimento:*
• Segunda a Sexta: 8h às 17h
• Sábado: 8h às 12h30

✅ Seu pedido *já foi para o nosso painel de atendimento!*

As informações acima estão corretas? ☝️

Assim que iniciarmos o expediente entraremos em contato. Caso não tenhamos todas as peças disponíveis, verificaremos com nossos colaboradores! 💪`
}

function buildAddPieceMsg(name, pieces) {
  const pieceList = pieces.map(p => `• ${p}`).join('\n')
  return `Olá, ${name.split(' ')[0]}! 👋\n\nAdicionamos ao seu pedido:\n${pieceList}\n\nEstamos buscando a disponibilidade. Retornamos em breve! ⏳`
}

export default function NewOrderModal({ onClose }) {
  const { cards, addCard, addPiecesToCard } = useApp()

  const [channel,  setChannel]  = useState('')        // 'balcao' | 'telefone'
  const [phone,    setPhone]    = useState('')
  const [name,     setName]     = useState('')
  const [type,     setType]     = useState('')
  const [address,  setAddress]  = useState('')
  const [brand,    setBrand]    = useState('')
  const [model,    setModel]    = useState('')
  const [year,     setYear]     = useState('')
  const [pieces,   setPieces]   = useState([''])
  const [step,     setStep]     = useState('channel') // channel | phone | existing | new | done
  const [existing, setExisting] = useState(null)
  const [done,     setDone]     = useState(null)

  function checkPhone() {
    if (!phone.trim()) return
    const digits = phone.replace(/\D/g, '')
    const found = cards.find(c =>
      c.client.phone?.replace(/\D/g, '') === digits &&
      !['finalizado'].includes(c.column)
    )
    if (found) { setExisting(found); setStep('existing') }
    else       { setStep('new') }
  }

  function selectChannel(ch) {
    setChannel(ch)
    setStep(ch === 'telefone' ? 'phone' : 'new')
  }

  function addPieceField()      { setPieces(p => [...p, '']) }
  function removePieceField(i)  { setPieces(p => p.filter((_, idx) => idx !== i)) }
  function updatePiece(i, val)  { setPieces(p => p.map((v, idx) => idx === i ? val : v)) }

  const validPieces = pieces.filter(p => p.trim())

  function submitNew() {
    if (!name || validPieces.length === 0) return
    const vehicle = brand ? { brand, model, year } : null
    let msg
    if (channel === 'balcao') {
      msg = buildBalcaoMsg(name, validPieces, vehicle)
    } else {
      const ooh = !isBusinessHours()
      msg = ooh ? buildOutOfHoursMsg(name, validPieces, vehicle) : buildPhoneMsg(name, validPieces, vehicle)
    }
    const card = addCard({
      client: { name, phone: phone.replace(/\D/g,''), type, address, isReturning: false, channel },
      vehicle,
      pieces: validPieces,
      welcomeMsg: msg,
    })
    setDone({ card, msg, isNew: true, outOfHours: channel !== 'balcao' && !isBusinessHours(), channel })
    setStep('done')
  }

  function submitAddToExisting() {
    if (validPieces.length === 0) return
    const msg = buildAddPieceMsg(existing.client.name, validPieces)
    addPiecesToCard(existing.id, validPieces, msg)
    setDone({ card: existing, msg, isNew: false, channel })
    setStep('done')
  }

  const isBalcao   = channel === 'balcao'
  const isTelefone = channel === 'telefone'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}>
      <div className="bg-white w-full md:w-[520px] md:max-w-[96vw] max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isBalcao ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              {isBalcao ? <Store size={18} className="text-white" /> : <PhoneCall size={18} className="text-white" />}
            </div>
            <div>
              <p className="font-black text-gray-900 text-base">
                {step === 'channel' ? 'Novo Pedido' : isBalcao ? 'Atendimento no Balcão' : 'Pedido por Telefone'}
              </p>
              <p className="text-[11px] text-gray-400">
                {step === 'channel' ? 'Selecione o tipo de atendimento' : 'Cadastro manual de cliente'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── STEP: channel selector ── */}
          {step === 'channel' && (
            <div className="space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider text-center">Como o cliente está chegando?</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Balcão */}
                <button
                  onClick={() => selectChannel('balcao')}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ border: '2px solid #d1fae5', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 6px 20px rgba(22,163,74,0.35)' }}>
                    <Store size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-900 text-base">Balcão</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Cliente veio pessoalmente</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    Presencial
                  </span>
                </button>

                {/* Telefone */}
                <button
                  onClick={() => selectChannel('telefone')}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ border: '2px solid #dbeafe', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
                    <PhoneCall size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-900 text-base">Telefone</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Ligou ou mandou mensagem</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    Remoto
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: phone check (telefone only) ── */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Telefone / WhatsApp do cliente</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && checkPhone()}
                      placeholder="(21) 9 9999-9999"
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <button onClick={checkPhone} disabled={!phone.trim()}
                    className="px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                    <ArrowRight size={16} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Vamos verificar se o cliente já tem um pedido ativo.</p>
              </div>
              <button onClick={() => setStep('channel')} className="text-xs text-gray-400 hover:text-gray-600 underline">
                ← Voltar
              </button>
            </div>
          )}

          {/* ── STEP: existing client found ── */}
          {step === 'existing' && existing && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-blue-600" />
                  <p className="text-sm font-black text-blue-700">Cliente já tem pedido ativo!</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-800">{existing.client.name}</p>
                  {existing.vehicle && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Car size={11} /> {existing.vehicle.brand} {existing.vehicle.model} {existing.vehicle.year}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {existing.pieces.map(p => (
                      <span key={p.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">Peças que o cliente está pedindo agora</label>
                {pieces.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={p} onChange={e => updatePiece(i, e.target.value)}
                      placeholder={`Peça ${i + 1}...`}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    {pieces.length > 1 && (
                      <button onClick={() => removePieceField(i)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addPieceField} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 mt-1">
                  <Plus size={14} /> Adicionar outra peça
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={submitAddToExisting} disabled={validPieces.length === 0}
                  className="flex-1 py-3 rounded-xl font-black text-white text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                  Adicionar ao Pedido Existente
                </button>
                <button onClick={() => setStep('new')}
                  className="px-4 py-3 rounded-xl font-bold text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Novo Pedido
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: new client ── */}
          {step === 'new' && (
            <div className="space-y-4">

              {/* Channel badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: isBalcao ? '#f0fdf4' : '#eff6ff', border: `1px solid ${isBalcao ? '#bbf7d0' : '#bfdbfe'}` }}>
                {isBalcao ? <Store size={13} className="text-green-600" /> : <PhoneCall size={13} className="text-blue-600" />}
                <span className={`text-xs font-black ${isBalcao ? 'text-green-700' : 'text-blue-700'}`}>
                  {isBalcao ? 'Atendimento no Balcão — cliente presencial' : 'Pedido por Telefone / WhatsApp'}
                </span>
                <button onClick={() => { setStep('channel'); setChannel('') }} className="ml-auto text-[10px] underline text-gray-400 hover:text-gray-600">
                  Trocar
                </button>
              </div>

              {/* Client info */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User size={12} /> Cliente
                </p>
                <div className="space-y-2">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo *"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp"
                        className="w-full pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <input value={type} onChange={e => setType(e.target.value)} placeholder="Tipo (Oficina, PF...)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Endereço (opcional)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Vehicle */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Car size={12} /> Veículo (opcional)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Marca"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input value={model} onChange={e => setModel(e.target.value)} placeholder="Modelo"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input value={year} onChange={e => setYear(e.target.value)} placeholder="Ano"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Pieces */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">🔧 Peças Solicitadas *</p>
                {pieces.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={p} onChange={e => updatePiece(i, e.target.value)}
                      placeholder={`Peça ${i + 1}...`}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    {pieces.length > 1 && (
                      <button onClick={() => removePieceField(i)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addPieceField} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
                  <Plus size={14} /> Adicionar outra peça
                </button>
              </div>

              {/* Preview message */}
              {name && validPieces.length > 0 && (() => {
                const vehicle = brand ? { brand, model, year } : null
                const preview = isBalcao
                  ? buildBalcaoMsg(name, validPieces, vehicle)
                  : (!isBusinessHours() ? buildOutOfHoursMsg(name, validPieces, vehicle) : buildPhoneMsg(name, validPieces, vehicle))
                const isOoh = !isBalcao && !isBusinessHours()
                return (
                  <div className={`p-3 rounded-xl border ${isBalcao ? 'bg-green-50 border-green-200' : isOoh ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${isBalcao ? 'text-green-700' : isOoh ? 'text-amber-700' : 'text-blue-700'}`}>
                      {isBalcao ? '📱 Mensagem de confirmação para o cliente' : isOoh ? '⏰ Fora do horário — mensagem automática' : '📱 Mensagem que será enviada ao cliente'}
                    </p>
                    <pre className={`text-xs whitespace-pre-wrap font-sans leading-relaxed ${isBalcao ? 'text-green-900' : isOoh ? 'text-amber-900' : 'text-blue-900'}`}>{preview}</pre>
                  </div>
                )
              })()}

              <button onClick={submitNew} disabled={!name || validPieces.length === 0}
                className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:opacity-90 disabled:opacity-40"
                style={{
                  background: isBalcao ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  boxShadow: isBalcao ? '0 4px 16px rgba(22,163,74,0.35)' : '0 4px 16px rgba(37,99,235,0.35)',
                }}>
                {isBalcao ? '🏪 Salvar Contato e Enviar para o Painel' : '✅ Cadastrar e Enviar para o Painel'}
              </button>
            </div>
          )}

          {/* ── STEP: done ── */}
          {step === 'done' && done && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${done.channel === 'balcao' ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
                  <CheckCircle size={32} className={done.channel === 'balcao' ? 'text-green-500' : 'text-blue-500'} />
                </div>
                <p className="font-black text-gray-900 text-lg mb-1">
                  {done.isNew ? (done.channel === 'balcao' ? 'Contato salvo! Pedido no painel! 🏪' : 'Pedido criado!') : 'Peças adicionadas!'}
                </p>
                <p className="text-sm text-gray-500">
                  {done.isNew
                    ? `${done.card.client.name} foi cadastrado e o pedido entrou no painel.`
                    : `Peças adicionadas ao pedido de ${existing?.client.name}.`}
                </p>
                {done.channel === 'balcao' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <Store size={12} /> Atendimento no Balcão
                  </div>
                )}
                {done.outOfHours && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    ⏰ Pedido fora do horário comercial
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-xl border ${done.channel === 'balcao' ? 'bg-green-50 border-green-200' : done.outOfHours ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${done.channel === 'balcao' ? 'text-green-600' : done.outOfHours ? 'text-amber-600' : 'text-gray-500'}`}>
                  {done.channel === 'balcao' ? '📱 Mensagem de confirmação' : done.outOfHours ? '⏰ Mensagem fora do horário' : 'Mensagem para o cliente'}
                </p>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{done.msg}</pre>
              </div>

              <div className="flex gap-2">
                {done.card.client.phone && (
                  <a href={`https://wa.me/55${done.card.client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(done.msg)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                    📱 Enviar WhatsApp
                  </a>
                )}
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
