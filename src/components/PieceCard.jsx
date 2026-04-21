import { Clock, Users, AlertCircle, CheckCircle, Phone, Car } from 'lucide-react'

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
  if (found === total) return { label: `${found} encontrada${found > 1 ? 's' : ''}`, color: '#16a34a' }
  if (found > 0)       return { label: `${found}/${total} encontrada${found > 1 ? 's' : ''}`, color: '#d97706' }
  const nf = pieces.filter(p => p.status === 'not-found').length
  if (nf === total)    return { label: 'Sem ofertas', color: '#dc2626' }
  return { label: 'Buscando...', color: '#d97706' }
}

export default function PieceCard({ card, column, onClick }) {
  const age    = Math.floor((Date.now() - new Date(card.createdAt)) / 60000)
  const isOver = age > 60
  const urgent = card.priority === 'urgent'
  const summary = pieceStatusSummary(card.pieces)

  const mainPiece  = card.pieces[0] ?? null
  const extraCount = card.pieces.length > 1 ? card.pieces.length - 1 : 0

  const hasPrice = mainPiece?.price
  const allFound = card.pieces.length > 0 && card.pieces.every(p => p.status === 'found' || p.status === 'delivered')
  const isCheckingCollabs = card.pieces.some(p => p.status === 'not-found') && card.column === 'em-busca'
  const hasCollabAssigned = card.pieces.some(p => p.collaboratorId)
  const totalOffers = card.pieces.reduce((acc, p) => acc + (p.collabResponses?.length || 0), 0)

  return (
    <div
      onClick={onClick}
      className="rounded-2xl cursor-pointer select-none fade-in transition-all duration-150 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
      style={{
        background: '#ffffff',
        border: urgent || isOver ? '2.5px solid #ef4444' : '1.5px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}
    >
      {/* Colored header band — vivid like Grupão */}
      <div
        className="px-3 pt-2.5 pb-2 flex items-center justify-between"
        style={{ background: column.accent }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{column.emoji}</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-white opacity-90">
            {column.label}
          </span>
          {card.client.type && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white">
              {card.client.type}
            </span>
          )}
          {card.client.isReturning && (
            <span className="text-[9px] font-bold text-yellow-200">⭐ VIP</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/70 shrink-0">
          <Clock size={9} />
          <span className={isOver || urgent ? 'font-bold text-yellow-200' : ''}>{timeSince(card.createdAt)}</span>
          {(isOver || urgent) && <AlertCircle size={9} className="text-yellow-300 ml-0.5" />}
        </div>
      </div>

      {/* Piece name — BIG bold like Grupão marketplace */}
      <div className="px-3 pt-2.5 pb-1">
        <p className="font-black text-gray-900 leading-tight uppercase" style={{ fontSize: 16, letterSpacing: '-0.2px' }}>
          {mainPiece ? mainPiece.name : card.client.name}
        </p>
        {extraCount > 0 && (
          <p className="text-[12px] font-bold mt-0.5" style={{ color: column.accent }}>
            + {extraCount} peça{extraCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Vehicle info */}
      <div className="px-3 pb-2.5">
        {card.vehicle ? (
          <div className="flex items-center gap-1.5">
            <Car size={11} className="text-gray-400 shrink-0" />
            <p className="text-[13px] font-bold text-gray-600 uppercase tracking-tight">
              {card.vehicle.brand} {card.vehicle.model}
              {card.vehicle.year && <span className="font-black ml-1" style={{ color: column.accent }}>{card.vehicle.year}</span>}
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-gray-400 italic">Veículo não informado</p>
        )}
        <p className="text-[12px] text-gray-500 mt-0.5 flex items-center gap-1 font-semibold">
          <Phone size={9} className="text-green-500 shrink-0" />
          {card.client.phone ? card.client.phone : card.client.name}
        </p>
      </div>

      {/* Ofertas de colaboradores */}
      {totalOffers > 0 && (
        <div className="px-3 py-2" style={{ background: '#f0fdf4', borderTop: '1.5px solid #bbf7d0' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-green-600 shrink-0" />
              <span className="text-[11px] font-black text-green-700">Ofertas recebidas:</span>
            </div>
            <span className="text-[13px] font-black text-green-700">{totalOffers}</span>
          </div>
          {card.pieces.filter(p => p.collabResponses?.length).map(p => (
            p.collabResponses.slice(-1).map(r => (
              <div key={r.collabId + r.respondedAt} className="mt-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-600 truncate max-w-[60%]">{r.collabStore || r.collabName}</span>
                <span className="text-[11px] font-black text-green-600">R$ {parseFloat(r.cost).toFixed(2)}</span>
              </div>
            ))
          ))}
        </div>
      )}

      {/* Verificando colaboradores strip */}
      {isCheckingCollabs && totalOffers === 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ background: '#fff7ed', borderTop: '1px solid #fed7aa' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
          <p className="text-[11px] font-bold text-orange-600">Verificando com colaboradores...</p>
        </div>
      )}
      {hasCollabAssigned && !isCheckingCollabs && totalOffers === 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
          <Users size={10} className="text-green-600 shrink-0" />
          <p className="text-[11px] font-bold text-green-600">Colaborador localizado</p>
        </div>
      )}

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: column.accent + '12', borderTop: `1.5px solid ${column.accent}22` }}
      >
        <div className="flex items-center gap-1.5">
          {allFound && <CheckCircle size={12} className="text-green-500" />}
          <span className="text-[12px] font-bold" style={{ color: summary.color }}>
            {summary.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasPrice && (mainPiece.price.value || mainPiece.price.cash) && (
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: column.accent }}>
              R${parseFloat(mainPiece.price.value || mainPiece.price.cash).toFixed(2)}
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
