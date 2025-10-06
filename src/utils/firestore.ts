import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { GameResult, LeaderboardEntry } from '@/types/game';

export async function fetchUserGameHistory(userId: string): Promise<GameResult[]> {
  try {
    const scoresRef = collection(firestore, 'nfl-draw-logo');
    const q = query(
      scoresRef,
      where('userId', '==', userId),
      where('gameMode', '==', 'draw-memory'),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const gameResults: GameResult[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      gameResults.push({
        id: doc.id,
        userId: data.userId,
        displayName: data.userName || 'Anonymous',
        moves: data.moves || 0,
        hintsUsed: data.hintsUsed || 0,
        totalTime: data.timeTaken ? data.timeTaken * 1000 : 0, // Convert seconds to milliseconds
        completedAt: new Date(data.timestamp),
        puzzleDate: data.puzzleDate || new Date(data.timestamp).toLocaleDateString('en-CA'),
        challengeName: data.challengeName || 'Unknown Challenge',
        score: data.score || 0,
        gameMode: data.gameMode || 'draw-memory'
      });
    });

    return gameResults;
  } catch (error) {
    console.error('Error fetching user game history:', error);
    throw error;
  }
}

export async function fetchLeaderboardEntries(date: string): Promise<LeaderboardEntry[]> {
  try {
    const scoresRef = collection(firestore, 'nfl-draw-logo');
    const q = query(
      scoresRef,
      where('gameMode', '==', 'draw-memory'),
      where('puzzleDate', '==', date),
      orderBy('score', 'desc'),
      orderBy('timeTaken', 'asc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const leaderboardEntries: LeaderboardEntry[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      leaderboardEntries.push({
        id: doc.id,
        userId: data.userId,
        displayName: data.userName || 'Anonymous',
        moves: data.moves || 0,
        hintsUsed: data.hintsUsed || 0,
        totalTime: data.timeTaken ? data.timeTaken * 1000 : 0, // Convert seconds to milliseconds
        completedAt: new Date(data.timestamp),
        puzzleDate: data.puzzleDate || date
      });
    });

    return leaderboardEntries;
  } catch (error) {
    console.error('Error fetching leaderboard entries:', error);
    throw error;
  }
}

export async function getUserRank(userId: string, puzzleDate: string): Promise<{ rank: number; userEntry: LeaderboardEntry } | null> {
  try {
    const scoresRef = collection(firestore, 'nfl-draw-logo');
    const q = query(
      scoresRef,
      where('gameMode', '==', 'draw-memory'),
      where('puzzleDate', '==', puzzleDate),
      orderBy('score', 'desc'),
      orderBy('timeTaken', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const allEntries: LeaderboardEntry[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      allEntries.push({
        id: doc.id,
        userId: data.userId,
        displayName: data.userName || 'Anonymous',
        moves: data.moves || 0,
        hintsUsed: data.hintsUsed || 0,
        totalTime: data.timeTaken ? data.timeTaken * 1000 : 0, // Convert seconds to milliseconds
        completedAt: new Date(data.timestamp),
        puzzleDate: data.puzzleDate || puzzleDate
      });
    });

    // Find user's entry and rank
    const userEntryIndex = allEntries.findIndex(entry => entry.userId === userId);
    if (userEntryIndex === -1) {
      return null;
    }

    return {
      rank: userEntryIndex + 1,
      userEntry: allEntries[userEntryIndex]
    };
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
}