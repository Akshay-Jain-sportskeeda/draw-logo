'use client';

import React, { useState, useEffect } from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { firestore } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import WinScreen from '@/components/WinScreen';
import { WinStats } from '@/types/game';

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

export default function DrawMemoryPage() {
  const [drawingData, setDrawingData] = useState<string>('');
  const [showLogo, setShowLogo] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<{
    accuracyScore: number;
    timeScore: number;
    finalScore: number;
    accuracyContribution: number;
    timeContribution: number;
    cappedTimeSeconds: number;
    actualTimeSeconds: number;
    drawingAnalysis?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoColors, setLogoColors] = useState<string[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [colorExtractionError, setColorExtractionError] = useState<string | null>(null);
  const [overlayLogoUrl, setOverlayLogoUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [showImprovementTicker, setShowImprovementTicker] = useState(false);
  const [showWinScreen, setShowWinScreen] = useState(false);
  
  const ACCURACY_THRESHOLD = 10; // Minimum accuracy required to show score

  const { user } = useAuth();
  const { setShowLoginModal } = useAuthModal();

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent! You're a logo master!";
    if (score >= 60) return "Great job! Very recognizable!";
    if (score >= 40) return "Good effort! Getting there!";
    if (score >= 20) return "Nice try! Keep practicing!";
    return "Keep going! Every artist starts somewhere!";
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getCalculationText = (actualTime: number, cappedTime: number): string => {
    if (actualTime > 600) {
      return `${actualTime}s → ${cappedTime}s`;
    }
    return `${actualTime}s`;
  };

  // Fetch daily challenge on component mount
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
      } catch (error) {
        console.error('Error fetching daily challenge:', error);
        setChallengeError(error instanceof Error ? error.message : 'Failed to load daily challenge');
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    fetchDailyChallenge();
  }, []);

  const currentTeam = dailyChallenge?.memoryChallenge.name || 'Loading...';
  const logoUrl = dailyChallenge?.memoryChallenge.logoUrl || '';

  useEffect(() => {
    if (!logoUrl) return;
    
    const fetchLogoColors = async () => {
      setIsLoadingColors(true);
      setColorExtractionError(null);
      try {
        const response = await fetch('/api/get-logo-colors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logoUrl }),
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
  }, [logoUrl]);

  // Reset start time when daily challenge loads
  useEffect(() => {
    if (dailyChallenge) {
      setStartTime(Date.now());
      setTimeTaken(null);
      setScoreSaved(false);
    }
  }, [dailyChallenge]);

  const handleDrawingChange = (dataUrl: string) => {
    setDrawingData(dataUrl);
  };

  const handleRevealLogo = () => {
    setShowLogo(true);
  };

  const handleOverlayLogo = () => {
    setOverlayLogoUrl(logoUrl);
  };

  const handleRemoveOverlay = () => {
    setOverlayLogoUrl(null);
  };

  const handleClearCanvas = () => {
    setDrawingData('');
  };

  const handleSubmitDrawing = async () => {
    if (!drawingData) {
      alert('Please draw something first!');
      return;
    }

    console.log('=== SUBMIT DRAWING DEBUG START ===');
    console.log('User object:', user);
    console.log('User logged in:', !!user);
    console.log('Drawing data exists:', !!drawingData);
    console.log('Current challenge:', currentTeam);

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
          targetLogoUrl: logoUrl,
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
      const finalScore = Math.round(0.6 * accuracyScore + 0.4 * timeScore); // Combined score
      
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
        accuracyContribution: Math.round(0.6 * accuracyScore * 100) / 100,
        timeContribution: Math.round(0.4 * timeScore * 100) / 100,
        cappedTimeSeconds: cappedTimeSeconds,
        actualTimeSeconds: calculatedTimeTaken,
        drawingAnalysis: result.breakdown // Keep original drawing analysis
      };
      
      setScore(finalScore);
      setScoreBreakdown(newScoreBreakdown);

      // Show win screen for successful scores
      setShowWinScreen(true);

      // Save score to database if user is logged in
      if (user && finalScore !== null) {
        console.log('User is logged in and score exists, calling saveScoreToFirestore...');
        await saveScoreToFirestore(finalScore, calculatedTimeTaken, currentTeam, newScoreBreakdown);
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
  };

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
      
      const scoreData = {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email,
        score: score,
        accuracyScore: breakdown.accuracyScore,
        timeScore: breakdown.timeScore,
        totalTime: timeTaken * 1000, // convert to milliseconds for consistency
        challengeName: challengeName,
        puzzleDate: dailyChallenge?.date || new Date().toLocaleDateString('en-CA'), // Use challenge date
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
    } catch (error) {
      console.error('=== FIRESTORE SAVE ERROR ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Full error object:', error);
      console.error('Error stack:', error?.stack);
      console.error('=== END FIRESTORE SAVE ERROR ===');
      // Don't show an alert for this error as it's not critical to the user experience
    } finally {
      setIsSavingScore(false);
      console.log('Set isSavingScore to false');
      console.log('=== SAVE SCORE TO FIRESTORE DEBUG END ===');
    }
  };

  const handleRefreshChallenge = () => {
    // Refresh the page to get the daily challenge again
    window.location.reload();
  };

  // Show loading state while fetching daily challenge
  if (isLoadingChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading today's challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if challenge failed to load
  if (challengeError || !dailyChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Challenge</h2>
            <p className="text-gray-600 mb-4">{challengeError}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRefreshChallenge}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Try Again
              </button>
              <Link href="/" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block">
                Back to Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleResetChallenge = () => {
    setDrawingData('');
    setScore(null);
    setScoreBreakdown(null);
    setShowLogo(false);
    setColorExtractionError(null);
    setOverlayLogoUrl(null);
    setStartTime(Date.now());
    setTimeTaken(null);
    setScoreSaved(false);
    setShowImprovementTicker(false);
    setShowWinScreen(false);
  };

  const handleWinScreenClose = () => {
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
  };

  const handleShare = async () => {
    const shareText = `I just scored ${score}% drawing the ${currentTeam} logo! Can you beat my score?`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NFL Logo Drawing Game',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred, fallback to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Score copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    }
  };

  const handleArchive = () => {
    // Placeholder for archive functionality
    alert('Archive feature coming soon!');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <Link href="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
                ← Back
              </Link>
              <h2 className="text-2xl font-semibold text-gray-800 text-center md:text-left md:flex-1 md:text-center">
                Draw the {currentTeam} logo
              </h2>
              {/* Spacer for desktop to keep h2 centered */}
              <div className="hidden md:block md:w-16"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center space-y-4 w-full">
              <h3 className="text-lg font-medium text-gray-700 text-center">
                Your Drawing
              </h3>
              <div className="w-full flex flex-col items-center space-y-4">
                {!isLoadingColors && (
                  <DrawingCanvas
                    onDrawingChange={handleDrawingChange}
                    availableColors={logoColors}
                    overlayImageUrl={overlayLogoUrl}
                    onClearCanvas={handleClearCanvas}
                  />
                )}
                {isLoadingColors && (
                  <div className="w-full max-w-[400px] h-[300px] sm:h-[400px] border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500">Loading drawing canvas...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-medium text-gray-700 text-center">
                Actual Logo
              </h3>
              <div className="flex justify-center w-full">
                {showLogo ? (
                    <div className="w-full max-w-[400px] h-[300px] sm:h-[400px] border-2 border-gray-300 rounded-lg p-4 bg-white flex items-center justify-center relative">
                      <img
                        src={logoUrl}
                        alt={`${currentTeam} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Failed to load logo:', logoUrl);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvZ28gTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />

                      <div className="absolute bottom-4 right-4">
                        <button
                          onClick={overlayLogoUrl ? handleRemoveOverlay : handleOverlayLogo}
                          className={`px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium shadow-lg ${
                            overlayLogoUrl
                              ? 'bg-gray-500 hover:bg-gray-600'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {overlayLogoUrl ? 'Remove' : 'Overlay'}
                        </button>
                      </div>
                    </div>
                ) : (
                  <div className="w-full max-w-[400px] h-[300px] sm:h-[400px] border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 p-4 relative">
                    <p className="text-gray-500 text-center">
                      Logo hidden<br />
                      Click "Reveal Logo" to see it
                    </p>

                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={handleRevealLogo}
                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium shadow-lg"
                      >
                        Reveal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <div className="relative">
              <button
                onClick={handleSubmitDrawing}
                disabled={isLoading || isSavingScore}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Scoring...' : isSavingScore ? 'Saving Score...' : 'Submit Drawing'}
              </button>
              
              {/* Improvement Ticker */}
              {showImprovementTicker && (
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse whitespace-nowrap z-10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium">Hmm, needs more details to recognize it!</span>
                  </div>
                  {/* Arrow pointing down to button */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Win Screen Section - Shows below main container when modal is closed */}
        {!showWinScreen && score !== null && scoreBreakdown && timeTaken !== null && (
          <div id="win-screen-section" className="bg-white rounded-xl shadow-lg p-8">
            {/* Match WinScreen modal layout exactly */}
            <div className="max-w-[350px] mx-auto text-center">
              {/* Win Banner Container - matches modal styling */}
              <div className="relative -mx-8 -mt-8 mb-5 px-8 pt-11 pb-5 bg-gradient-to-r from-gray-800 to-black rounded-t-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 pointer-events-none rounded-t-xl"></div>
                <div className="relative z-10">
                  <div className="text-2xl font-bold text-white mb-2 text-shadow-lg">
                    🎉 Congratulations!
                  </div>
                  <div className="text-white/90">
                    Your Performance
                  </div>
                </div>
              </div>

              {/* Stats Grid - matches modal layout */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center p-4 rounded-lg border border-gray-200 bg-blue-50">
                  <div className="text-gray-700 font-medium">Accuracy Score</div>
                  <span className="text-xl font-bold text-blue-600">{Math.round(scoreBreakdown.accuracyScore)}%</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg border border-gray-200 bg-yellow-50">
                  <div className="text-gray-700 font-medium">Time Score</div>
                  <span className="text-xl font-bold text-orange-600">{Math.round(scoreBreakdown.timeScore)}%</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-gray-200 bg-green-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-700 font-medium">Final Score</div>
                    <span className="text-xl font-bold text-green-600">{score}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>Time: {formatTime(timeTaken)}</div>
                    <div>60% accuracy + 40% time</div>
                  </div>
                </div>
              </div>

              {/* Primary Action - matches modal */}
              <div className="flex justify-center mb-3">
                {user ? (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigateToLeaderboard'));
                    }}
                    className="min-w-[120px] px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                    View Leaderboard
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="min-w-[120px] px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                    Login to view your Rank
                  </button>
                )}
              </div>

              {/* Secondary Actions - matches modal */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleShare}
                  className="min-w-[100px] px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-1.5 text-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16,6 12,2 8,6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleArchive}
                  className="min-w-[100px] px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-1.5 text-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21,8 21,21 3,21 3,8"/>
                    <rect x="1" y="3" width="22" height="5"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  Play&nbsp;Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Win Screen Modal */}
      {showWinScreen && score !== null && scoreBreakdown && timeTaken !== null && (
        <WinScreen
          stats={{
            moves: 0, // Not applicable for drawing game
            hints: 0, // Not applicable for drawing game
            displayTime: formatTime(timeTaken),
            calculation: `60% accuracy + 40% time = ${score}%`
          }}
          score={score}
          accuracyScore={scoreBreakdown.accuracyScore}
          timeScore={scoreBreakdown.timeScore}
          onShare={handleShare}
          onArchive={handleArchive}
          onClose={handleWinScreenClose}
          show={showWinScreen}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
        />
      )}

    </div>
  );
}