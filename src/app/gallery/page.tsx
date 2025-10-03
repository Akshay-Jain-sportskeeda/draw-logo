'use client';

import React, { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

interface Submission {
  id: string;
  drawingUrl: string;
  userName: string;
  timestamp: number;
  status: string;
  rating: number | null;
  gameMode: string;
}

export default function GalleryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'creative-remix'>('all');

  useEffect(() => {
    const submissionsRef = ref(database, 'nfl-draw-logo');

    const unsubscribe = onValue(submissionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const submissionsArray: Submission[] = Object.entries(data)
          .map(([id, value]: [string, any]) => ({
            id,
            drawingUrl: value.drawingUrl || '',
            userName: value.userName || 'Anonymous',
            timestamp: value.timestamp || Date.now(),
            status: value.status || 'pending',
            rating: value.rating,
            gameMode: value.gameMode || 'creative-remix'
          }))
          .filter(sub => sub.status === 'approved');

        submissionsArray.sort((a, b) => {
          if (a.rating && b.rating) {
            return b.rating - a.rating;
          }
          if (a.rating) return -1;
          if (b.rating) return 1;
          return b.timestamp - a.timestamp;
        });

        setSubmissions(submissionsArray);
      } else {
        setSubmissions([]);
      }
      setIsLoading(false);
    });

  const filteredSubmissions = filterMode === 'all'
    ? submissions
    : submissions.filter(sub => sub.gameMode === filterMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8 lg:block hidden">
          <Link href="/" className="inline-block mb-4 text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Menu
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Community Gallery
          </h1>
          <p className="text-lg text-gray-600">
            Amazing artwork from our talented community!
          </p>
        </div>

        <div className="text-center mb-8 lg:hidden block">
          <Link href="/" className="inline-block mb-4 text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Menu
          </Link>
          <p className="text-lg text-gray-600">
            Amazing artwork from our talented community!
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All Submissions
          </button>
          <button
            onClick={() => setFilterMode('creative-remix')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filterMode === 'creative-remix'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Creative Remix
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading gallery...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No approved submissions yet</p>
            <p className="text-gray-400 mt-2">Be the first to submit your artwork!</p>
            <Link href="/creative-remix" className="inline-block mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
              Create Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredSubmissions.map((submission) => (
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
                  {submission.rating && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {submission.rating}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-800">{submission.userName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(submission.timestamp).toLocaleDateString()}
                  </p>
                </div>
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
                    <h2 className="text-2xl font-bold text-gray-800">{selectedSubmission.userName}</h2>
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
