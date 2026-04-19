import { useState, useRef, useEffect } from 'react'
import { Upload, X, Plus, Trash2, Play, CheckCircle, Clock, AlertCircle, Shuffle, History, MapPin } from 'lucide-react'
import { useApp } from '../context/AppContext'

const MAX_DIA = 20
const STORAGE_KEY = 'disparos_historico'

const VARIACOES = [
  'Oi! Somos da {loja}, especialistas em autopeças. Salva nosso contato pra receber ofertas 😊',
  'Olá! Aqui é da {loja}. Trabalhamos com peças pra todo tipo de veículo. Salva o número!',
  'Boa tarde! {loja} aqui 👋 Peças com ótimo preço e entrega rápida. Salva nosso contato!',
  'Oi, tudo bem? Somos da {loja} — autopeças de qualidade. Pode salvar esse número 😉',
  'Olá! A {loja} tem as peças que você precisa. Salva o contato e chama quando precisar! 🔧',
]

function gerarVariacao(textoBase, loja) {
  if (textoBase.trim()) return textoBase
  const idx = Math.floor(Math.random() * VARIACOES.length)
  return VARIACOES[idx].replace('{loja}', loja || 'nossa loja')
}

function delayAleatorio() {
  return [3, 5, 7, 10, 12, 15, 18, 20, 22, 25][Math.floor(Math.random() * 10)]
}

function carregarHistorico() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function salvarHistorico(historico) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historico))
}

function formatarNum(num) {
  return num.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')
}

