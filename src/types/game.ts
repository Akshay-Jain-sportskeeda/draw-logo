export interface GameResult {
  id: string;
  userId: string;
  displayName: string;
  moves: number;
  hintsUsed: number;
  totalTime: number;
  completedAt: Date;
  puzzleDate: string;
  challengeName: string;
  score: number;
  gameMode: string;
}

export interface UserStats {
  totalGames: number;
  totalHints: number;
  totalTimeSpent: number;
  unassistedGamesCount: number;
  bestUnassistedTime: number | null;
  bestTime: number;
  bestRank: number;
  averageAccuracy: number;
  averageScore: number;
  averageTime: number;
  gamesThisWeek: number;
  currentStreakDrawMemory: number;
  currentStreakCreativeRemix: number;
  bestUnassistedTimeDate?: string;
  bestTimeDate: string;
  bestRankDate: string;
  completedDates: string[];
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  moves: number;
  hintsUsed: number;
  totalTime: number;
  completedAt: Date;
  puzzleDate: string;
  score?: number;
  accuracyScore?: number;
  timeScore?: number;
}

export interface WinStats {
  moves: number;
  hints: number;
  displayTime: string;
  calculation: string;
}