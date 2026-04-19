import { useState } from 'react'
import { Plus, MessageCircle, ShoppingBag, Trash2, TrendingUp, X, Phone, Copy, CheckCircle, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'

const PAYMENT_OPTS = ['Dinheiro', 'Pix', 'Cartão']
const CHANNEL_OPTS = ['WhatsApp', 'Balcão']

const PAYMENT_STYLE = {
  'Dinheiro': { bg: '#f0fdf4', color: '#15803d', icon: '💵' },
  'Pix':      { bg: '#eff6ff', color: '#1d4ed8', icon: '📲' },
  'Cartão':   { bg: '#f5f3ff', color: '#6d28d9', icon: '💳' },
}

const INITIAL_SALES = [
  { id: 1, client: 'João Silva',     phone: '21999887766', piece: 'Farol Dianteiro Corolla', sku: 'FAR-CO-18-E', value: 320, payment: 'Pix',      channel: 'WhatsApp', date: new Date(Date.now() - 30*60000) },
  { id: 2, client: 'Carlos Eduardo', phone: '21988001234', piece: 'Para-choque Gol',         sku: 'PAR-GO-19',   value: 180, payment: 'Dinheiro', channel: 'Balcão',   date: new Date(Date.now() - 90*60000) },
  { id: 3, client: 'Paulo Mendes',   phone: '21955004567', piece: 'Amortecedor HB20',        sku: 'AMO-HB-21-D', value: 280, payment: 'Cartão',   channel: 'WhatsApp', date: new Date(Date.now() - 150*60000) },
]

function timeStr(date) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function buildStockMsg(sale, employeeName) {
  return `📦 *BAIXA DE ESTOQUE*\n\nOlá, ${employeeName.split(' ')[0]}!\n\nVenda registrada:\n• Peça: ${sale.piece}\n• SKU: ${sale.sku || 'N/A'}\n• Cliente: ${sale.client}\n• Valor: R$ ${parseFloat(sale.value).toFixed(2)}\n• Pagamento: ${sale.payment}\n\nFavor confirmar a baixa no estoque. ✅`
}

function buildReceipt(sale) {
  const payIcon = PAYMENT_STYLE[sale.payment]?.icon || ''
  return `🏪 *AUTO PEÇAS — NOTA DE COMPRA*\n\n` +
    `📋 Peça: ${sale.piece}\n` +
    `🔖 SKU: ${sale.sku || 'N/A'}\n` +
    `💰 Valor: R$ ${sale.value.toFixed(2)}\n` +
    `${payIcon} Pagamento: ${sale.payment}\n` +
    `📅 Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}\n\n` +
    `Obrigado pela compra, ${sale.client.split(' ')[0]}! 🙏\n` +
    `Salva nosso contato para facilitar a próxima compra.\n\n` +
    `Qualquer dúvida, é só chamar! 😊`
}

export default function SalesView() {
  const { employees } = useApp()
  const stockists = employees.filter(e => e.role === 'Estoquista' || e.role === 'Vendedor' || e.role === 'Consultora')

  const [sales,      setSales]      = useState(INITIAL_SALES)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState({ client: '', phone: '', piece: '', sku: '', value: '', payment: 'Pix', channel: 'WhatsApp', notifyEmployeeId: '' })
  const [filterCh,   setFilterCh]   = useState('Todos')
  const [receipt,    setReceipt]    = useState(null)
  const [copied,     setCopied]     = useState(false)
  const [stockCopied, setStockCopied] = useState(false)

  const totalDay    = sales.reduce((s, v) => s + v.value, 0)
  const totalWpp    = sales.filter(s => s.channel === 'WhatsApp').reduce((s, v) => s + v.value, 0)
  const totalBalcao = sales.filter(s => s.channel === 'Balcão').reduce((s, v) => s + v.value, 0)

  const filtered = filterCh === 'Todos' ? sales : sales.filter(s => s.channel === filterCh)

  function addSale() {
    if (!form.client || !form.piece || !form.value) return
    const notifyEmp = employees.find(e => e.id === form.notifyEmployeeId)
    const newSale = { ...form, id: Date.now(), value: parseFloat(form.value), date: new Date(), notifyEmployee: notifyEmp || null }
    setSales(prev => [newSale, ...prev])
    setForm({ client: '', phone: '', piece: '', sku: '', value: '', payment: 'Pix', channel: 'WhatsApp', notifyEmployeeId: '' })
    setShowForm(false)
    setReceipt(newSale)
  }

  function removeSale(id) {
    setSales(prev => prev.filter(s => s.id !== id))
  }

  function copyReceipt() {
    if (receipt) {
      navigator.clipboard.writeText(buildReceipt(receipt)).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="p-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white">Registro de Vendas</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}
        >
          <Plus size={16} /> Nova Venda
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total do Dia',  value: totalDay,    icon: TrendingUp,     bg: 'rgba(37,99,235,0.12)',  color: '#60a5fa',  border: 'rgba(37,99,235,0.25)', count: sales.length },
          { label: 'Via WhatsApp',  value: totalWpp,    icon: MessageCircle,  bg: 'rgba(22,163,74,0.12)',  color: '#4ade80',  border: 'rgba(22,163,74,0.25)',  count: sales.filter(s => s.channel === 'WhatsApp').length },
          { label: 'Via Balcão',    value: totalBalcao, icon: ShoppingBag,    bg: 'rgba(124,58,237,0.12)', color: '#c084fc',  border: 'rgba(124,58,237,0.25)', count: sales.filter(s => s.channel === 'Balcão').length },
        ].map(({ label, value, icon: Icon, bg, color, border, count }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color }}>R$ {value.toFixed(2)}</p>
            <p className="text-[11px] mt-0.5" style={{ color, opacity: 0.6 }}>{count} venda{count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['Todos', 'WhatsApp', 'Balcão'].map(ch => (
          <button key={ch} onClick={() => setFilterCh(ch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCh === ch ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            style={filterCh !== ch ? { background: 'rgba(255,255,255,0.06)' } : {}}>
            {ch === 'WhatsApp' && <MessageCircle size={12} />}
            {ch === 'Balcão'   && <ShoppingBag size={12} />}
            {ch}
          </button>
        ))}
      </div>

      {/* Sales list */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600 text-sm">Nenhuma venda registrada</p>
          </div>
        )}
        {filtered.map(sale => {
          const ps = PAYMENT_STYLE[sale.payment] || PAYMENT_STYLE['Pix']
          return (
            <div key={sale.id} className="rounded-2xl p-4 flex items-center gap-4 group transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                sale.channel === 'WhatsApp' ? 'bg-green-500/20' : 'bg-purple-500/20'
              }`}>
                {sale.channel === 'WhatsApp'
                  ? <MessageCircle size={20} className="text-green-400" />
                  : <ShoppingBag size={20} className="text-purple-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white text-sm">{sale.client}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sale.channel === 'WhatsApp' ? 'bg-green-500/15 text-green-400' : 'bg-purple-500/15 text-purple-400'
                  }`}>{sale.channel}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{sale.piece}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {sale.sku && <span className="text-[10px] font-mono text-gray-600">{sale.sku}</span>}
                  {sale.phone && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                      <Phone size={9} />{sale.phone}
                    </span>
                  )}
                  <p className="text-[11px] text-gray-700">{timeStr(sale.date)}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-black text-white">R$ {sale.value.toFixed(2)}</p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ps.bg, color: ps.color }}>
                  {ps.icon} {sale.payment}
                </span>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                <button onClick={() => setReceipt(sale)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <MessageCircle size={13} className="text-green-400" />
                </button>
                <button onClick={() => removeSale(sale.id)} className="p-1.5 rounded-lg hover:bg-red-500/15">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add sale modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 slide-up" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-black text-gray-900 text-lg">Nova Venda</p>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Channel */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Canal de Venda</label>
                <div className="flex gap-2">
                  {CHANNEL_OPTS.map(ch => (
                    <button key={ch} onClick={() => setForm(f => ({ ...f, channel: ch }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                        form.channel === ch
                          ? ch === 'WhatsApp' ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {ch === 'WhatsApp' ? <MessageCircle size={16} /> : <ShoppingBag size={16} />}
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nome do Cliente</label>
                <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                  placeholder="Ex: João Silva"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">WhatsApp do Cliente</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(21) 9 9999-9999"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Piece + SKU */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Peça / Produto</label>
                  <input value={form.piece} onChange={e => setForm(f => ({ ...f, piece: e.target.value }))}
                    placeholder="Ex: Farol Corolla 2018"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">SKU / Código</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    placeholder="Ex: FAR-CO-18"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Notify employee */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notificar Funcionário (baixa SKU)</label>
                <select value={form.notifyEmployeeId} onChange={e => setForm(f => ({ ...f, notifyEmployeeId: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">Nenhum</option>
                  {stockists.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </div>

              {/* Value + Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Valor (R$)</label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="0,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Pagamento</label>
                  <select value={form.payment} onChange={e => setForm(f => ({ ...f, payment: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200">
                    {PAYMENT_OPTS.map(p => <option key={p} value={p}>{PAYMENT_STYLE[p].icon} {p}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={addSale}
                className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:opacity-90 mt-1"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}>
                ✅ Registrar Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setReceipt(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 slide-up" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-900">📋 Nota de Compra</p>
              <button onClick={() => setReceipt(null)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Receipt preview */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{buildReceipt(receipt)}</pre>
            </div>

            {receipt.phone && (
              <p className="text-xs text-gray-500 text-center mb-3">
                Enviar para: <span className="font-bold text-gray-700">{receipt.phone}</span>
              </p>
            )}

            <div className="flex gap-2 mb-2">
              <button onClick={copyReceipt}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: copied ? '#dcfce7' : '#f0fdf4', color: copied ? '#15803d' : '#16a34a', border: `1px solid ${copied ? '#86efac' : '#bbf7d0'}` }}>
                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                {copied ? 'Copiado!' : 'Copiar Nota'}
              </button>
              {receipt.phone && (
                <a href={`https://wa.me/55${receipt.phone.replace(/\D/g,'')}?text=${encodeURIComponent(buildReceipt(receipt))}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  <MessageCircle size={15} /> Enviar WhatsApp
                </a>
              )}
            </div>

            {/* Stock deduction notify */}
            {receipt.sku && receipt.notifyEmployee && (
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                <p className="text-[11px] font-black text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package size={12} /> Baixa de Estoque — {receipt.notifyEmployee.name}
                </p>
                <pre className="text-xs text-blue-800 whitespace-pre-wrap font-sans leading-relaxed mb-2 bg-white rounded-lg p-2 border border-blue-100">
                  {buildStockMsg(receipt, receipt.notifyEmployee.name)}
                </pre>
                <div className="flex gap-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(buildStockMsg(receipt, receipt.notifyEmployee.name))
                    setStockCopied(true); setTimeout(() => setStockCopied(false), 2000)
                  }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: stockCopied ? '#dcfce7' : '#eff6ff', color: stockCopied ? '#15803d' : '#1d4ed8', border: `1px solid ${stockCopied ? '#86efac' : '#bfdbfe'}` }}>
                    {stockCopied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {stockCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                  {receipt.notifyEmployee.phone && (
                    <a href={`https://wa.me/55${receipt.notifyEmployee.phone.replace(/\D/g,'')}?text=${encodeURIComponent(buildStockMsg(receipt, receipt.notifyEmployee.name))}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: '#2563eb' }}>
                      <MessageCircle size={12} /> Enviar WA
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
