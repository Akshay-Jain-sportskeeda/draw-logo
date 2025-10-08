import { useState, useCallback } from 'react';
import { fetchUserGameHistory, GameResult, getUserRank } from '../utils/firestore';
import { UserStats } from '../types/game';
import { getTodayDateString, getDateFromTimestamp } from '../utils/dateHelpers';

export function useLeaderboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserStats = useCallback(async (userId: string): Promise<UserStats | null> => {
    if (!userId) return null;

    setLoading(true);
    setError(null);

    try {
      const gameResults = await fetchUserGameHistory(userId);

      if (gameResults.length === 0) {
        return null;
      }

      const totalGames = gameResults.length;
      const totalHints = gameResults.reduce((sum, game) => sum + game.hintsUsed, 0);
      const totalTimeSpent = gameResults.reduce((sum, game) => sum + game.totalTime, 0);

      const drawMemoryGames = gameResults.filter(game => game.gameMode === 'draw-memory');
      const creativeRemixGames = gameResults.filter(game => game.gameMode === 'creative-remix');

      const freeDrawsSubmitted = creativeRemixGames.filter(game => game.hintsUsed === 0);
      const unassistedGamesCount = freeDrawsSubmitted.length;

      let bestUnassistedTime: number | null = null;
      let bestUnassistedTimeDate: string | undefined;
      if (freeDrawsSubmitted.length > 0) {
        const bestUnassisted = freeDrawsSubmitted.reduce((best, game) =>
          game.totalTime < best.totalTime ? game : best
        );
        bestUnassistedTime = bestUnassisted.totalTime;
        bestUnassistedTimeDate = bestUnassisted.puzzleDate;
      }

      const bestTimeGame = gameResults.reduce((best, game) =>
        game.totalTime < best.totalTime ? game : best
      );
      const bestTime = bestTimeGame.totalTime;
      const bestTimeDate = bestTimeGame.puzzleDate;

      const gamesWithAccuracy = gameResults.filter(game => game.score !== undefined && game.score !== null);
      const averageAccuracy = gamesWithAccuracy.length > 0
        ? gamesWithAccuracy.reduce((sum, game) => sum + (game.score || 0), 0) / gamesWithAccuracy.length
        : 0;

      const averageScore = totalGames > 0
        ? gameResults.reduce((sum, game) => sum + (game.score || 0), 0) / totalGames
        : 0;

      const averageTime = totalTimeSpent / totalGames;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const gamesThisWeek = gameResults.filter(game =>
        game.completedAt >= oneWeekAgo
      ).length;

      const calculateStreak = (games: typeof gameResults) => {
        if (games.length === 0) return 0;

        let streak = 0;
        const todayStr = getTodayDateString();
        let checkDateStr = todayStr;

        while (true) {
          const validEntryForThisDate = games.find(entry => {
            const completionDateStr = getDateFromTimestamp(entry.completedAt.getTime());
            const puzzleDateMatches = entry.puzzleDate === checkDateStr;
            const completionDateMatches = completionDateStr === checkDateStr;
            return puzzleDateMatches && completionDateMatches;
          });

          if (validEntryForThisDate) {
            streak++;
          } else {
            if (checkDateStr !== todayStr) {
              break;
            }
          }

          const currentDate = new Date(checkDateStr);
          currentDate.setDate(currentDate.getDate() - 1);
          checkDateStr = getDateFromTimestamp(currentDate.getTime());

          const daysDiff = Math.floor((Date.now() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 365) {
            break;
          }
        }

        return streak;
      };

      const currentStreakDrawMemory = calculateStreak(drawMemoryGames);
      const currentStreakCreativeRemix = calculateStreak(creativeRemixGames);

      const completedDates = gameResults.map(game => game.puzzleDate);
      const completedDrawMemoryDates = drawMemoryGames.map(game => game.puzzleDate).filter((date, index, self) => self.indexOf(date) === index);
      const completedCreativeRemixDates = creativeRemixGames.map(game => game.puzzleDate).filter((date, index, self) => self.indexOf(date) === index);
      const totalDrawMemoryGames = drawMemoryGames.length;
      const totalCreativeRemixGames = creativeRemixGames.length;

      const bestRank = 1;
      const bestRankDate = bestTimeDate;

      const userStats: UserStats = {
        totalGames,
        totalHints,
        totalTimeSpent,
        unassistedGamesCount,
        bestUnassistedTime,
        bestTime,
        bestRank,
        averageAccuracy,
        averageScore,
        averageTime,
        gamesThisWeek,
        currentStreakDrawMemory,
        currentStreakCreativeRemix,
        bestUnassistedTimeDate,
        bestTimeDate,
        bestRankDate,
        completedDates,
        completedDrawMemoryDates,
        completedCreativeRemixDates,
        totalDrawMemoryGames,
        totalCreativeRemixGames
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

  const getUserCompletedGameModes = useCallback(async (userId: string): Promise<{drawMemory: string[], creativeRemix: string[]}> => {
    try {
      const gameResults = await fetchUserGameHistory(userId);
      const drawMemoryGames = gameResults.filter(game => game.gameMode === 'draw-memory');
      const creativeRemixGames = gameResults.filter(game => game.gameMode === 'creative-remix');

      return {
        drawMemory: drawMemoryGames.map(game => game.puzzleDate).filter((date, index, self) => self.indexOf(date) === index),
        creativeRemix: creativeRemixGames.map(game => game.puzzleDate).filter((date, index, self) => self.indexOf(date) === index)
      };
    } catch (error) {
      console.error('Error fetching completed game modes:', error);
      return { drawMemory: [], creativeRemix: [] };
    }
  }, []);

  return {
    getUserStats,
    getUserCompletedDates,
    getUserCompletedGameModes,
    loading,
    error
  };
}