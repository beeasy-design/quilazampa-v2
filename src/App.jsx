import React, { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import AreaPage from './pages/AreaPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import { Home, Calendar, PawPrint, MessageCircle, User } from 'lucide-react'

function AppContent() {
  const { user, dogs, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [currentScreen, setCurrentScreen] = useState('home') // 'home' | 'area' | 'onboarding'
  const [selectedArea, setSelectedArea] = useState(null)

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FEF3C7, #FED7AA)' }}>
        <div className="text-6xl mb-4 animate-bounce">🐾</div>
        <div className="flex items-center gap-0.5">
          <span className="text-3xl font-black" style={{ color: '#F97316', fontFamily: 'Fredoka, sans-serif' }}>QU</span>
          <span className="text-3xl font-black" style={{ color: '#1E3A8A', fontFamily: 'Fredoka, sans-serif' }}>ilazampa</span>
          <span className="text-3xl font-black" style={{ color: '#F97316' }}>!</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">Caricamento...</p>
      </div>
    )
  }

  // Non autenticato
  if (!user) return <AuthPage />

  // Autenticato ma senza cani → onboarding
  if (dogs.length === 0 && currentScreen !== 'onboarding') {
    return (
      <div className="min-h-screen" style={{ maxWidth: '430px', margin: '0 auto' }}>
        <OnboardingPage />
      </div>
    )
  }

  // Onboarding manuale (da profilo, aggiungi cane)
  if (currentScreen === 'onboarding') {
    return (
      <div className="min-h-screen" style={{ maxWidth: '430px', margin: '0 auto' }}>
        <OnboardingPage />
      </div>
    )
  }

  const handleAreaSelect = (area) => {
    setSelectedArea(area)
    setCurrentScreen('area')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentScreen('home')
    setSelectedArea(null)
  }

  const renderScreen = () => {
    if (currentScreen === 'area' && selectedArea) {
      return <AreaPage area={selectedArea} onBack={() => setCurrentScreen('home')} />
    }
    switch (activeTab) {
      case 'home': return <HomePage onAreaSelect={handleAreaSelect} />
      case 'chat': return <ChatPage />
      case 'profile': return <ProfilePage onAddDog={() => setCurrentScreen('onboarding')} />
      default: return <HomePage onAreaSelect={handleAreaSelect} />
    }
  }

  const showBottomBar = currentScreen !== 'area'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #FEF3C7, #FED7AA)' }}>
      {/* Cornice telefono su desktop */}
      <div className="w-full" style={{ maxWidth: '430px' }}>
        <div className="relative bg-white shadow-2xl overflow-hidden"
          style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>

          {/* Status bar (solo su desktop con cornice) */}
          <div className="hidden sm:flex bg-white px-6 py-2 items-center justify-between text-xs font-semibold flex-shrink-0 border-b border-gray-50">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
                <path d="M1 8h2v3H1zM5 6h2v5H5zM9 4h2v7H9zM13 2h2v9h-2z"/>
              </svg>
              <div className="w-6 h-3 border border-gray-900 rounded-sm flex items-center px-0.5">
                <div className="w-4/5 h-full bg-gray-900 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* Contenuto schermata */}
          <div className="flex-1 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            {renderScreen()}
          </div>

          {/* Bottom navigation */}
          {showBottomBar && (
            <div className="bg-white border-t border-gray-200 flex justify-around items-center py-2 pb-safe flex-shrink-0">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'events', icon: Calendar, label: 'Eventi' },
                { id: 'adoptions', icon: PawPrint, label: 'Adozioni' },
                { id: 'chat', icon: MessageCircle, label: 'Chat' },
                { id: 'profile', icon: User, label: 'Profilo' },
              ].map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id && currentScreen === 'home'
                return (
                  <button key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className="flex flex-col items-center gap-0.5 px-3 py-1">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className={`text-[10px] ${isActive ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Home indicator iPhone */}
          <div className="bg-white pb-1 flex justify-center flex-shrink-0">
            <div className="w-32 h-1 bg-gray-900 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
