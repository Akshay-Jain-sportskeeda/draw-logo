import React, { useEffect, useState } from 'react';
import { Trophy, Clock, Target, Lightbulb, Calendar, TrendingUp } from 'lucide-react';
import { User } from 'firebase/auth';
import { fetchUserGameHistory, GameResult } from '../utils/firestore';

interface UserDashboardProps {
  user: User | null;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const history = await fetchUserGameHistory(user.uid);
        setGameHistory(history);
      } catch (err) {
        console.error('Error loading user history:', err);
        setError('Failed to load your game history');
      } finally {
        setLoading(false);
      }
    };

    loadUserHistory();
  }, [user]);

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate aggregate statistics
  const totalGames = gameHistory.length;
  const averageTime = totalGames > 0 
    ? gameHistory.reduce((sum, game) => sum + game.totalTime, 0) / totalGames 
    : 0;
  const bestScore = totalGames > 0 
    ? Math.max(...gameHistory.map(game => game.score))
    : 0;
  const averageMoves = totalGames > 0
    ? gameHistory.reduce((sum, game) => sum + game.moves, 0) / totalGames
    : 0;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Sign in to view your dashboard
              </h3>
              <p className="text-gray-600">
                Track your progress and see your game history.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 md:px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                Your Dashboard
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Track your progress and game history
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading your dashboard...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Games Played</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{totalGames}</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Avg Time</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {totalGames > 0 ? formatTime(averageTime) : '--'}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Best Score</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalGames > 0 ? Math.abs(bestScore) : '--'}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Avg Moves</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalGames > 0 ? Math.round(averageMoves) : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Game History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Game History</h3>
              
              {gameHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No games played yet!</p>
                  <p className="text-gray-500">Complete a puzzle to see your history here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameHistory.map((game, index) => (
                    <div
                      key={game.id || index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Calendar className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {formatDate(game.completedAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Puzzle: {game.puzzleDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Target className="w-3 h-3" />
                            <span className="font-medium">{game.moves}</span>
                          </div>
                          <div className="text-xs text-gray-500">moves</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-orange-600">
                            <Lightbulb className="w-3 h-3" />
                            <span className="font-medium">{game.hintsUsed}</span>
                          </div>
                          <div className="text-xs text-gray-500">hints</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{formatTime(game.totalTime)}</span>
                          </div>
                          <div className="text-xs text-gray-500">time</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};