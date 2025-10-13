'use client';

import React from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { useAuth } from '@/lib/useAuth';
import { useGame } from '@/context/GameStateContext';
import WinScreen from '@/components/WinScreen';
import ArchiveScreen from '@/components/ArchiveScreen';

export default function DrawMemoryPage() {
  const { user } = useAuth();
  const gameState = useGame();
  const { setShowLoginModal } = useAuthModal();
  
  const {
    drawingData,
    showLogo,
    score,
    scoreBreakdown,
    isLoading,
    logoColors,
    isLoadingColors,
    colorExtractionError,
    overlayLogoUrl,
    timeTaken,
    isSavingScore,
    dailyChallenge,
    isLoadingChallenge,
    challengeError,
    showImprovementTicker,
    showWinScreen,
    showArchiveScreen,
    setShowArchiveScreen,
    showAutoSaveNotification,
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
    setCompositeImageGetter,
  } = gameState;

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

  const currentTeam = dailyChallenge?.memoryChallenge.name || 'Loading...';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back
              </Link>
              <button
                onClick={handleArchive}
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                Archive →
              </button>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
              Draw the {currentTeam} logo
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="w-full flex flex-col items-center space-y-4">
                {!isLoadingColors && (
                  <DrawingCanvas
                    onDrawingChange={handleDrawingChange}
                    availableColors={logoColors}
                    overlayImageUrl={overlayLogoUrl}
                    onClearCanvas={handleClearCanvas}
                    drawingData={drawingData}
                    onCompositeImageReady={setCompositeImageGetter}
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
              <div className="flex justify-center w-full">
                {showLogo ? (
                    <div className="w-full max-w-[400px] h-[300px] sm:h-[400px] border-2 border-gray-300 rounded-lg p-4 bg-white flex items-center justify-center relative">
                      <img
                        src={dailyChallenge?.memoryChallenge.logoUrl}
                        alt={`${currentTeam} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Failed to load logo:', dailyChallenge?.memoryChallenge.logoUrl);
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
                    <span className="text-sm font-medium">You can do better than that!</span>
                  </div>
                  {/* Arrow pointing down to button */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Win Screen Section - Shows below main container when modal is closed */}
        {!showWinScreen && score !== null && scoreBreakdown !== null && timeTaken !== null && (
          <div className="flex justify-center">
            <div id="win-screen-section" className="bg-white rounded-xl shadow-lg p-8 w-[350px]">
            {/* Match WinScreen modal layout exactly */}
            <div className="text-center">
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
                  <div className="text-gray-700 font-medium">Time</div>
                  <span className="text-xl font-bold text-orange-600">{formatTime(timeTaken)}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-gray-200 bg-green-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-700 font-medium">Final Score</div>
                    <span className="text-xl font-bold text-green-600">{score}%</span>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    <div>75% accuracy + {Math.round(scoreBreakdown.timeScore)}% time bonus</div>
                  </div>
                </div>
              </div>

              {/* Primary Action - matches modal */}
              <div className="flex justify-center mb-3">
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
          </div>
        )}
      </div>

      {/* Win Screen Modal */}
      {showWinScreen && score !== null && scoreBreakdown && timeTaken !== null && (
        <WinScreen
          score={score}
          accuracyScore={scoreBreakdown.accuracyScore}
          timeScore={scoreBreakdown.timeScore}
          displayTime={formatTime(timeTaken)}
          onShare={handleShare}
          onArchive={handleArchive}
          onClose={handleWinScreenClose}
          show={showWinScreen}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
        />
      )}

      {/* Archive Screen Modal */}
      {showArchiveScreen && (
        <ArchiveScreen
          show={showArchiveScreen}
          onClose={() => setShowArchiveScreen(false)}
          onSelectDate={(date) => {
            setDailyChallengeByDate(date);
            setShowArchiveScreen(false);
          }}
          userId={user?.uid}
        />
      )}

      {/* Auto-save Notification */}
      {showAutoSaveNotification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontWeight: '500' }}>Score saved successfully!</span>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

    </div>
  );
}