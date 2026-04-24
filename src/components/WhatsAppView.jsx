import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, Send, MessageCircle, Image as ImageIcon, X,
  CheckCircle2, Package, DollarSign, Truck, PartyPopper,
  CreditCard, Flag,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const NOTIFY_URL = 'https://xrukjtxunvwgipvebkzf.supabase.co/functions/v1/notify-client'

const STATUS_BUTTONS = [
  { key: 'em-busca',           label: '🔍 Em Busca',             color: 'bg-orange-500 hover:bg-orange-600',  msg: '🔍 Estamos buscando a peça com nossa rede de colaboradores. Aguarde, te avisamos em breve!' },
  { key: 'peca-encontrada',    label: '✅ Peça Encontrada',       color: 'bg-emerald-500 hover:bg-emerald-600', msg: '✅ Boa notícia! Localizamos a peça para você. Em breve te enviamos o valor e a foto!' },
  { key: 'aguardando-repasse', label: '💳 Aguardando Repasse',   color: 'bg-rose-500 hover:bg-rose-600',      msg: '💳 Seu pedido está aguardando confirmação de pagamento. Qualquer dúvida é só chamar!' },
  { key: 'venda-concretizada', label: '💰 Venda Concretizada',   color: 'bg-amber-500 hover:bg-amber-600',    msg: '💰 Venda confirmada! Obrigado pela preferência. Vamos preparar sua peça para envio.' },
  { key: 'aguardando-envio',   label: '🚚 Aguardando Envio',     color: 'bg-purple-500 hover:bg-purple-600',  msg: '🚚 Peça separada! Estamos aguardando o envio/entrega. Logo mais chega!' },
  { key: 'finalizado',         label: '🏁 Finalizado',           color: 'bg-slate-500 hover:bg-slate-600',    msg: '🏁 Pedido finalizado! Muito obrigado pela preferência. Qualquer coisa, estamos à disposição!' },
]

function formatTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const today = new Date()
    const sameDay = d.toDateString() === today.toDateString()
    if (sameDay) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch { return '' }
}

