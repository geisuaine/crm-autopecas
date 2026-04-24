import { Star, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'

function timeSince(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 60000)
  if (d < 1)  return 'agora'
  if (d < 60) return `${d}min`
  const h = Math.floor(d / 60), r = d % 60
  return r ? `${h}h${r}m` : `${h}h`
}

export default function PieceCard({ card, column, onClick }) {
  const { toggleFavorite } = useApp()

  const age    = Math.floor((Date.now() - new Date(card.createdAt)) / 60000)
  const urgent = card.priority === 'urgent' || age > 60

  const mainPiece  = card.pieces[0] ?? null
  const extraCount = card.pieces.length > 1 ? card.pieces.length - 1 : 0

  const totalOffers = card.pieces.reduce((acc, p) => acc + (p.collabResponses?.length || 0), 0)

  const pieceName = mainPiece?.name || card.client.name || '—'
  const vehicleStr = card.vehicle
    ? `${card.vehicle.brand} ${card.vehicle.model}`.trim().toUpperCase()
    : null
  const motorStr = card.vehicle?.year && (card.vehicle?.motor || card.vehicle?.year)
    ? [card.vehicle.year, card.vehicle?.motor].filter(Boolean).join(' | ')
    : null

  const clientType = card.client?.type || null

  const hasPrice = mainPiece?.price?.value || mainPiece?.price?.cash || mainPiece?.price?.pix

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-3xl cursor-pointer select-none fade-in"
      style={{
        border: urgent ? '2.5px solid #ef4444' : '2px solid #e8f5e9',
        boxShadow: urgent
          ? '0 4px 20px rgba(239,68,68,0.18), 0 2px 8px rgba(0,0,0,0.12)'
          : '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.08)',
        transition: 'transform 0.12s, box-shadow 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = urgent ? '0 4px 20px rgba(239,68,68,0.18)' : '0 4px 16px rgba(0,0,0,0.10)' }}
    >
      {/* Star favorite button */}
      <button
        onClick={e => { e.stopPropagation(); toggleFavorite(card.id) }}
        className="absolute top-2.5 right-2.5 z-10 w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
        style={{ background: card.starred ? '#fef3c7' : 'rgba(0,0,0,0.06)' }}
      >
        <Star size={12} fill={card.starred ? '#f59e0b' : 'none'} stroke={card.starred ? '#f59e0b' : '#9ca3af'} />
      </button>

      {/* Client type */}
      <div className="px-4 pt-3 pb-0.5">
        <span className="text-[12px] font-black uppercase tracking-widest text-blue-600">
          {clientType || 'CLIENTE'}
        </span>
      </div>

      {/* Piece name — BIG */}
      <div className="px-4 pb-1">
        <p className="font-black text-gray-900 uppercase leading-tight"
          style={{ fontSize: 18, letterSpacing: '-0.3px', lineHeight: 1.18 }}>
          {pieceName.length > 28 ? pieceName.slice(0, 26) + '…' : pieceName}
        </p>
        {extraCount > 0 && (
          <p className="text-[12px] font-black text-blue-500 mt-0.5">+{extraCount} peça{extraCount > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Vehicle */}
      <div className="px-4 pb-3">
        {vehicleStr ? (
          <>
            <p className="text-[13px] font-black text-gray-700 uppercase tracking-tight truncate">
              {vehicleStr.length > 22 ? vehicleStr.slice(0, 20) + '…' : vehicleStr}
            </p>
            {motorStr && (
              <p className="text-[15px] font-black text-blue-600 mt-0.5">{motorStr}</p>
            )}
          </>
        ) : (
          <p className="text-[12px] text-gray-400 italic">Veículo não informado</p>
        )}
      </div>

      {/* Price badge */}
      {hasPrice && (
        <div className="px-4 pb-1">
          <span className="inline-block px-3 py-0.5 rounded-full text-[12px] font-black text-white bg-blue-600">
            R$ {parseFloat(mainPiece.price.value || mainPiece.price.pix || mainPiece.price.cash).toFixed(2)}
          </span>
        </div>
      )}

      {/* Offers badge + time */}
      <div className="px-4 pb-3 flex items-center justify-between">
        {totalOffers > 0 ? (
          <span className="inline-block px-4 py-1.5 rounded-full text-[13px] font-black text-white"
            style={{ background: '#16a34a' }}>
            {totalOffers} oferta{totalOffers > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="inline-block px-4 py-1.5 rounded-full text-[13px] font-black text-gray-500"
            style={{ background: '#f1f5f9' }}>
            Sem ofertas
          </span>
        )}
        <span className="text-[11px] font-bold text-gray-400 ml-2">{timeSince(card.createdAt)}</span>
      </div>

      {/* Urgent strip */}
      {urgent && (
        <div className="rounded-b-3xl bg-red-50 px-4 py-1.5 border-t border-red-100">
          <p className="text-[11px] font-black text-red-500 uppercase tracking-wider">⚡ Urgente</p>
        </div>
      )}

      {/* Chevron indicator */}
      <div className="absolute bottom-3 right-3 opacity-25">
        <ChevronDown size={14} className="text-gray-500" />
      </div>
    </div>
  )
}
