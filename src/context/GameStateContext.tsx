'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getTodayDateString } from '@/utils/dateHelpers';

interface DailyChallenge {
  date: string;
  memoryChallenge: {
    name: string;
    logoUrl: string;
  };
  freeDrawChallenge: {
    name: string;
    imageUrl: string;
  };
}

interface ScoreBreakdown {
  accuracyScore: number;
  timeScore: number;
  finalScore: number;
  accuracyContribution: number;
  timeContribution: number;
  cappedTimeSeconds: number;
  actualTimeSeconds: number;
  drawingAnalysis?: any;
}

interface PendingScore {
  score: number;
  timeTaken: number;
  challengeName: string;
  puzzleDate: string;
  breakdown: ScoreBreakdown;
}

interface GameState {
  // Drawing state
  drawingData: string;
  setDrawingData: (data: string) => void;
  getCompositeImage: (() => string) | null;
  setCompositeImageGetter: (getter: (() => string) | null) => void;

  // Game state
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
  overlayLogoUrl: string | null;
  setOverlayLogoUrl: (url: string | null) => void;
  
  // Scoring state
  score: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  timeTaken: number | null;
  startTime: number;
  isLoading: boolean;
  isSavingScore: boolean;
  scoreSaved: boolean;
  showWinScreen: boolean;
  setShowWinScreen: (show: boolean) => void;
  showImprovementTicker: boolean;
  showAutoSaveNotification: boolean;

  // Logo colors
  logoColors: string[];
  isLoadingColors: boolean;
  colorExtractionError: string | null;
  
  // Daily challenge
  dailyChallenge: DailyChallenge | null;
  isLoadingChallenge: boolean;
  challengeError: string | null;
  currentPuzzleDate: string;
  
  // Actions
  handleDrawingChange: (dataUrl: string) => void;
  handleRevealLogo: () => void;
  handleOverlayLogo: () => void;
  handleRemoveOverlay: () => void;
  handleClearCanvas: () => void;
  handleSubmitDrawing: () => Promise<void>;
  handleResetChallenge: () => void;
  handleRefreshChallenge: () => void;
  handleWinScreenClose: () => void;
  handleShare: () => Promise<void>;
  handleArchive: () => void;
  setDailyChallengeByDate: (date: string) => void;
  showArchiveScreen: boolean;
  setShowArchiveScreen: (show: boolean) => void;
}