function formatFullTime(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

function formatPhone(num) {
  if (!num) return ''
  const n = String(num).replace(/\D/g, '').replace(/^55/, '')
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return num
}

function renderPreview(msg) {
  if (!msg) return ''
  if (msg.tipo === 'imageMessage' || msg.tipo === 'image') return '📷 Foto'
  if (msg.tipo === 'audioMessage' || msg.tipo === 'audio' || msg.tipo === 'pttMessage') return '🎤 Áudio'
  const text = msg.mensagem || ''
  return text.length > 48 ? `${text.slice(0, 48)}…` : text
}

function MsgBubble({ m }) {
  const mine = !!m.de_mim
  const isImage = m.tipo === 'imageMessage' || m.tipo === 'image'
  const isAudio = m.tipo === 'audioMessage' || m.tipo === 'audio' || m.tipo === 'pttMessage'

  const hasBase64 = m.mensagem && m.mensagem.startsWith('data:image')

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[72%] px-3 py-2 rounded-2xl shadow-sm text-sm ${
          mine ? 'bg-green-500 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'
        }`}
      >
        {isImage && hasBase64 ? (
          <img src={m.mensagem} alt="foto" className="rounded-xl max-w-[220px] max-h-[220px] object-cover mb-1" />
        ) : isImage ? (
          <span className="inline-flex items-center gap-1 opacity-80">📷 Foto recebida</span>
        ) : isAudio ? (
          <span className="inline-flex items-center gap-1 opacity-80">🎤 Áudio</span>
        ) : (
          <span className="whitespace-pre-wrap break-words">{m.mensagem}</span>
        )}
        <div className={`text-[10px] mt-0.5 text-right ${mine ? 'text-green-100' : 'text-slate-400'}`}>
          {formatFullTime(m.criado_em)}
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppView() {
  const [messages, setMessages]           = useState([])
  const [selectedNumero, setSelectedNumero] = useState(null)
  const [inputValue, setInputValue]       = useState('')
  const [sending, setSending]             = useState(false)
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [imagePreview, setImagePreview]   = useState(null) // { base64, name }
  const threadRef   = useRef(null)
  const fileInputRef = useRef(null)

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('mensagens_whatsapp')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(2000)
    if (data) setMessages(data)
    setLoading(false)
  }

  useEffect(() => {
    loadMessages()
    const ch = supabase
      .channel('wa_view_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_whatsapp' }, ({ new: row }) => {
        setMessages(prev => prev.some(m => m.id === row.id) ? prev : [row, ...prev])
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const conversations = useMemo(() => {
    const map = new Map()
    for (const m of messages) {
      if (!m.numero) continue
      if (!map.has(m.numero)) map.set(m.numero, [])
      map.get(m.numero).push(m)
    }
    const list = []
    for (const [numero, msgs] of map.entries()) {
      const sorted = [...msgs].sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em))
      const last = sorted[sorted.length - 1]
      const nome = sorted.map(m => m.nome).filter(Boolean).reverse().find(n => n !== 'Marcelo') || null
      const unread = last?.de_mim === false
      list.push({ numero, nome, messages: sorted.slice(-60), last, unread })
    }
    return list.sort((a, b) => {
      const ta = a.last ? new Date(a.last.criado_em).getTime() : 0
      const tb = b.last ? new Date(b.last.criado_em).getTime() : 0
      return tb - ta
    })
  }, [messages])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(c =>
      (c.nome || '').toLowerCase().includes(q) || (c.numero || '').includes(q)
    )
  }, [conversations, search])

  const active = useMemo(
    () => conversations.find(c => c.numero === selectedNumero) || null,
    [conversations, selectedNumero],
  )

  useEffect(() => {
    if (!selectedNumero && conversations.length > 0) setSelectedNumero(conversations[0].numero)
  }, [conversations, selectedNumero])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [active?.messages.length, selectedNumero])

  async function send(customText, mediaBase64) {
    const text = (customText ?? inputValue).trim()
    if ((!text && !mediaBase64) || !selectedNumero || sending) return
    setSending(true)
    try {
      const body = mediaBase64
        ? { numero: selectedNumero, mediaBase64, mediaCaption: text || '' }
        : { numero: selectedNumero, customMessage: text }

      await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      await supabase.from('mensagens_whatsapp').insert({
        numero: selectedNumero,
        nome: 'Marcelo',
        mensagem: mediaBase64 ? mediaBase64 : text,
        tipo: mediaBase64 ? 'image' : 'text',
        de_mim: true,
      })

      if (!customText) setInputValue('')
      setImagePreview(null)
    } catch (err) {
      alert('Erro ao enviar: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview({ base64: reader.result, name: file.name })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: '#060d1f' }}>
      {/* Left: conversation list */}
      <aside className="flex w-80 shrink-0 flex-col" style={{ background: '#0f1e35', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={17} className="text-green-400" />
            <h2 className="font-bold text-white text-sm">WhatsApp</h2>
            <span className="ml-auto text-[11px] text-slate-500">{conversations.length} conv.</span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou número..."
              className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-6 text-center text-slate-500 text-xs">Carregando...</p>}
          {!loading && filtered.length === 0 && <p className="p-6 text-center text-slate-500 text-xs">Sem conversas ainda</p>}
          {!loading && filtered.map(c => {
            const isAct = c.numero === selectedNumero
            return (
              <button
                key={c.numero}
                onClick={() => setSelectedNumero(c.numero)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b"
                style={{
                  borderColor: 'rgba(255,255,255,0.05)',
                  background: isAct ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold uppercase"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  {(c.nome || c.numero || '?').slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-sm text-white truncate">{c.nome || 'Sem nome'}</p>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatTime(c.last?.criado_em)}</span>
                  </div>
                  <p className="text-[11px] text-green-400 truncate">{formatPhone(c.numero)}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[11px] text-slate-500 truncate flex-1">
                      {c.last?.de_mim ? <span className="text-slate-600">Você: </span> : null}
                      {renderPreview(c.last)}
                    </p>
                    {c.unread && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Right: conversation */}
      <section className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <MessageCircle size={52} className="mb-3 opacity-30" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="px-5 py-3.5 flex items-center gap-3 border-b" style={{ background: '#0f1e35', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                {(active.nome || active.numero || '?').slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm">{active.nome || 'Sem nome'}</p>
                <p className="text-[12px] text-green-400 font-mono">{formatPhone(active.numero)}</p>
              </div>
            </header>

            {/* Status buttons */}
            <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-b" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              {STATUS_BUTTONS.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => send(btn.msg)}
                  disabled={sending}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold text-white transition-colors disabled:opacity-40 ${btn.color}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
              style={{ background: '#0b1728' }}>
              {active.messages.length === 0 && (
                <p className="text-center text-slate-600 text-xs py-10">Nenhuma mensagem ainda</p>
              )}
              {active.messages.map(m => <MsgBubble key={m.id} m={m} />)}
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="px-4 py-2 flex items-center gap-3 border-t" style={{ background: '#0f1e35', borderColor: 'rgba(255,255,255,0.07)' }}>
                <img src={imagePreview.base64} alt="preview" className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{imagePreview.name}</p>
                  <p className="text-[11px] text-slate-500">Pronto para enviar</p>
                </div>
                <button onClick={() => setImagePreview(null)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input */}
            <footer className="px-4 py-3 border-t" style={{ background: '#0f1e35', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-end gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  title="Enviar foto"
                >
                  <ImageIcon size={16} className="text-slate-400" />
                </button>
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={imagePreview ? 'Legenda (opcional)...' : 'Digite uma mensagem...'}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl px-4 py-2 text-sm outline-none max-h-28"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                />
                <button
                  onClick={() => imagePreview ? send(inputValue || '', imagePreview.base64) : send()}
                  disabled={sending || (!inputValue.trim() && !imagePreview)}
                  className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  )
}
