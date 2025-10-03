'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import GamesPageSidebar from '@/components/GamesPageSidebar'
import PFSNFooter from '@/components/PFSNFooter'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/useAuth';
import Auth from '@/components/Auth'; // Assuming Auth is your login modal component
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext'

const inter = Inter({ subsets: ['latin'] })

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'dashboard'>('game');
  const { showLoginModal, setShowLoginModal } = useAuthModal();

  return (
    <div className={inter.className}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <div className="fixed top-0 left-0 w-64 h-full">
            <GamesPageSidebar currentGame="NFL Logo Drawing Game" />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* TopBar for both mobile and desktop */}
          <TopBar
            user={user}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onShowLogin={() => setShowLoginModal(true)}
            onLogout={logout}
          />
          
          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <PFSNFooter currentPage="NFL" />
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <Auth
            onClose={() => setShowLoginModal(false)}
            onAuthSuccess={() => setShowLoginModal(false)}
          />
        )}
      </div>
      
      {/* Font Awesome for footer icons */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
      />
    </div>
  )
}
function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthModalProvider>
      <RootLayoutContent>
        {children}
      </RootLayoutContent>
    </AuthModalProvider>
  )
}

export default RootLayoutClient