import { useState } from 'react'
import { Lock, ChevronDown, ChevronRight, Maximize2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PieceCard from './PieceCard'

export default function KanbanColumn({ column, cards, isLocked, onHeaderClick }) {
  const { setSelectedCard } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  const sorted = [...cards].sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return 0
  })

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl mb-3 shrink-0 select-none"
        style={{ backgroundColor: column.color, boxShadow: `0 0 16px ${column.accent}33` }}
      >
        {/* Label — clique abre tela cheia */}
        <button
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={() => onHeaderClick?.()}
        >
          <span className="text-base leading-none">{column.emoji}</span>
          <span className="font-bold text-[13px] truncate" style={{ color: column.textColor }}>
            {column.label}
          </span>
          <Maximize2 size={11} style={{ color: column.accent, opacity: 0.7, flexShrink: 0 }} />
        </button>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {/* Contagem / lock */}
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: column.accent }}
          >
            {isLocked ? <Lock size={11} /> : cards.length}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed
              ? <ChevronRight size={13} style={{ color: column.accent }} />
              : <ChevronDown  size={13} style={{ color: column.accent }} />
            }
          </button>
        </div>
      </div>

      {/* Cards list */}
      {!collapsed && (
        <div className="flex flex-col gap-3 overflow-y-auto pb-2" style={{ maxHeight: 'calc(100vh - 170px)' }}>
          {isLocked ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl"
              style={{ background: 'rgba(190,24,93,0.08)', border: '1px solid rgba(190,24,93,0.2)' }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'rgba(190,24,93,0.15)' }}>
                <Lock className="text-pink-400" size={22} />
              </div>
              <p className="text-sm font-semibold text-pink-400">Acesso Restrito</p>
              <p className="text-xs text-pink-600 mt-1">Somente Geisa</p>
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="flex items-center justify-center py-10 rounded-2xl cursor-pointer"
              style={{ border: '2px dashed rgba(255,255,255,0.1)' }}
              onClick={() => onHeaderClick?.()}
            >
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Nenhum pedido
              </p>
            </div>
          ) : (
            sorted.map(card => (
              <PieceCard
                key={card.id}
                card={card}
                column={column}
                onClick={() => setSelectedCard(card)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