export default function DisparosView() {
  const { disparosQueue, setDisparosQueue } = useApp()

  const [foto, setFoto]               = useState(null)
  const [textoBase, setTextoBase]     = useState('')
  const [nomeLoja, setNomeLoja]       = useState('')
  const [regiao, setRegiao]           = useState('')
  const [contatos, setContatos]       = useState([])
  const [novoContato, setNovoContato] = useState('')
  const [fila, setFila]               = useState([])
  const [rodando, setRodando]         = useState(false)
  const [preview, setPreview]         = useState(null)
  const [historico, setHistorico]     = useState(carregarHistorico)
  const [abaAtiva, setAbaAtiva]       = useState('disparar') // 'disparar' | 'historico'
  const [filtroRegiao, setFiltroRegiao] = useState('Todas')
  const fileRef = useRef()

  // Absorve contatos vindos da prospecção
  useEffect(() => {
    if (disparosQueue.length === 0) return
    const jaEnviados = new Set(historico.map(h => h.numero))
    const novos = disparosQueue
      .map(d => d.numero)
      .filter(n => !contatos.includes(n) && !jaEnviados.has(n))
    if (novos.length > 0) setContatos(prev => [...prev, ...novos].slice(0, MAX_DIA))
    setDisparosQueue([])
  }, [disparosQueue])

  const enviados  = fila.filter(d => d.status === 'enviado').length
  const pendentes = fila.filter(d => d.status === 'pendente').length
  const totalHist = historico.length

  const regioes = ['Todas', ...Array.from(new Set(historico.map(h => h.regiao).filter(Boolean)))]
  const histFiltrado = filtroRegiao === 'Todas'
    ? historico
    : historico.filter(h => h.regiao === filtroRegiao)

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFoto({ file, url: URL.createObjectURL(file) })
  }

  function adicionarContato() {
    const num = novoContato.replace(/\D/g, '')
    if (!num || num.length < 10) return
    const jaEnviado = historico.some(h => h.numero === num)
    if (jaEnviado) { alert('Esse número já recebeu disparo antes!'); return }
    if (contatos.includes(num)) return
    setContatos(prev => [...prev, num])
    setNovoContato('')
  }

  function removerContato(num) {
    setContatos(prev => prev.filter(c => c !== num))
  }

  function importarLista(e) {
    const jaEnviados = new Set(historico.map(h => h.numero))
    const nums = e.target.value.split(/[\n,;]/)
      .map(n => n.replace(/\D/g, ''))
      .filter(n => n.length >= 10 && !jaEnviados.has(n))
    setContatos(prev => [...new Set([...prev, ...nums])].slice(0, MAX_DIA))
  }

  function prepararFila() {
    if (!foto)               { alert('Adicione a foto do cartão'); return }
    if (!regiao.trim())      { alert('Informe a região dos contatos'); return }
    if (contatos.length === 0) { alert('Adicione pelo menos 1 contato'); return }

    const jaEnviados = new Set(historico.map(h => h.numero))
    const aptos = contatos.filter(n => !jaEnviados.has(n)).slice(0, MAX_DIA)
    const bloqueados = contatos.filter(n => jaEnviados.has(n))

    const novafila = [
      ...aptos.map((num, i) => ({
        id: `${Date.now()}-${i}`,
        numero: num,
        texto: gerarVariacao(textoBase, nomeLoja),
        delay: delayAleatorio(),
        status: 'pendente',
        regiao: regiao.trim(),
        horaEnvio: null,
      })),
      ...bloqueados.map((num, i) => ({
        id: `bloq-${Date.now()}-${i}`,
        numero: num,
        texto: '',
        delay: 0,
        status: 'bloqueado',
        regiao: regiao.trim(),
        horaEnvio: null,
        motivo: 'Já recebeu disparo antes',
      })),
    ]
    setFila(novafila)
  }

  function iniciarDisparos() {
    if (fila.length === 0) { prepararFila(); return }
    const aptos = fila.filter(d => d.status === 'pendente')
    if (aptos.length === 0) return
    setRodando(true)

    let idx = 0
    function enviarProximo() {
      if (idx >= aptos.length) {
        setRodando(false)
        return
      }
      const item = aptos[idx]
      setTimeout(() => {
        const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setFila(prev => prev.map(d =>
          d.id === item.id ? { ...d, status: 'enviado', horaEnvio: agora } : d
        ))
        // Salva no histórico
        const registro = {
          numero: item.numero,
          texto: item.texto,
          regiao: item.regiao,
          data: new Date().toLocaleDateString('pt-BR'),
          hora: agora,
          nomeLoja: nomeLoja || '',
        }
        setHistorico(prev => {
          const novo = [registro, ...prev]
          salvarHistorico(novo)
          return novo
        })
        idx++
        enviarProximo()
      }, item.delay * 1000)
    }
    enviarProximo()
  }

  function limparFila() {
    setFila([])
    setContatos([])
    setRodando(false)
  }

  function limparHistorico() {
    if (!confirm('Limpar todo o histórico? Isso permite re-disparar para os mesmos números.')) return
    setHistorico([])
    salvarHistorico([])
  }

  return (
    <div className="p-5 max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Disparos WhatsApp</h2>
          <p className="text-xs text-gray-500 mt-0.5">Máximo {MAX_DIA}/dia · Delay aleatório · Nunca repete número</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {[['disparar','Disparar'],['historico','Histórico']].map(([id, label]) => (
            <button key={id} onClick={() => setAbaAtiva(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
              {id === 'historico' && totalHist > 0 && (
                <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{totalHist}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {abaAtiva === 'disparar' && (
        <>
          {/* Cards de progresso */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Enviados',  value: enviados,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Na fila',   value: pendentes, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
              { label: 'Histórico', value: totalHist, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl p-3 border ${bg}`}>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Esquerda — configuração */}
            <div className="space-y-4">

              {/* Foto */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Foto do Cartão</p>
                {foto ? (
                  <div className="relative">
                    <img src={foto.url} alt="cartão" className="w-full rounded-xl object-cover max-h-36" />
                    <button onClick={() => setFoto(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current.click()}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 transition-colors">
                    <Upload size={20} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Clique pra subir a foto</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </div>

              {/* Mensagem */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Mensagem</p>
                <input value={nomeLoja} onChange={e => setNomeLoja(e.target.value)}
                  placeholder="Nome da loja (ex: AutoPeças Silva)"
                  className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input value={regiao} onChange={e => setRegiao(e.target.value)}
                    placeholder="Região (ex: Zona Norte SP, Tijuca RJ)"
                    className="w-full pl-8 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                </div>
                <textarea value={textoBase} onChange={e => setTextoBase(e.target.value)}
                  placeholder="Deixe vazio pra IA criar automaticamente..."
                  rows={3}
                  className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />
                <button onClick={() => setPreview(gerarVariacao(textoBase, nomeLoja))}
                  className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Shuffle size={12} /> Ver exemplo de variação
                </button>
                {preview && (
                  <div className="text-xs text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">{preview}</div>
                )}
              </div>
            </div>

            {/* Direita — contatos */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Contatos</p>
                <span className="text-xs text-gray-500">{contatos.length}/{MAX_DIA}</span>
              </div>
              <div className="flex gap-2">
                <input value={novoContato} onChange={e => setNovoContato(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarContato()}
                  placeholder="55 11 99999-9999"
                  className="flex-1 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                <button onClick={adicionarContato}
                  className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors shrink-0">
                  <Plus size={15} className="text-white" />
                </button>
              </div>
              <textarea placeholder="Cole vários números aqui (vírgula, ponto e vírgula ou linha)"
                rows={3} onChange={importarLista}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {contatos.map(num => {
                  const jaEnviado = historico.some(h => h.numero === num)
                  return (
                    <div key={num} className={`flex items-center justify-between px-3 py-2 rounded-xl ${jaEnviado ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {jaEnviado && <AlertCircle size={11} className="text-red-400 shrink-0" />}
                        <span className={`text-sm font-mono ${jaEnviado ? 'text-red-400' : 'text-gray-300'}`}>{formatarNum(num)}</span>
                        {jaEnviado && <span className="text-[10px] text-red-400">já enviado</span>}
                      </div>
                      <button onClick={() => removerContato(num)}>
                        <Trash2 size={12} className="text-gray-600 hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  )
                })}
                {contatos.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">Nenhum contato adicionado</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={fila.length === 0 ? prepararFila : iniciarDisparos}
              disabled={rodando || contatos.length === 0 || !foto}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: rodando ? 'rgba(34,197,94,0.2)' : '#16a34a', color: 'white' }}>
              {rodando
                ? <><Clock size={15} className="animate-spin" /> Disparando...</>
                : <><Play size={15} /> {fila.length === 0 ? 'Preparar Fila' : 'Iniciar Disparos'}</>}
            </button>
            {fila.length > 0 && !rodando && (
              <button onClick={limparFila}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X size={15} /> Limpar
              </button>
            )}
          </div>

          {/* Fila */}
          {fila.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-4 py-3 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Fila de Disparos</p>
              </div>
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                {fila.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    {d.status === 'enviado'   && <CheckCircle size={15} className="text-green-400 shrink-0" />}
                    {d.status === 'pendente'  && <Clock size={15} className="text-yellow-400 shrink-0" />}
                    {d.status === 'bloqueado' && <AlertCircle size={15} className="text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-300">{formatarNum(d.numero)}</p>
                      {d.status === 'bloqueado'
                        ? <p className="text-[11px] text-red-400">{d.motivo}</p>
                        : <p className="text-[11px] text-gray-600 truncate">{d.texto}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {d.status === 'enviado'  && <p className="text-[11px] text-green-400">{d.horaEnvio}</p>}
                      {d.status === 'pendente' && <p className="text-[11px] text-gray-600">delay {d.delay}s</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-600">
            ⚠️ Limite de {MAX_DIA} disparos/dia · Delays aleatórios de 3-25s · Números já disparados são bloqueados automaticamente
          </p>
        </>
      )}

      {abaAtiva === 'historico' && (
        <>
          {/* Filtro por região */}
          <div className="flex items-center gap-2 flex-wrap">
            <History size={14} className="text-gray-500" />
            <p className="text-xs text-gray-500">Filtrar por região:</p>
            {regioes.map(r => (
              <button key={r} onClick={() => setFiltroRegiao(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroRegiao === r ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                {r}
              </button>
            ))}
            {historico.length > 0 && (
              <button onClick={limparHistorico}
                className="ml-auto text-[11px] text-red-400 hover:text-red-300 transition-colors">
                Limpar tudo
              </button>
            )}
          </div>

          {/* Lista de histórico agrupada */}
          {histFiltrado.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 text-sm">Nenhum disparo enviado ainda</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{histFiltrado.length} disparos enviados</p>
                {filtroRegiao !== 'Todas' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400">
                    <MapPin size={11} /> {filtroRegiao}
                  </div>
                )}
              </div>
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {histFiltrado.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <CheckCircle size={14} className="text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-300">{formatarNum(h.numero)}</p>
                      <p className="text-[11px] text-gray-600 truncate">{h.texto}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[11px] text-gray-500">{h.data} {h.hora}</p>
                      {h.regiao && (
                        <div className="flex items-center justify-end gap-1">
                          <MapPin size={9} className="text-blue-400" />
                          <p className="text-[10px] text-blue-400">{h.regiao}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
