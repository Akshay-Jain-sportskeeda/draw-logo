'use client';

import React, { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { useVotes } from '@/lib/useVotes';
import { getTodayDateString } from '@/utils/dateHelpers';

interface Submission {
  id: string;
  drawingUrl: string;
  userName: string;
  userId?: string;
  timestamp: number;
  status: string;
  rating: number | null;
  gameMode: string;
  votes?: number;
  puzzleDate?: string;
}

export default function GalleryPage() {
  const { user } = useAuth();
  const { setShowLoginModal } = useAuthModal();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [showMySubmissions, setShowMySubmissions] = useState(false);

  const submissionIds = submissions.map(s => s.id);
  const { toggleVote, getVoteCount, hasUserVoted, initializeVote } = useVotes(user, submissionIds);

  useEffect(() => {
    const submissionsRef = collection(firestore, 'nfl-draw-logo');
    const q = query(submissionsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissionsArray: Submission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.gameMode === 'creative-remix') {
          submissionsArray.push({
            id: doc.id,
            drawingUrl: data.drawingUrl || '',
            userName: data.userName || 'Anonymous',
            userId: data.userId,
            timestamp: data.timestamp || Date.now(),
            status: data.status || 'pending',
            rating: data.rating,
            gameMode: data.gameMode || 'creative-remix',
            votes: data.votes || 0,
            puzzleDate: data.puzzleDate || ''
          });
        }
      });

      submissionsArray.sort((a, b) => b.timestamp - a.timestamp);
      setAllSubmissions(submissionsArray);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching submissions:', error);
      setAllSubmissions([]);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let filtered = allSubmissions;

    filtered = filtered.filter(submission => {
      return submission.puzzleDate === selectedDate;
    });

    if (showMySubmissions && user) {
      filtered = filtered.filter(submission => submission.userId === user.uid);
    }

    setSubmissions(filtered);
  }, [allSubmissions, selectedDate, showMySubmissions, user]);

  useEffect(() => {
    submissions.forEach(submission => {
      initializeVote(submission.id, submission.votes || 0);
    });
  }, [submissions, initializeVote]);

  const handleVoteClick = async (submissionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const result = await toggleVote(submissionId);
    if (!result.success && result.error) {
      console.error('Vote error:', result.error);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const newDate = `${year}-${month}-${day}`;
    const today = getTodayDateString();
    const earliestDate = '2025-09-13';

    if (newDate <= today && newDate >= earliestDate) {
      setSelectedDate(newDate);
    }
  };

  const canGoPrev = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const year = prevDate.getFullYear();
    const month = String(prevDate.getMonth() + 1).padStart(2, '0');
    const day = String(prevDate.getDate()).padStart(2, '0');
    const prevDateStr = `${year}-${month}-${day}`;
    const earliestDate = '2025-09-13';
    return prevDateStr >= earliestDate;
  };

  const canGoNext = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const nextDateStr = `${year}-${month}-${day}`;
    const today = getTodayDateString();
    return nextDateStr <= today;
  };

  const handleShare = async (submission: Submission) => {
    try {
      const shareText = `Check out my drawing in the NFL Logo Gallery!`;
      const shareUrl = window.location.href;

      const copyImageToClipboard = async () => {
        if (navigator.clipboard && (navigator.clipboard as any).write) {
          try {
            const blob = await fetch(submission.drawingUrl).then(r => r.blob());
            await (navigator.clipboard as any).write([
              new (window as any).ClipboardItem({
                'image/png': blob
              })
            ]);
            alert('Image copied to clipboard!');
            return true;
          } catch (error) {
            console.error('Error copying image to clipboard:', error);
            return false;
          }
        }
        return false;
      };

      if (navigator.share) {
        try {
          const blob = await fetch(submission.drawingUrl).then(r => r.blob());
          const file = new File([blob], 'my-nfl-logo-drawing.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My NFL Logo Drawing',
              text: shareText,
              files: [file]
            });
            return;
          }

          await navigator.share({
            title: 'My NFL Logo Drawing',
            text: shareText,
            url: shareUrl
          });
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            return;
          }
          const imageCopied = await copyImageToClipboard();
          if (!imageCopied) {
            await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            alert('Link copied to clipboard!');
          }
        }
      } else {
        const imageCopied = await copyImageToClipboard();
        if (!imageCopied && navigator.clipboard) {
          const textToShare = `${shareText}\n${shareUrl}`;
          await navigator.clipboard.writeText(textToShare);
          alert('Link copied to clipboard!');
        } else if (!imageCopied) {
          alert('Sharing is not supported on this device');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-[576px]">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-center relative mb-2">
            <Link href="/" className="absolute left-0 text-blue-600 hover:text-blue-700 font-medium text-sm">
              ← Back
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Gallery
            </h1>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Amazing artwork from our talented community!
          </p>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDateChange('prev')}
                disabled={!canGoPrev()}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-full transition-all duration-200 hover:scale-110"
                aria-label="Previous day"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
              </button>

              <h3 className="text-lg font-semibold text-gray-800 whitespace-nowrap">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>

              <button
                onClick={() => handleDateChange('next')}
                disabled={!canGoNext()}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-full transition-all duration-200 hover:scale-110"
                aria-label="Next day"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                } else {
                  setShowMySubmissions(!showMySubmissions);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                showMySubmissions
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
              }`}
            >
              {showMySubmissions ? 'All Logos' : 'My Logos'}
            </button>
          </div>
        </div>


        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading gallery...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            {showMySubmissions ? (
              <>
                <p className="text-gray-500 text-lg">No submissions found</p>
                <p className="text-gray-400 mt-2">
                  You haven't submitted any artwork on {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <Link href="/creative-remix" className="inline-block mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
                  Create Now
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg">No submissions for this date</p>
                <p className="text-gray-400 mt-2">
                  No artwork submitted on {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <Link href="/creative-remix" className="inline-block mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
                  Create Now
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={submission.drawingUrl}
                    alt={`Artwork by ${submission.userName}`}
                    className="w-full h-full object-contain"
                  />
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    submission.status === 'approved' ? 'bg-green-500 text-white' :
                    submission.status === 'rejected' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {submission.status}
                  </div>
                  {submission.rating && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {submission.rating}
                    </div>
                  )}
                  <button
                    onClick={(e) => handleVoteClick(submission.id, e)}
                    className="absolute top-2 right-2 px-3 py-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all hover:scale-110 group flex items-center gap-1.5"
                    title={user ? (hasUserVoted(submission.id) ? 'Remove vote' : 'Vote for this') : 'Log in to vote'}
                  >
                    <img
                      src="/flame-flat-style.svg"
                      alt="Vote"
                      className={`w-5 h-5 transition-all ${
                        hasUserVoted(submission.id)
                          ? 'opacity-100 scale-110'
                          : 'opacity-60 group-hover:opacity-80 group-hover:scale-105'
                      }`}
                    />
                    <span className="text-sm font-semibold text-gray-700">{getVoteCount(submission.id)}</span>
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-800">
                    {submission.userName}
                    {user && submission.userId === user.uid && (
                      <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(submission.timestamp).toLocaleDateString()}
                  </p>
                </div>
                {user && submission.userId === user.uid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(submission);
                    }}
                    className="absolute bottom-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all hover:scale-110"
                    title="Share drawing"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedSubmission.userName}
                      {user && selectedSubmission.userId === user.uid && (
                        <span className="ml-2 text-sm text-blue-600 font-medium">(You)</span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(selectedSubmission.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="relative mb-4">
                  <img
                    src={selectedSubmission.drawingUrl}
                    alt={`Artwork by ${selectedSubmission.userName}`}
                    className="w-full rounded-lg border-2 border-gray-200"
                  />
                  {selectedSubmission.rating && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                      {selectedSubmission.rating}/100
                    </div>
                  )}
                  <button
                    onClick={(e) => handleVoteClick(selectedSubmission.id, e)}
                    className="absolute top-4 right-4 px-4 py-3 rounded-full bg-white shadow-lg transition-all hover:scale-110 group flex items-center gap-2"
                    title={user ? (hasUserVoted(selectedSubmission.id) ? 'Remove vote' : 'Vote for this') : 'Log in to vote'}
                  >
                    <img
                      src="/flame-flat-style.svg"
                      alt="Vote"
                      className={`w-6 h-6 transition-all ${
                        hasUserVoted(selectedSubmission.id)
                          ? 'opacity-100 scale-110'
                          : 'opacity-60 group-hover:opacity-80 group-hover:scale-105'
                      }`}
                    />
                    <span className="text-lg font-bold text-gray-700">{getVoteCount(selectedSubmission.id)}</span>
                  </button>
                </div>

                <div className="flex gap-4 justify-center">
                  <a
                    href={selectedSubmission.drawingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    View Full Size
                  </a>
                  {user && selectedSubmission.userId === user.uid && (
                    <button
                      onClick={() => handleShare(selectedSubmission)}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
