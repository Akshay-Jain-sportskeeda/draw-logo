'use client';

import React, { useState, useCallback } from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import SubmissionForm from '@/components/SubmissionForm';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';

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

export default function CreativeRemixPage() {
  const [drawingData, setDrawingData] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [getComposite, setGetComposite] = useState<(() => string) | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { user } = useAuth();
  const { setShowLoginModal } = useAuthModal();

  // Fetch daily challenge on component mount
  React.useEffect(() => {
    const fetchDailyChallenge = async () => {
      setIsLoadingChallenge(true);
      setChallengeError(null);

      try {
        console.log('=== CREATIVE REMIX: Fetching daily challenge ===');
        const response = await fetch('/api/daily-challenge');
        if (!response.ok) {
          throw new Error(`Failed to fetch daily challenge: ${response.status}`);
        }

        const challengeData: DailyChallenge = await response.json();
        console.log('=== CREATIVE REMIX: Challenge data received ===');
        console.log('Free Draw Challenge:', challengeData.freeDrawChallenge);
        console.log('Template Name:', challengeData.freeDrawChallenge.name);
        console.log('Template Image URL:', challengeData.freeDrawChallenge.imageUrl);
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

  const defaultColors = [
    '#000000',
    '#ffffff',
    '#dc2626',
    '#ea580c',
    '#f59e0b',
    '#16a34a',
    '#0284c7',
    '#4f46e5',
    '#9333ea',
    '#ec4899'
  ];

  const handleDrawingChange = useCallback((dataUrl: string) => {
    setDrawingData(dataUrl);
  }, []);

  const handleCompositeReady = useCallback((getter: () => string) => {
    console.log('=== CREATIVE REMIX: Composite getter registered ===');
    setGetComposite(() => getter);
  }, []);

  const handleSubmitSuccess = () => {
    setSubmitted(true);
    document.body.style.overflow = 'hidden';
  };

  const handleSubmitError = (error: string) => {
    alert(error);
  };

  const handleCreateAnother = () => {
    setSubmitted(false);
    setDrawingData('');
    document.body.style.overflow = 'unset';
  };

  const handleRefreshChallenge = () => {
    // Refresh the page to get the daily challenge again
    window.location.reload();
  };

  const handleShare = async () => {
    if (!drawingData) {
      alert('Please create a drawing before sharing!');
      return;
    }

    if (!dailyChallenge) {
      alert('Challenge data not loaded yet!');
      return;
    }

    setIsSharing(true);

    try {
      console.log('=== SHARE: Starting share process ===');

      const shareText = `Check out my creative remix of ${dailyChallenge.freeDrawChallenge.name}!`;
      const shareUrl = window.location.href;

      // Helper function to copy image to clipboard
      const copyImageToClipboard = async () => {
        if (getComposite && navigator.clipboard && (navigator.clipboard as any).write) {
          try {
            console.log('=== SHARE: Copying image to clipboard ===');
            const compositeImageData = getComposite();
            const blob = await fetch(compositeImageData).then(r => r.blob());
            await (navigator.clipboard as any).write([
              new (window as any).ClipboardItem({
                'image/png': blob
              })
            ]);
            alert('Image copied to clipboard!');
            return true;
          } catch (error) {
            console.error('=== SHARE: Error copying image to clipboard ===', error);
            return false;
          }
        }
        return false;
      };

      if (navigator.share && getComposite) {
        try {
          console.log('=== SHARE: Generating composite image ===');
          const compositeImageData = getComposite();

          if (compositeImageData && compositeImageData.length > 100 && navigator.canShare) {
            const blob = await fetch(compositeImageData).then(r => r.blob());
            const file = new File([blob], 'my-creative-remix.png', { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
              console.log('=== SHARE: Sharing with image file ===');
              await navigator.share({
                title: 'Creative Remix - NFL Logo Drawing Game',
                text: shareText,
                files: [file]
              });
              console.log('=== SHARE: Successfully shared with image ===');
              return;
            }
          }

          console.log('=== SHARE: Sharing without image (not supported) ===');
          await navigator.share({
            title: 'Creative Remix - NFL Logo Drawing Game',
            text: shareText,
            url: shareUrl
          });
          console.log('=== SHARE: Successfully shared via Web Share API ===');
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            console.log('=== SHARE: User cancelled share ===');
          } else {
            console.error('=== SHARE: Error sharing ===', error);
            const imageCopied = await copyImageToClipboard();
            if (!imageCopied) {
              await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
              alert('Link copied to clipboard!');
            }
          }
        }
      } else if (navigator.share) {
        try {
          await navigator.share({
            title: 'Creative Remix - NFL Logo Drawing Game',
            text: shareText,
            url: shareUrl
          });
          console.log('=== SHARE: Successfully shared via Web Share API ===');
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            console.log('=== SHARE: User cancelled share ===');
          } else {
            console.error('=== SHARE: Error sharing ===', error);
            const imageCopied = await copyImageToClipboard();
            if (!imageCopied) {
              await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
              alert('Link copied to clipboard!');
            }
          }
        }
      } else {
        // No Web Share API, try to copy image to clipboard first
        const imageCopied = await copyImageToClipboard();
        if (!imageCopied) {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          alert('Link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('=== SHARE: Error ===', error);
      alert('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Show loading state while fetching daily challenge
  if (isLoadingChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading today's challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if challenge failed to load
  if (challengeError || !dailyChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
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
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4 max-w-[576px]">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <Link href="/" className="inline-block text-green-600 hover:text-green-700 font-medium mb-4 md:mb-0">
                ← Back
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-8">
            <div className="w-full flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                {dailyChallenge.freeDrawChallenge.name}
              </h2>
              {dailyChallenge.freeDrawChallenge.imageUrl ? (
                <DrawingCanvas
                  key={dailyChallenge.freeDrawChallenge.imageUrl}
                  onDrawingChange={handleDrawingChange}
                  availableColors={defaultColors}
                  permanentTemplate={true}
                  templateImageUrl={dailyChallenge.freeDrawChallenge.imageUrl}
                  drawingData={drawingData}
                  onCompositeImageReady={handleCompositeReady}
                />
              ) : (
                <div className="w-full max-w-[400px] h-[300px] sm:h-[400px] border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center p-4">
                    <p className="text-gray-600 font-medium mb-2">No template available</p>
                    <p className="text-gray-500 text-sm">
                      The template image for today's challenge is not yet available.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-md space-y-4">
              <button
                onClick={handleShare}
                disabled={isSharing || !drawingData}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Preparing to Share...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share Your Creation</span>
                  </>
                )}
              </button>

              <SubmissionForm
                drawingData={drawingData}
                user={user}
                onShowLogin={() => setShowLoginModal(true)}
                onSubmitSuccess={handleSubmitSuccess}
                onSubmitError={handleSubmitError}
                getCompositeImage={getComposite}
                puzzleDate={dailyChallenge.date}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Submission Successful!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Your artwork has been submitted for review. Once approved by our team, it will appear in the public gallery!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreateAnother}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Create Another
              </button>
              <Link
                href="/gallery"
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium inline-block"
                onClick={() => document.body.style.overflow = 'unset'}
              >
                View Gallery
              </Link>
              <Link
                href="/"
                className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block"
                onClick={() => document.body.style.overflow = 'unset'}
              >
                Back to Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
