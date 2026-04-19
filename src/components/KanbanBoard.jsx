import { useApp } from '../context/AppContext'
import KanbanColumn from './KanbanColumn'

export default function KanbanBoard() {
  const { columns, cards, geisaMode } = useApp()

  return (
    <div className="h-full kanban-scroll">
      <div className="flex gap-5 p-5 h-full items-start" style={{ minWidth: `${columns.length * 310}px` }}>
        {columns.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={cards.filter(c => c.column === col.id)}
            isLocked={col.id === 'geisa' && !geisaMode}
          />
        ))}
      </div>
    </div>
  )
}
