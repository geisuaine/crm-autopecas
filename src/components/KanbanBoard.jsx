import { useState } from 'react'
import { X, Star, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import KanbanColumn from './KanbanColumn'
import PieceCard from './PieceCard'

function FullscreenColumn({ col, cards, onClose, onCardClick }) {
  const [search, setSearch] = useState('')

  const sorted = [...cards]
    .sort((a, b) => {
      if (a.starred && !b.starred) return -1
      if (!a.starred && b.starred) return 1
      return 0
    })
    .filter(c => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const piece = c.pieces?.[0]?.name?.toLowerCase() || ''
      const name  = c.client?.name?.toLowerCase() || ''
      const veh   = `${c.vehicle?.brand || ''} ${c.vehicle?.model || ''}`.toLowerCase()
      return piece.includes(q) || name.includes(q) || veh.includes(q)
    })

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'linear-gradient(145deg,#0d47a1 0%,#1565c0 40%,#1976d2 100%)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{
          background: col.accent,
          boxShadow: `0 4px 32px ${col.accent}88`,
        }}
      >
        <span className="text-3xl">{col.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-xl leading-none uppercase tracking-tight">
            {col.label}
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {sorted.length} pedido{sorted.length !== 1 ? 's' : ''}
            {cards.some(c => c.starred) && (
              <span className="ml-2">
                · <Star size={10} className="inline mb-0.5" fill="currentColor" />
                {cards.filter(c => c.starred).length} favorito{cards.filter(c => c.starred).length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-5 py-3 shrink-0" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pedido, peça, veículo..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
            }}
          />
        </div>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 py-20">
            <p className="text-6xl mb-4">{col.emoji}</p>
            <p className="text-white font-bold text-lg">
              {search ? 'Nenhum resultado' : `Nenhum pedido em ${col.label}`}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}
          >
            {sorted.map(card => (
              <PieceCard
                key={card.id}
                card={card}
                column={col}
                onClick={() => onCardClick(card)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const { columns, cards, setSelectedCard, geisaMode } = useApp()
  const [fullscreenCol, setFullscreenCol] = useState(null)

  const fullCol   = fullscreenCol ? columns.find(c => c.id === fullscreenCol) : null
  const fullCards = fullscreenCol ? cards.filter(c => c.column === fullscreenCol) : []

  function openCard(card) {
    setSelectedCard(card)
    setFullscreenCol(null)
  }

  return (
    <>
      <div className="h-full kanban-scroll">
        <div
          className="flex gap-5 p-5 h-full items-start"
          style={{ minWidth: `${columns.length * 310}px` }}
        >
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={cards.filter(c => c.column === col.id)}
              isLocked={col.id === 'geisa' && !geisaMode}
              onHeaderClick={() => setFullscreenCol(col.id)}
            />
          ))}
        </div>
      </div>

      {fullCol && (
        <FullscreenColumn
          col={fullCol}
          cards={fullCards}
          onClose={() => setFullscreenCol(null)}
          onCardClick={openCard}
        />
      )}
    </>
  )
}
