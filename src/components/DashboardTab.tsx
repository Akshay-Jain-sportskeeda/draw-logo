import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Target, Lightbulb, Calendar, TrendingUp, Award, LogIn, Archive } from 'lucide-react';
import { useLeaderboard } from '../lib/useLeaderboard';
import ArchiveScreen from './ArchiveScreen';
import { trackDashboardView, trackUserStatsView, trackPendingGamesClick, trackCTAClick } from '../utils/analytics';
import { UserStats } from '../types/game';

interface DashboardTabProps {
  isLoggedIn: boolean;
  userId?: string;
  onShowLogin: () => void;
  onPlayArchive?: (date: string) => void;
  availablePuzzles?: { date: string; name: string }[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  isLoggedIn,
  userId,
  onShowLogin,
  onPlayArchive,
  availablePuzzles = []
}) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showArchivePopup, setShowArchivePopup] = useState(false);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const { getUserStats } = useLeaderboard();

  // Track dashboard view for all users
  useEffect(() => {
    trackDashboardView(isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (isLoggedIn && userId && getUserStats) {
        setLoading(true);
        try {
          const stats = await getUserStats(userId);
          setUserStats(stats);
          if (stats) {
            trackUserStatsView(stats.totalGames, stats.currentStreak);
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserStats();
  }, [isLoggedIn, userId]); // Remove getUserStats from dependencies to prevent loops

  // Fetch completed dates for pending games calculation
  useEffect(() => {
    const fetchCompletedDates = async () => {
      if (isLoggedIn && userId && getUserStats) {
        try {
          // We'll get this from the getUserStats function
          const stats = await getUserStats(userId);
          if (stats && stats.completedDates) {
            setCompletedDates(stats.completedDates);
          }
        } catch (error) {
        }
      }
    };
    
    fetchCompletedDates();
  }, [isLoggedIn, userId]); // Remove getUserStats from dependencies to prevent loops

  // Calculate pending games
  const today = new Date().toISOString().split('T')[0];
  const todayInAvailable = availablePuzzles.some(puzzle => puzzle.date === today);
  const totalAvailableGames = todayInAvailable ? availablePuzzles.length : availablePuzzles.length + 1;
  const pendingGamesCount = totalAvailableGames - (completedDates.length || 0);

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Show login prompt for guest users
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Track your progress and achievements
              </p>
            </div>
          </div>

          {/* Login Prompt */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Sign in to view your dashboard
              </h3>
              <p className="text-gray-600 mb-6">
                Track your game statistics, view your best performances, and monitor your progress over time.
              </p>
              <button
                onClick={() => {
                  trackCTAClick('login', 'dashboard_guest_prompt', false);
                  onShowLogin();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Your game statistics and achievements
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading your statistics...</span>
            </div>
          ) : !userStats ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No statistics available</p>
              <p className="text-gray-500">Complete some puzzles to see your stats here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Stats */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{userStats.totalGames}</div>
                    <div className="text-sm text-gray-600">Games Played</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{userStats.totalMoves}</div>
                    <div className="text-sm text-gray-600">Total Moves</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{formatTime(userStats.totalTimeSpent)}</div>
                    <div className="text-sm text-gray-600">Time Spent</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <Lightbulb className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{userStats.currentStreak}</div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                </div>
              </div>

              {/* Pending Games CTA */}
              {pendingGamesCount > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Catch Up</h3>
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        console.log('🎯 [Dashboard] Pending games button clicked');
                        trackPendingGamesClick(pendingGamesCount, totalAvailableGames);
                        setShowArchivePopup(true);
                      }}
                      className="w-full max-w-xs p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg border-0"
                      style={{ border: 'none' }}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <Archive className="w-6 h-6" />
                        <div>
                          <div className="text-lg font-bold">Pending Games</div>
                          <div className="text-sm opacity-90">{pendingGamesCount}/{totalAvailableGames} games remaining</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Best Performances */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Best Performances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Best Rank</h4>
                        {userStats.bestRankDate && (
                          <div className="text-xs text-gray-500 font-normal mt-1">
                            {new Date(userStats.bestRankDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600 mb-1">#{userStats.bestRank}</div>
                    <div className="text-sm text-gray-600">Highest position achieved</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-gray-800">
                        Unassisted Games
                      </h4>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-1">{userStats.unassistedGamesCount}</div>
                    <div className="text-sm text-gray-600">Games solved with 0 hints</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Fastest Time</h4>
                        {userStats.bestTimeDate && (
                          <div className="text-xs text-gray-500 font-normal mt-1">
                            {new Date(userStats.bestTimeDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">{formatTime(userStats.bestTime)}</div>
                    <div className="text-sm text-gray-600">Personal best</div>
                  </div>
                </div>
              </div>

              {/* Averages */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Averages</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Average Moves</span>
                      </div>
                      <span className="text-xl font-bold text-gray-800">{userStats.averageMoves.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Average Hints</span>
                      </div>
                      <span className="text-xl font-bold text-gray-800">{userStats.averageHints.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Avg Play Time</span>
                      </div>
                      <span className="text-xl font-bold text-gray-800">{formatTime(userStats.averageTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">Games This Week</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800">{userStats.gamesThisWeek}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Archive Popup */}
        {showArchivePopup && (
          <ArchiveScreen
            onClose={() => setShowArchivePopup(false)}
            onSelectDate={(date) => {
              console.log('🎯 [Dashboard] Archive date selected:', date);
              if (onPlayArchive) {
                console.log('🎯 [Dashboard] Calling onPlayArchive with date:', date);
                onPlayArchive(date);
              }
              setShowArchivePopup(false);
            }}
            availablePuzzles={availablePuzzles}
            userId={userId}
          />
        )}
      </div>
  );
};

export default DashboardTab;