import { Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PieceCard from './PieceCard'

export default function KanbanColumn({ column, cards, isLocked }) {
  const { setSelectedCard } = useApp()

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl mb-3 shrink-0"
        style={{
          backgroundColor: column.color,
          boxShadow: `0 0 16px ${column.accent}33`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{column.emoji}</span>
          <span className="font-bold text-[13px]" style={{ color: column.textColor }}>{column.label}</span>
        </div>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: column.accent }}
        >
          {isLocked ? <Lock size={11} /> : cards.length}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex flex-col gap-3 overflow-y-auto pb-2" style={{ maxHeight: 'calc(100vh - 170px)' }}>
        {isLocked ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl"
            style={{ background: 'rgba(190,24,93,0.08)', border: '1px solid rgba(190,24,93,0.2)' }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(190,24,93,0.15)' }}>
              <Lock className="text-pink-400" size={22} />
            </div>
            <p className="text-sm font-semibold text-pink-400">Acesso Restrito</p>
            <p className="text-xs text-pink-600 mt-1">Somente Geisa</p>
          </div>
        ) : cards.length === 0 ? (
          <div
            className="flex items-center justify-center py-10 rounded-2xl"
            style={{ border: '2px dashed rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>Nenhum pedido</p>
          </div>
        ) : (
          cards.map(card => (
            <PieceCard key={card.id} card={card} column={column} onClick={() => setSelectedCard(card)} />
          ))
        )}
      </div>
    </div>
  )
}
