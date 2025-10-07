import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { GameResult, LeaderboardEntry } from '@/types/game';

export type { GameResult };

export async function fetchUserGameHistory(userId: string, gameMode?: string): Promise<GameResult[]> {
  console.log('=== FETCHUSERGAMEHISTORY DEBUG START ===');
  console.log('fetchUserGameHistory called with userId:', userId, 'gameMode:', gameMode);
  try {
    const scoresRef = collection(firestore, 'nfl-draw-logo');

    let q;
    if (gameMode) {
      q = query(
        scoresRef,
        where('userId', '==', userId),
        where('gameMode', '==', gameMode)
      );
    } else {
      q = query(
        scoresRef,
        where('userId', '==', userId)
      );
    }
    console.log('Firestore query created for user game history');

    const querySnapshot = await getDocs(q);
    console.log('Firestore query executed, snapshot size:', querySnapshot.size);
    const gameResults: GameResult[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      gameResults.push({
        id: doc.id,
        userId: data.userId,
        displayName: data.displayName || 'Anonymous',
        moves: data.moves || 0,
        hintsUsed: data.hintsUsed || 0,
        totalTime: data.timeTaken ? data.timeTaken * 1000 : 0,
        completedAt: new Date(data.timestamp),
        puzzleDate: data.puzzleDate || new Date(data.timestamp).toLocaleDateString('en-CA'),
        challengeName: data.challengeName || 'Unknown Challenge',
        score: data.score || 0,
        gameMode: data.gameMode || 'draw-memory'
      });
    });

    console.log('Game results processed, total:', gameResults.length);
    console.log('Sample game results:', gameResults.slice(0, 2));
    console.log('=== FETCHUSERGAMEHISTORY DEBUG END ===');
    return gameResults;
  } catch (error) {
    console.error('Error fetching user game history:', error);
    console.log('fetchUserGameHistory error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
}

export async function fetchLeaderboardEntries(date: string): Promise<LeaderboardEntry[]> {
  console.log('=== FETCHLEADERBOARDENTRIES DEBUG START ===');
  console.log('fetchLeaderboardEntries called with date:', date);
  try {
    const scoresRef = collection(firestore, 'nfl-draw-logo');
    const q = query(
      scoresRef,
      where('gameMode', '==', 'draw-memory'),
      where('puzzleDate', '==', date),
      orderBy('score', 'desc'),
      orderBy('timestamp', 'asc'),
      limit(20)
    );
    console.log('Firestore query created for leaderboard entries');
    console.log('Query filters: gameMode=draw-memory, puzzleDate=' + date);

    const querySnapshot = await getDocs(q);
    console.log('Firestore query executed, snapshot size:', querySnapshot.size);
    const leaderboardEntries: LeaderboardEntry[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      console.log('Processing document:', doc.id, 'data:', data);
      console.log('accuracyScore from data:', data.accuracyScore);
      console.log('score from data:', data.score);
      leaderboardEntries.push({
        id: doc.id,
        userId: data.userId,
        displayName: data.displayName || 'Anonymous',
        moves: data.moves || 0,
        hintsUsed: data.hintsUsed || 0,
        totalTime: data.totalTime || 0, // Already in milliseconds
        completedAt: new Date(data.timestamp),
        puzzleDate: data.puzzleDate || date,
        score: data.score || 0,
        accuracyScore: data.scoreBreakdown?.accuracyScore || 0,
        timeScore: data.timeScore || 0
      });
    });

    console.log('Leaderboard entries processed, total:', leaderboardEntries.length);
    console.log('Final leaderboard entries:', leaderboardEntries);
    console.log('=== FETCHLEADERBOARDENTRIES DEBUG END ===');
    return leaderboardEntries;
  } catch (error) {
    console.error('Error fetching leaderboard entries:', error);
    console.log('fetchLeaderboardEntries error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
}

export async function getUserRank(userId: string, puzzleDate: string): Promise<{ rank: number; userEntry: LeaderboardEntry } | null> {
  console.log('=== GETUSERRANK DEBUG START ===');
  console.log('getUserRank called with userId:', userId, 'puzzleDate:', puzzleDate);
  try {
    const scoresRef = collection(firestore, 'nfl-draw-logo');
    const q = query(
      scoresRef,
      where('gameMode', '==', 'draw-memory'),
      where('puzzleDate', '==', puzzleDate),
      orderBy('score', 'desc'),
      orderBy('timestamp', 'asc')
    );
    console.log('Firestore query created for user rank');
    console.log('Query filters: gameMode=draw-memory, puzzleDate=' + puzzleDate);

    const querySnapshot = await getDocs(q);
    console.log('Firestore query executed, snapshot size:', querySnapshot.size);
    const allEntries: LeaderboardEntry[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      allEntries.push({
        id: doc.id,
        userId: data.userId,
        displayName: data.displayName || 'Anonymous',
        moves: data.moves || 0,
        hintsUsed: data.hintsUsed || 0,
        totalTime: data.totalTime || 0, // Already in milliseconds
        completedAt: new Date(data.timestamp),
        puzzleDate: data.puzzleDate || puzzleDate,
        score: data.score || 0,
        accuracyScore: data.scoreBreakdown?.accuracyScore || 0,
        timeScore: data.timeScore || 0
      });
    });

    console.log('All entries processed, total:', allEntries.length);
    console.log('Sample entries:', allEntries.slice(0, 3));

    // Find user's entry and rank
    const userEntryIndex = allEntries.findIndex(entry => entry.userId === userId);
    console.log('User entry index:', userEntryIndex);
    if (userEntryIndex === -1) {
      console.log('User not found in entries, returning null');
      console.log('=== GETUSERRANK DEBUG END ===');
      return null;
    }

    const result = {
      rank: userEntryIndex + 1,
      userEntry: allEntries[userEntryIndex]
    };
    console.log('User rank result:', result);
    console.log('=== GETUSERRANK DEBUG END ===');
    return result;
  } catch (error) {
    console.error('Error getting user rank:', error);
    console.log('getUserRank error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
}