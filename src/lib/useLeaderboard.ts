import { useState, useCallback } from 'react';
import { fetchUserGameHistory, GameResult, getUserRank } from '../utils/firestore';
import { UserStats } from '../types/game';

export function useLeaderboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserStats = useCallback(async (userId: string): Promise<UserStats | null> => {
    if (!userId) return null;

    setLoading(true);
    setError(null);

    try {
      // Fetch all game results for the user
      const gameResults = await fetchUserGameHistory(userId);
      
      if (gameResults.length === 0) {
        return null;
      }

      // Calculate basic stats
      const totalGames = gameResults.length;
      const totalMoves = gameResults.reduce((sum, game) => sum + game.moves, 0);
      const totalHints = gameResults.reduce((sum, game) => sum + game.hintsUsed, 0);
      const totalTimeSpent = gameResults.reduce((sum, game) => sum + game.totalTime, 0);

      // Calculate unassisted games (0 hints)
      const unassistedGames = gameResults.filter(game => game.hintsUsed === 0);
      const unassistedGamesCount = unassistedGames.length;
      
      // Find best unassisted time
      let bestUnassistedTime: number | null = null;
      let bestUnassistedTimeDate: string | undefined;
      if (unassistedGames.length > 0) {
        const bestUnassisted = unassistedGames.reduce((best, game) => 
          game.totalTime < best.totalTime ? game : best
        );
        bestUnassistedTime = bestUnassisted.totalTime;
        bestUnassistedTimeDate = bestUnassisted.puzzleDate;
      }

      // Find best overall time
      const bestTimeGame = gameResults.reduce((best, game) => 
        game.totalTime < best.totalTime ? game : best
      );
      const bestTime = bestTimeGame.totalTime;
      const bestTimeDate = bestTimeGame.puzzleDate;

      // Calculate averages
      const averageMoves = totalMoves / totalGames;
      const averageHints = totalHints / totalGames;
      const averageTime = totalTimeSpent / totalGames;

      // Calculate games this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const gamesThisWeek = gameResults.filter(game => 
        game.completedAt >= oneWeekAgo
      ).length;

      // Calculate current streak (consecutive days with games)
      const sortedByDate = gameResults
        .sort((a, b) => new Date(b.puzzleDate).getTime() - new Date(a.puzzleDate).getTime());
      
      // Calculate current streak (consecutive days from today backwards)
      let currentStreak = 0;
      // Get today's date in YYYY-MM-DD format
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      // Start from today and go backwards
      let checkDateStr = todayStr;
      while (true) {
        // Find entry where puzzle date matches check date AND completion date matches puzzle date
        const validEntryForThisDate = gameResults.find(entry => {
          const completionDateStr = entry.completedAt.toLocaleDateString('en-CA');
          const puzzleDateMatches = entry.puzzleDate === checkDateStr;
          const completionDateMatches = completionDateStr === checkDateStr;
          return puzzleDateMatches && completionDateMatches;
        });
        
        if (validEntryForThisDate) {
          currentStreak++;
        } else {
          // If this is today and no valid entry exists, that's normal (they might not have played yet)
          if (checkDateStr === todayStr) {
            // Don't increment streak for today if no valid entry exists yet, but don't break it either
          } else {
            break;
          }
        }
        
        // Move to previous day
        const currentDate = new Date(checkDateStr);
        currentDate.setDate(currentDate.getDate() - 1);
        checkDateStr = currentDate.toLocaleDateString('en-CA');
        
        // Safety check: don't go back more than 365 days
        const daysDiff = Math.floor((Date.now() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
          break;
        }
      }

      // Get completed dates for pending games calculation
      const completedDates = gameResults.map(game => game.puzzleDate);

      // For best rank, we would need to calculate rank for each game
      // For now, we'll set it to 1 as a placeholder since calculating historical ranks
      // would require fetching all players' data for each puzzle date
      const bestRank = 1;
      const bestRankDate = bestTimeDate;

      const userStats: UserStats = {
        totalGames,
        totalMoves,
        totalHints,
        totalTimeSpent,
        unassistedGamesCount,
        bestUnassistedTime,
        bestTime,
        bestRank,
        averageMoves,
        averageHints,
        averageTime,
        gamesThisWeek,
        currentStreak,
        bestUnassistedTimeDate,
        bestTimeDate,
        bestRankDate,
        completedDates
      };

      return userStats;
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load user statistics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserCompletedDates = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const gameResults = await fetchUserGameHistory(userId);
      return gameResults.map(game => game.puzzleDate);
    } catch (error) {
      console.error('Error fetching completed dates:', error);
      return [];
    }
  }, []);

  return {
    getUserStats,
    getUserCompletedDates,
    loading,
    error
  };
}