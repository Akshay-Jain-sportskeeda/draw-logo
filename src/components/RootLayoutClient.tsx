'use client'

import { useState } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import GamesPageSidebar from '@/components/GamesPageSidebar'
import PFSNFooter from '@/components/PFSNFooter'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/useAuth';
import Auth from '@/components/Auth'; // Assuming Auth is your login modal component
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext'
import { LeaderboardTab } from '@/components/LeaderboardTab'
import { fetchLeaderboardEntries, getUserRank } from '@/utils/firestore'
import { LeaderboardEntry } from '@/types/game'

const inter = Inter({ subsets: ['latin'] })

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'dashboard'>('game');
  const { showLoginModal, setShowLoginModal } = useAuthModal();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [currentPuzzleDate, setCurrentPuzzleDate] = useState<string>(new Date().toLocaleDateString('en-CA'));

  const fetchLeaderboard = async (date: string) => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const entries = await fetchLeaderboardEntries(date);
      setLeaderboardData(entries);
      setCurrentPuzzleDate(date);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardError('Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const getUserRankInfo = async (userId: string, puzzleDate: string) => {
    try {
      return await getUserRank(userId, puzzleDate);
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  };

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
            {activeTab === 'game' && children}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                currentLeaderboard={leaderboardData}
                currentPuzzleDate={currentPuzzleDate}
                loading={leaderboardLoading}
                error={leaderboardError}
                userId={user?.uid}
                isLoggedIn={!!user}
                onShowLogin={() => setShowLoginModal(true)}
                onFetchLeaderboard={fetchLeaderboard}
                onGetUserRank={getUserRankInfo}
              />
            )}
            {activeTab === 'dashboard' && (
              <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
                  <p className="text-gray-600">Dashboard functionality coming soon!</p>
                </div>
              </div>
            )}
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