const GameStateContext = createContext<GameState | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Drawing state
  const [drawingData, setDrawingData] = useState<string>('');
  const [getCompositeImage, setGetCompositeImage] = useState<(() => string) | null>(null);

  const setCompositeImageGetter = useCallback((getter: (() => string) | null) => {
    setGetCompositeImage(() => getter);
  }, []);
  
  // Game state
  const [showLogo, setShowLogo] = useState(false);
  const [overlayLogoUrl, setOverlayLogoUrl] = useState<string | null>(null);
  
  // Scoring state
  const [score, setScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [showImprovementTicker, setShowImprovementTicker] = useState(false);
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  const [showAutoSaveNotification, setShowAutoSaveNotification] = useState(false);
  
  // Logo colors
  const [logoColors, setLogoColors] = useState<string[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [colorExtractionError, setColorExtractionError] = useState<string | null>(null);
  
  // Daily challenge
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [currentPuzzleDate, setCurrentPuzzleDate] = useState<string>(getTodayDateString());
  
  // Archive screen
  const [showArchiveScreen, setShowArchiveScreen] = useState(false);
  
  const ACCURACY_THRESHOLD = 15;

  // Fetch daily challenge on mount
  useEffect(() => {
    const fetchDailyChallenge = async () => {
      setIsLoadingChallenge(true);
      setChallengeError(null);
      
      try {
        const response = await fetch('/api/daily-challenge');
        if (!response.ok) {
          throw new Error(`Failed to fetch daily challenge: ${response.status}`);
        }
        
        const challengeData: DailyChallenge = await response.json();
        setDailyChallenge(challengeData);
        setCurrentPuzzleDate(challengeData.date);
      } catch (error) {
        console.error('Error fetching daily challenge:', error);
        setChallengeError(error instanceof Error ? error.message : 'Failed to load daily challenge');
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    fetchDailyChallenge();
  }, []);

  // Fetch logo colors when daily challenge loads
  useEffect(() => {
    if (!dailyChallenge?.memoryChallenge.logoUrl) return;
    
    const fetchLogoColors = async () => {
      setIsLoadingColors(true);
      setColorExtractionError(null);
      try {
        const response = await fetch('/api/get-logo-colors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logoUrl: dailyChallenge.memoryChallenge.logoUrl }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.colors) {
            setLogoColors(result.colors);
          } else {
            throw new Error('No colors returned from API');
          }
        } else {
          let errorMessage;
          try {
            const errorResult = await response.json();
            errorMessage = errorResult.error || `HTTP ${response.status}: Failed to fetch logo colors`;
          } catch (jsonError) {
            errorMessage = `HTTP ${response.status}: Server returned non-JSON response`;
          }
          setColorExtractionError(errorMessage);
          console.error('Failed to fetch logo colors:', errorMessage);

          const defaultColors = ['#000000', '#ffffff', '#0066cc', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#eab308'];
          setLogoColors(defaultColors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
        setColorExtractionError(`Network error: ${errorMessage}`);
        console.error('Error fetching logo colors:', error);

        const defaultColors = ['#000000', '#ffffff', '#0066cc', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#eab308'];
        setLogoColors(defaultColors);
      } finally {
        setIsLoadingColors(false);
      }
    };

    fetchLogoColors();
  }, [dailyChallenge?.memoryChallenge.logoUrl]);

  // Reset start time when daily challenge loads
  useEffect(() => {
    if (dailyChallenge) {
      setStartTime(Date.now());
      setTimeTaken(null);
      setScoreSaved(false);
    }
  }, [dailyChallenge]);

  // Auto-save pending score when user logs in
  useEffect(() => {
    const autoSavePendingScore = async () => {
      if (user && pendingScore && !scoreSaved) {
        console.log('=== AUTO-SAVE PENDING SCORE ===');
        console.log('User logged in, attempting to save pending score...');
        console.log('Pending score data:', pendingScore);

        try {
          await saveScoreToFirestore(
            pendingScore.score,
            pendingScore.timeTaken,
            pendingScore.challengeName,
            pendingScore.breakdown
          );

          setPendingScore(null);
          setShowAutoSaveNotification(true);

          setTimeout(() => {
            setShowAutoSaveNotification(false);
          }, 3000);

          console.log('Pending score successfully saved!');
        } catch (error) {
          console.error('Failed to auto-save pending score:', error);
        }
      }
    };

    autoSavePendingScore();
  }, [user, pendingScore, scoreSaved]);

  const saveScoreToFirestore = async (score: number, timeTaken: number, challengeName: string, breakdown: any) => {
    console.log('=== SAVE SCORE TO FIRESTORE DEBUG START ===');
    console.log('Function called with parameters:');
    console.log('- score:', score);
    console.log('- timeTaken:', timeTaken);
    console.log('- challengeName:', challengeName);
    console.log('- breakdown:', breakdown);
    
    if (!user) {
      console.log('ERROR: No user found, cannot save score');
      return;
    }

    console.log('User details:');
    console.log('- uid:', user.uid);
    console.log('- displayName:', user.displayName);
    console.log('- email:', user.email);

    setIsSavingScore(true);
    console.log('Set isSavingScore to true');
    
    try {
      console.log('Creating Firestore reference to nfl-draw-logo collection...');
      const scoresRef = collection(firestore, 'nfl-draw-logo');
      console.log('Firestore collection reference created successfully');
      
      // Check if user already has a score for this puzzle date
      const currentPuzzleDate = dailyChallenge?.date || getTodayDateString();
      console.log('Checking for existing score for puzzleDate:', currentPuzzleDate);
      
      const existingScoreQuery = query(
        scoresRef,
        where('userId', '==', user.uid),
        where('puzzleDate', '==', currentPuzzleDate),
        where('gameMode', '==', 'draw-memory')
      );
      
      console.log('Executing query to check for existing scores...');
      const existingScoreSnapshot = await getDocs(existingScoreQuery);
      
      if (!existingScoreSnapshot.empty) {
        console.log('EXISTING SCORE FOUND - User already has a score for this puzzle date');
        console.log('Number of existing scores:', existingScoreSnapshot.size);
        console.log('Skipping database save to prevent duplicate entries');
        setScoreSaved(true); // Still mark as saved for UI consistency
        return;
      }
      
      console.log('No existing score found, proceeding with save...');
      
      const scoreData = {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email,
        score: score,
        accuracyScore: breakdown.accuracyScore,
        timeScore: breakdown.timeScore,
        totalTime: timeTaken * 1000, // convert to milliseconds for consistency
        challengeName: challengeName,
        puzzleDate: currentPuzzleDate, // Use challenge date
        completedAt: new Date(), // Exact completion timestamp
        timestamp: Date.now(),
        gameMode: 'draw-memory',
        moves: 0, // Placeholder for future move tracking
        hintsUsed: 0, // Placeholder for future hint tracking
        // Additional metadata
        scoreBreakdown: breakdown
      };

      console.log('Score data object created:');
      console.log(JSON.stringify(scoreData, null, 2));
      console.log('accuracyScore being saved:', scoreData.accuracyScore);
      console.log('breakdown.accuracyScore:', breakdown.accuracyScore);
      
      console.log('Attempting to add document to Firestore...');
      await addDoc(scoresRef, scoreData);
      console.log('Document successfully added to Firestore!');
      
      setScoreSaved(true);
      console.log('Set scoreSaved state to true');
      console.log('Score saved successfully to Firestore - COMPLETE');
    } catch (error: unknown) {
      console.error('=== FIRESTORE SAVE ERROR ===');
      console.error('Error type:', (error as any)?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error object:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('=== END FIRESTORE SAVE ERROR ===');
      // Don't show an alert for this error as it's not critical to the user experience
    } finally {
      setIsSavingScore(false);
      console.log('Set isSavingScore to false');
      console.log('=== SAVE SCORE TO FIRESTORE DEBUG END ===');
    }
  };

  // Action handlers
  const handleDrawingChange = useCallback((dataUrl: string) => {
    setDrawingData(dataUrl);
    // Hide win screen when drawing changes
    if (showWinScreen) {
      setShowWinScreen(false);
    }
  }, []);

  const handleRevealLogo = useCallback(() => {
    setShowLogo(true);
  }, []);

  const handleOverlayLogo = useCallback(() => {
    if (dailyChallenge) {
      setOverlayLogoUrl(dailyChallenge.memoryChallenge.logoUrl);
    }
  }, [dailyChallenge]);

  const handleRemoveOverlay = useCallback(() => {
    setOverlayLogoUrl(null);
  }, []);

  const handleClearCanvas = useCallback(() => {
    // Clear only the drawing data, keep overlay and logo visible
    setDrawingData('');
    setScore(null);
    setScoreBreakdown(null);
    setTimeTaken(null);
    setStartTime(Date.now());
    setShowImprovementTicker(false);
    setShowWinScreen(false);
    setPendingScore(null);
  }, []);

  const handleSubmitDrawing = useCallback(async () => {
    if (!drawingData || !dailyChallenge) {
      alert('Please draw something first!');
      return;
    }

    console.log('=== SUBMIT DRAWING DEBUG START ===');
    console.log('User object:', user);
    console.log('User logged in:', !!user);
    console.log('Drawing data exists:', !!drawingData);
    console.log('Current challenge:', dailyChallenge.memoryChallenge.name);

    // Calculate time taken
    const endTime = Date.now();
    const calculatedTimeTaken = Math.round((endTime - startTime) / 1000); // in seconds
    setTimeTaken(calculatedTimeTaken);
    console.log('Time calculation - Start:', startTime, 'End:', endTime, 'Duration (seconds):', calculatedTimeTaken);

    setIsLoading(true);
    try {
      console.log('Starting API call to score drawing...');
      const response = await fetch('/api/score-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drawingData,
          targetLogoUrl: dailyChallenge.memoryChallenge.logoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to score drawing');
      }

      const result = await response.json();
      console.log('API response received:', result);
      
      // Calculate new scoring system
      const accuracyScore = result.score; // Raw accuracy from drawing analysis
      
      console.log('Initial accuracy score:', accuracyScore);
      console.log('Accuracy threshold:', ACCURACY_THRESHOLD);
      
      // Check if accuracy meets minimum threshold
      if (accuracyScore < ACCURACY_THRESHOLD) {
        console.log('Accuracy below threshold, showing feedback message');
        setScore(null);
        setScoreBreakdown(null);
        setShowImprovementTicker(true);
        
        // Auto-hide the ticker after 4 seconds
        setTimeout(() => {
          setShowImprovementTicker(false);
        }, 4000);
        
        // Don't save to database or calculate time score
        return;
      }
      
      // Accuracy meets threshold, proceed with full scoring
      console.log('Accuracy meets threshold, calculating full score');
      setShowImprovementTicker(false);
      
      const cappedTimeSeconds = Math.min(calculatedTimeTaken, 600); // Cap at 10 minutes
      const timeScore = Math.max(0, (1 - cappedTimeSeconds / 600) * 100); // Time score 0-100
      const finalScore = Math.round(0.85 * accuracyScore + 0.15 * timeScore); // Combined score
      
      console.log('Full scoring breakdown:');
      console.log('- Accuracy Score:', accuracyScore);
      console.log('- Actual Time (seconds):', calculatedTimeTaken);
      console.log('- Capped Time (seconds):', cappedTimeSeconds);
      console.log('- Time Score:', timeScore.toFixed(2));
      console.log('- Final Score:', finalScore);
      
      const newScoreBreakdown = {
        accuracyScore: Math.round(accuracyScore * 100) / 100,
        timeScore: Math.round(timeScore * 100) / 100,
        finalScore: finalScore,
        accuracyContribution: Math.round(0.85 * accuracyScore * 100) / 100,
        timeContribution: Math.round(0.15 * timeScore * 100) / 100,
        cappedTimeSeconds: cappedTimeSeconds,
        actualTimeSeconds: calculatedTimeTaken,
        drawingAnalysis: result.breakdown // Keep original drawing analysis
      };
      
      setScore(finalScore);
      setScoreBreakdown(newScoreBreakdown);

      // Show win screen for successful scores
      setShowWinScreen(true);

      // Save score to database if user is logged in, otherwise store as pending
      if (user && finalScore !== null) {
        console.log('User is logged in and score exists, calling saveScoreToFirestore...');
        await saveScoreToFirestore(finalScore, calculatedTimeTaken, dailyChallenge.memoryChallenge.name, newScoreBreakdown);
      } else if (!user && finalScore !== null) {
        console.log('User not logged in, storing score as pending for auto-save after login');
        setPendingScore({
          score: finalScore,
          timeTaken: calculatedTimeTaken,
          challengeName: dailyChallenge.memoryChallenge.name,
          puzzleDate: dailyChallenge.date,
          breakdown: newScoreBreakdown
        });
      } else {
        console.log('Score not saved - User logged in:', !!user, 'Score exists:', finalScore !== null);
      }
    } catch (error) {
      console.error('Error scoring drawing:', error);
      alert('Failed to score drawing. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('=== SUBMIT DRAWING DEBUG END ===');
    }
  }, [drawingData, dailyChallenge, user, startTime]);

  const handleResetChallenge = useCallback(() => {
    setDrawingData('');
    setScore(null);
    setScoreBreakdown(null);
    setTimeTaken(null);
    setShowLogo(false);
    setColorExtractionError(null);
    setOverlayLogoUrl(null);
    setStartTime(Date.now());
    setScoreSaved(false);
    setShowImprovementTicker(false);
    setShowWinScreen(false);
    setPendingScore(null);
  }, []);

  const handleRefreshChallenge = useCallback(() => {
    // Refresh the page to get the daily challenge again
    window.location.reload();
  }, []);

  const handleWinScreenClose = useCallback(() => {
    setShowWinScreen(false);
    
    // Smooth scroll to the win screen section below
    setTimeout(() => {
      const winScreenElement = document.getElementById('win-screen-section');
      if (winScreenElement) {
        winScreenElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }, []);

  const handleShare = useCallback(async () => {
    if (!score || !dailyChallenge) return;

    console.log('=== HANDLE SHARE: Starting ===');

    const shareText = `I just scored ${score}% drawing the ${dailyChallenge.memoryChallenge.name} logo! Can you beat my score?`;

    if (navigator.share && getCompositeImage) {
      try {
        console.log('=== Generating composite image for sharing ===');
        const compositeImageData = getCompositeImage();

        if (compositeImageData && navigator.canShare) {
          const blob = await fetch(compositeImageData).then(r => r.blob());
          const file = new File([blob], 'my-drawing.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            console.log('=== Sharing with image file ===');
            await navigator.share({
              title: 'NFL Logo Drawing Game',
              text: shareText,
              files: [file]
            });
            return;
          }
        }

        console.log('=== Sharing without image (not supported) ===');
        await navigator.share({
          title: 'NFL Logo Drawing Game',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
          navigator.clipboard.writeText(shareText);
          alert('Score copied to clipboard!');
        }
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'NFL Logo Drawing Game',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareText);
          alert('Score copied to clipboard!');
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    }
  }, [score, dailyChallenge, getCompositeImage]);

  const handleArchive = useCallback(() => {
    setShowArchiveScreen(true);
  }, []);

  const setDailyChallengeByDate = useCallback(async (date: string) => {
    setIsLoadingChallenge(true);
    setChallengeError(null);
    
    try {
      const response = await fetch(`/api/daily-challenge?date=${date}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch challenge for ${date}: ${response.status}`);
      }
      
      const challengeData: DailyChallenge = await response.json();
      setDailyChallenge(challengeData);
      setCurrentPuzzleDate(date);
      
      // Reset all game state for new challenge
      setDrawingData('');
      setScore(null);
      setScoreBreakdown(null);
      setTimeTaken(null);
      setShowLogo(false);
      setColorExtractionError(null);
      setOverlayLogoUrl(null);
      setStartTime(Date.now());
      setScoreSaved(false);
      setShowImprovementTicker(false);
      setShowWinScreen(false);
      setPendingScore(null);
      
    } catch (error) {
      console.error('Error fetching challenge by date:', error);
      setChallengeError(error instanceof Error ? error.message : 'Failed to load challenge');
    } finally {
      setIsLoadingChallenge(false);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const value: GameState = {
    // Drawing state
    drawingData,
    setDrawingData,
    getCompositeImage,
    setCompositeImageGetter,

    // Game state
    showLogo,
    setShowLogo,
    overlayLogoUrl,
    setOverlayLogoUrl,
    
    // Scoring state
    score,
    scoreBreakdown,
    timeTaken,
    startTime,
    isLoading,
    isSavingScore,
    scoreSaved,
    showWinScreen,
    setShowWinScreen,
    showImprovementTicker,
    showAutoSaveNotification,

    // Logo colors
    logoColors,
    isLoadingColors,
    colorExtractionError,
    
    // Daily challenge
    dailyChallenge,
    isLoadingChallenge,
    challengeError,
    currentPuzzleDate,
    
    // Archive screen
    showArchiveScreen,
    setShowArchiveScreen,
    
    // Actions
    handleDrawingChange,
    handleRevealLogo,
    handleOverlayLogo,
    handleRemoveOverlay,
    handleClearCanvas,
    handleSubmitDrawing,
    handleResetChallenge,
    handleRefreshChallenge,
    handleWinScreenClose,
    handleShare,
    handleArchive,
    setDailyChallengeByDate,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameStateProvider');
  }
  return context;
}