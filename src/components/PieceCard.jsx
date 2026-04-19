import { Clock, Users, AlertCircle, CheckCircle, Phone, MapPin } from 'lucide-react'

function timeSince(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 60000)
  if (d < 1)  return 'agora'
  if (d < 60) return `${d}min`
  const h = Math.floor(d / 60), r = d % 60
  return r ? `${h}h${r}min` : `${h}h`
}

function pieceStatusSummary(pieces) {
  if (!pieces.length) return { label: 'Sem ofertas', color: '#94a3b8' }
  const found = pieces.filter(p => p.status === 'found' || p.status === 'delivered').length
  const total = pieces.length
  if (found === total) return { label: `${found} oferta${found > 1 ? 's' : ''}`, color: '#16a34a' }
  if (found > 0)       return { label: `${found}/${total} encontrada${found > 1 ? 's' : ''}`, color: '#ca8a04' }
  const nf = pieces.filter(p => p.status === 'not-found').length
  if (nf === total)    return { label: 'Sem ofertas', color: '#dc2626' }
  return { label: 'Buscando...', color: '#ca8a04' }
}

export default function PieceCard({ card, column, onClick }) {
  const age    = Math.floor((Date.now() - new Date(card.createdAt)) / 60000)
  const isOver = age > 60
  const urgent = card.priority === 'urgent'
  const summary = pieceStatusSummary(card.pieces)

  const mainPiece  = card.pieces[0] ?? null
  const extraCount = card.pieces.length > 1 ? card.pieces.length - 1 : 0

  const hasPrice   = mainPiece?.price
  const allFound   = card.pieces.length > 0 && card.pieces.every(p => p.status === 'found' || p.status === 'delivered')

  return (
    <div
      onClick={onClick}
      className="rounded-xl cursor-pointer select-none fade-in transition-all duration-150 hover:scale-[1.015]"
      style={{
        background: '#ffffff',
        border: urgent || isOver
          ? '2px solid #ef4444'
          : '1.5px solid #e2e8f0',
        boxShadow: '0 3px 16px rgba(0,0,0,0.28)',
        overflow: 'hidden',
      }}
    >
      {/* Type label row — like "OFICINA" in Grupão */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: column.accent }}>
            {column.emoji} {column.label}
          </span>
          {card.client.type && (
            <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: column.accent + '20', color: column.accent }}>
              {card.client.type}
            </span>
          )}
          {card.client.isReturning && (
            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">⭐ VIP</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] shrink-0" style={{ color: isOver ? '#ef4444' : '#94a3b8' }}>
          <Clock size={9} />
          <span className={isOver || urgent ? 'font-bold' : ''}>{timeSince(card.createdAt)}</span>
          {urgent && <AlertCircle size={9} className="text-red-500 ml-0.5" />}
        </div>
      </div>

      {/* Piece name — big bold like Grupão */}
      <div className="px-3 pb-1">
        <p className="font-black text-gray-900 leading-tight uppercase" style={{ fontSize: 17, letterSpacing: '-0.3px' }}>
          {mainPiece ? mainPiece.name : card.client.name}
        </p>
        {extraCount > 0 && (
          <p className="text-[12px] font-bold mt-0.5" style={{ color: column.accent }}>
            + {extraCount} peça{extraCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Vehicle block — like "GM ZAFIRA ELITE / 2006 | 2.0" */}
      <div className="px-3 pb-2">
        {card.vehicle ? (
          <>
            <p className="text-[13px] font-black text-gray-700 uppercase tracking-tight">
              {card.vehicle.brand} {card.vehicle.model}
            </p>
            <p className="text-[13px] font-bold" style={{ color: column.accent }}>
              {card.vehicle.year}
            </p>
          </>
        ) : (
          <p className="text-[12px] text-gray-400 italic">Veículo não informado</p>
        )}
        <p className="text-[12px] text-gray-600 mt-0.5 flex items-center gap-1 font-semibold">
          <Phone size={9} className="text-green-500" />
          {card.client.phone ? card.client.phone : card.client.name}
        </p>
        {card.client.address && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 leading-tight">
            <MapPin size={9} className="text-gray-400 shrink-0" />
            {card.client.address}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #f1f5f9' }} />

      {/* Bottom row — offers + colabs */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          {allFound && <CheckCircle size={12} className="text-green-500" />}
          <span className="text-[12px] font-semibold" style={{ color: summary.color }}>
            {summary.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasPrice && (
            <span className="text-[11px] font-black text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              R${mainPiece.price.cash}
            </span>
          )}
          {card.collaboratorsSent > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
              <Users size={9} /> {card.collaboratorsSent}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
