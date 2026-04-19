import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import LandingPage from './components/LandingPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import KanbanBoard from './components/KanbanBoard'
import CardModal from './components/CardModal'
import CollaboratorsView from './components/CollaboratorsView'
import FreightView from './components/FreightView'
import ReportsView from './components/ReportsView'
import FloatingBackground from './components/FloatingBackground'
import ProspectingPanel from './components/ProspectingPanel'
import SalesView from './components/SalesView'
import RepasseView from './components/RepasseView'
import NewOrderModal from './components/NewOrderModal'
import SettingsView from './components/SettingsView'
import DisparosView from './components/DisparosView'
import { LayoutDashboard, Users, Truck, BarChart3, Settings } from 'lucide-react'

const MOBILE_NAV = [
  { id: 'kanban',        label: 'Painel',     icon: LayoutDashboard },
  { id: 'collaborators', label: 'Colabs',     icon: Users           },
  { id: 'freight',       label: 'Frete',      icon: Truck           },
  { id: 'reports',       label: 'Relatórios', icon: BarChart3       },
  { id: 'settings',      label: 'Config',     icon: Settings        },
]

function AppContent() {
  const { view, setView, selectedCard, setSelectedCard, cards } = useApp()
  const [prospectOpen,  setProspectOpen]  = useState(false)
  const [newOrderOpen,  setNewOrderOpen]  = useState(false)

  // Always use the live version of the card so CardModal reflects real-time updates
  const liveCard = selectedCard ? (cards.find(c => c.id === selectedCard.id) ?? selectedCard) : null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060d1f' }}>
      <FloatingBackground />

      <Sidebar onProspect={() => setProspectOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <Header onProspect={() => setProspectOpen(true)} onNewOrder={() => setNewOrderOpen(true)} />

        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {view === 'kanban'        && <KanbanBoard />}
          {view === 'collaborators' && <CollaboratorsView />}
          {view === 'freight'       && <FreightView />}
          {view === 'reports'       && <ReportsView />}
          {view === 'settings'      && <SettingsView />}
          {view === 'sales'         && <SalesView />}
          {view === 'repasse'       && <RepasseView />}
          {view === 'disparos'      && <DisparosView />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 flex items-stretch z-40 border-t"
        style={{ background: '#0a1628', borderColor: '#1e3a5f', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${view === id ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <Icon size={19} />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>

      <ProspectingPanel open={prospectOpen} onClose={() => setProspectOpen(false)} />
      {newOrderOpen && <NewOrderModal onClose={() => setNewOrderOpen(false)} />}

      {liveCard && (
        <CardModal card={liveCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  )
}

export default function App() {
  const [noSistema, setNoSistema] = useState(false)

  if (!noSistema) {
    return <LandingPage onEntrar={() => setNoSistema(true)} />
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
