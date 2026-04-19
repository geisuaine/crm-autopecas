import { useState } from 'react'
import { Bell, Search, X, ChevronDown, Target, Phone } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Header({ onProspect, onNewOrder }) {
  const { notifications, showNotifications, setShowNotifications, geisaMode, setGeisaMode, searchQuery, setSearchQuery } = useApp()
  const alertCount = notifications.filter(n => n.type !== 'info').length
  const [imgError, setImgError] = useState(false)

  return (
    <header
      className="px-4 py-3 flex items-center gap-3 shrink-0 z-30"
      style={{ background: 'linear-gradient(135deg,#0d1f42 0%,#091830 100%)', borderBottom: '1px solid #1e3a5f', boxShadow: '0 1px 20px rgba(0,0,0,0.4)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-700/40 bg-blue-950 flex items-center justify-center shrink-0">
          {!imgError
            ? <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={() => setImgError(true)} />
            : <span className="text-white text-sm font-black tracking-tight">AP</span>
          }
        </div>
        <div className="hidden sm:block">
          <p className="font-bold text-white text-sm leading-tight">AutoPeças CRM</p>
          <p className="text-[10px] text-blue-400 leading-tight">Painel de Atendimento</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={15} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all placeholder:text-gray-600 text-white"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          placeholder="Buscar cliente, peça, veículo..."
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Novo Pedido button */}
      <button
        onClick={onNewOrder}
        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all shrink-0"
        style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', boxShadow: '0 0 12px rgba(22,163,74,0.3)' }}
      >
        <Phone size={15} />
        <span>Novo Pedido</span>
      </button>

      {/* Prospectar button */}
      <button
        onClick={onProspect}
        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all shrink-0"
        style={{ background: 'linear-gradient(135deg,#ca8a04,#b45309)', color: '#fff', boxShadow: '0 0 12px rgba(202,138,4,0.3)' }}
      >
        <Target size={15} />
        <span>Prospectar</span>
      </button>

      {/* Notifications */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Bell size={18} className="text-gray-400" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-12 w-80 rounded-2xl z-50 overflow-hidden fade-in"
              style={{ background: '#0d1f42', border: '1px solid #1e3a5f', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1e3a5f' }}>
                <p className="font-semibold text-white text-sm">Notificações</p>
                <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full font-medium">{alertCount} urgentes</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/5"
                  style={{ borderBottom: '1px solid #1a2f52' }}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'urgent' ? 'bg-red-500 pulse-soft' : n.type === 'complaint' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <p className="text-sm text-gray-300 leading-snug">{n.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User / Geisa Toggle */}
      <button
        onClick={() => setGeisaMode(!geisaMode)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all shrink-0"
        style={geisaMode
          ? { background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${geisaMode ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'}`}>
          {geisaMode ? 'G' : 'C'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold leading-tight text-white">{geisaMode ? 'Geisa' : 'Carlos'}</p>
          <p className="text-[10px] leading-tight" style={{ color: geisaMode ? '#f9a8d4' : '#93c5fd' }}>{geisaMode ? 'Gerente' : 'Vendedor'}</p>
        </div>
        <ChevronDown size={13} className="text-gray-500 hidden sm:block" />
      </button>
    </header>
  )
}
