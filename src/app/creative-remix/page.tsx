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
  const [submissionId, setSubmissionId] = useState<string>('');
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);

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

  const handleSubmitSuccess = (id: string) => {
    setSubmissionId(id);
    setSubmitted(true);
  };

  const handleSubmitError = (error: string) => {
    alert(error);
  };

  const handleCreateAnother = () => {
    setSubmitted(false);
    setSubmissionId('');
    setDrawingData('');
  };

  const handleRefreshChallenge = () => {
    // Refresh the page to get the daily challenge again
    window.location.reload();
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Submission Successful!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Your artwork has been submitted for review. Once approved by our team, it will appear in the public gallery!
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <p className="text-sm text-gray-500 mb-1">Submission ID</p>
              <p className="font-mono text-gray-800">{submissionId}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreateAnother}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Create Another
              </button>
              <Link href="/" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block">
                Back to Menu
              </Link>
              <Link href="/gallery" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium inline-block">
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8 lg:block hidden">
          <Link href="/" className="inline-block mb-4 text-green-600 hover:text-green-700 font-medium">
            ← Back to Menu
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Creative Remix
          </h1>
          <p className="text-lg text-gray-600">
            Add your unique style to the template and submit your masterpiece!
          </p>
        </div>


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
                <>
                  <DrawingCanvas
                    key={dailyChallenge.freeDrawChallenge.imageUrl}
                    onDrawingChange={handleDrawingChange}
                    availableColors={defaultColors}
                    permanentTemplate={true}
                    templateImageUrl={dailyChallenge.freeDrawChallenge.imageUrl}
                  />
                </>
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

            <div className="w-full max-w-md">
              <SubmissionForm
                drawingData={drawingData}
                user={user}
                onShowLogin={() => setShowLoginModal(true)}
                onSubmitSuccess={handleSubmitSuccess}
                onSubmitError={handleSubmitError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
