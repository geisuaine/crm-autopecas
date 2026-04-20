import { useState, useEffect, useRef } from 'react'
import { Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react'

const EVOLUTION_URL = 'http://75.119.131.233:8080'
const EVOLUTION_KEY = 'crm-autopecas-2025'
const INSTANCE      = 'geisa'

const headers = { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY }

export default function WhatsAppStatus() {
  const [status, setStatus]   = useState(null) // null | 'open' | 'close' | 'connecting'
  const [qrCode, setQrCode]   = useState(null)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef(null)

  async function verificarStatus() {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, { headers })
      if (!res.ok) { setStatus('close'); return }
      const data = await res.json()
      const state = data?.instance?.state || data?.state || 'close'
      setStatus(state)
      if (state === 'open') setQrCode(null)
    } catch {
      setStatus('close')
    }
  }

  async function buscarQrCode() {
    setLoading(true)
    setStatus('connecting')
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, { headers })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const qr = data?.qrcode?.base64 || data?.base64 || null
      if (qr) setQrCode(qr)
    } catch {
      setStatus('close')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verificarStatus()
    pollRef.current = setInterval(verificarStatus, 10000)
    return () => clearInterval(pollRef.current)
  }, [])

  const isConnected = status === 'open'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <Smartphone size={18} className={isConnected ? 'text-green-400' : 'text-red-400'} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">WhatsApp</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : status === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
              <p className="text-[11px] text-gray-400">
                {isConnected ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={verificarStatus}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            title="Atualizar status"
          >
            <RefreshCw size={14} />
          </button>

          {!isConnected && (
            <button
              onClick={buscarQrCode}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
              {loading ? 'Aguarde...' : 'Conectar'}
            </button>
          )}

          {isConnected && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20">
              <Wifi size={12} className="text-green-400" />
              <span className="text-xs font-bold text-green-400">Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      {qrCode && !isConnected && (
        <div className="p-5 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400 text-center">Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo</p>
          <div className="p-3 bg-white rounded-2xl">
            <img src={qrCode} alt="QR Code WhatsApp" className="w-52 h-52 object-contain" />
          </div>
          <p className="text-[10px] text-gray-600">O QR code expira em 60 segundos. Se expirar, clique em Conectar novamente.</p>
        </div>
      )}

      {/* Connected info */}
      {isConnected && (
        <div className="px-4 py-3 flex items-center gap-2">
          <WifiOff size={12} className="text-gray-600" />
          <p className="text-xs text-gray-500">Instância: <span className="text-gray-300 font-semibold">{INSTANCE}</span></p>
        </div>
      )}
    </div>
  )
}
