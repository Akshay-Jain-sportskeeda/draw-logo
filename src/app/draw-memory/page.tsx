'use client';

import React, { useState, useEffect } from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { firestore } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function DrawMemoryPage() {
  const [drawingData, setDrawingData] = useState<string>('');
  const [showLogo, setShowLogo] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoColors, setLogoColors] = useState<string[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [colorExtractionError, setColorExtractionError] = useState<string | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [overlayLogoUrl, setOverlayLogoUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const { user } = useAuth();
  const { setShowLoginModal } = useAuthModal();

  const challenges = [
    {
      name: 'Arizona Cardinals',
      logoUrl: 'https://static.www.nfl.com/image/private/f_auto/league/ieid8hoygzdlmzo0tnf6'
    },
    {
      name: 'Atlanta Falcons',
      logoUrl: 'https://static.www.nfl.com/image/private/f_auto/league/gppfvr7n8gljgjaqux2x'
    },
    {
      name: 'Baltimore Ravens',
      logoUrl: 'https://static.www.nfl.com/image/private/f_auto/league/ayvwcmluj2ohkdlbiegi'
    },
    {
      name: 'Buffalo Bills',
      logoUrl: 'https://static.www.nfl.com/image/private/f_auto/league/grhjkahghjkk17v43hdx'
    },
    {
      name: 'Carolina Panthers',
      logoUrl: 'https://static.www.nfl.com/image/private/f_auto/league/xymxwrxtyj9fhaemhdyd'
    },
    {
      name: 'Green Bay Packers',
      logoUrl: 'https://static.www.nfl.com/image/private/f_auto/league/u9fltoslqdsyao8cpm0k'
    }
  ];

  const currentChallenge = challenges[currentChallengeIndex];
  const currentTeam = currentChallenge.name;
  const logoUrl = currentChallenge.logoUrl;

  useEffect(() => {
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

  // Reset start time when challenge changes
  useEffect(() => {
    setStartTime(Date.now());
    setTimeTaken(null);
    setScoreSaved(false);
  }, [currentChallengeIndex]);

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
      setScore(result.score);
      setScoreBreakdown(result.breakdown);

      // Save score to database if user is logged in
      if (user && result.score !== null) {
        console.log('User is logged in and score exists, calling saveScoreToFirestore...');
        await saveScoreToFirestore(result.score, calculatedTimeTaken, currentTeam);
      } else {
        console.log('Score not saved - User logged in:', !!user, 'Score exists:', result.score !== null);
      }
    } catch (error) {
      console.error('Error scoring drawing:', error);
      alert('Failed to score drawing. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('=== SUBMIT DRAWING DEBUG END ===');
    }
  };

  const saveScoreToFirestore = async (score: number, timeTaken: number, challengeName: string) => {
    console.log('=== SAVE SCORE TO FIRESTORE DEBUG START ===');
    console.log('Function called with parameters:');
    console.log('- score:', score);
    console.log('- timeTaken:', timeTaken);
    console.log('- challengeName:', challengeName);
    
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
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email,
        score: score,
        timeTaken: timeTaken, // in seconds
        challengeName: challengeName,
        timestamp: Date.now(),
        gameMode: 'draw-memory',
        // Additional metadata
        scoreBreakdown: scoreBreakdown
      };

      console.log('Score data object created:');
      console.log(JSON.stringify(scoreData, null, 2));
      
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

  const handleNewChallenge = () => {
    const nextIndex = (currentChallengeIndex + 1) % challenges.length;
    setCurrentChallengeIndex(nextIndex);
    setDrawingData('');
    setScore(null);
    setScoreBreakdown(null);
    setShowLogo(false);
    setColorExtractionError(null);
    setOverlayLogoUrl(null);
    setTimeTaken(null);
    setScoreSaved(false);
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent! You're a logo master!";
    if (score >= 60) return "Great job! Very recognizable!";
    if (score >= 40) return "Good effort! Getting there!";
    if (score >= 20) return "Nice try! Keep practicing!";
    return "Keep going! Every artist starts somewhere!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6 md:flex-row flex-col-reverse md:gap-0 gap-4">
            {/* Container for the back button */}
            <div className="w-full md:w-auto">
              <Link href="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
                ← Back
              </Link>
            </div>

            {/* Container for the heading */}
            <div className="w-full md:flex-1">
              <h2 className="text-2xl font-semibold text-gray-800 text-center">
                Draw the {currentTeam} logo
              </h2>
            </div>

            {/* Spacer for desktop */}
            <div className="w-16 hidden md:block"></div>
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
            <button
              onClick={handleSubmitDrawing}
              disabled={isLoading || isSavingScore}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Scoring...' : isSavingScore ? 'Saving Score...' : 'Submit Drawing'}
            </button>
          </div>

          {score !== null && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Your Score: {score}%
                </h3>
                {timeTaken !== null && (
                  <p className="text-lg text-gray-600 mb-2">
                    Time taken: {timeTaken} seconds
                  </p>
                )}
                <p className="text-lg text-gray-700">
                  {getScoreMessage(score)}
                </p>

                {/* User login/score saving status */}
                <div className="mt-4">
                  {!user ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700 mb-2">
                        Want to save your score to the leaderboard?
                      </p>
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      >
                        Login to Save Score
                      </button>
                    </div>
                  ) : scoreSaved ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700">
                        ✅ Score saved to leaderboard!
                      </p>
                    </div>
                  ) : isSavingScore ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        💾 Saving score to leaderboard...
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700">
                        Logged in as: {user.displayName || user.email?.split('@')[0] || 'User'}
                      </p>
                    </div>
                  )}
                </div>

                {scoreBreakdown && (
                  <div className="mt-6 bg-white rounded-lg p-4 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Scoring Breakdown</h4>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-1">Pixel Similarity</h5>
                        <p className="text-2xl font-bold text-blue-600">{scoreBreakdown.pixelScore}%</p>
                        <p className="text-xs text-blue-600">Raw pixel comparison</p>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-1">SSIM Score</h5>
                        <p className="text-2xl font-bold text-green-600">{scoreBreakdown.ssimScore}%</p>
                        <p className="text-xs text-green-600">Perceptual similarity</p>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h5 className="font-medium text-orange-800 mb-1">Edge Matching</h5>
                        <p className="text-2xl font-bold text-orange-600">{scoreBreakdown.edgeScore}%</p>
                        <p className="text-xs text-orange-600">Shape & outline similarity</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Weighted Contributions</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Pixel Score (20% weight):</span>
                          <span className="font-medium">{scoreBreakdown.pixelScore}% × 0.2 = {scoreBreakdown.pixelContribution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SSIM Score (65% weight):</span>
                          <span className="font-medium">{scoreBreakdown.ssimScore}% × 0.65 = {scoreBreakdown.ssimContribution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Edge Score (15% weight):</span>
                          <span className="font-medium">{scoreBreakdown.edgeScore}% × 0.15 = {scoreBreakdown.edgeContribution}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Final Score:</span>
                          <span>{scoreBreakdown.pixelContribution} + {scoreBreakdown.ssimContribution} + {scoreBreakdown.edgeContribution} = {score}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={handleNewChallenge}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  New Challenge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}