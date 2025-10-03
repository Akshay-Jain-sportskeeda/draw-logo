'use client';

import React, { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface Submission {
  id: string;
  drawingUrl: string;
  userName: string;
  userId?: string;
  userEmail?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  rating: number | null;
  gameMode: string;
  adminNotes: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editRating, setEditRating] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const submissionsRef = collection(firestore, 'nfl-draw-logo');
    const q = query(submissionsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissionsArray: Submission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        submissionsArray.push({
          id: doc.id,
          drawingUrl: data.drawingUrl || '',
          userName: data.userName || 'Anonymous',
          userId: data.userId,
          userEmail: data.userEmail,
          timestamp: data.timestamp || Date.now(),
          status: data.status || 'pending',
          rating: data.rating,
          gameMode: data.gameMode || 'creative-remix',
          adminNotes: data.adminNotes || ''
        });
      });
      setSubmissions(submissionsArray);
    }, (error) => {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'your_secure_admin_password_here') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const handleUpdateSubmission = async (id: string, updates: Partial<Submission>) => {
    setIsUpdating(true);
    try {
      const submissionRef = doc(firestore, 'nfl-draw-logo', id);
      await updateDoc(submissionRef, updates);
      setSelectedSubmission(null);
      setEditRating(null);
      setEditNotes('');
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission');
    } finally {
      setIsUpdating(false);
    }
  };

  const openSubmissionDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditRating(submission.rating);
    setEditNotes(submission.adminNotes);
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = searchTerm === '' ||
      sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Admin Access
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pending ({submissions.filter(s => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Approved ({submissions.filter(s => s.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rejected ({submissions.filter(s => s.status === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => openSubmissionDetail(submission)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
            >
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={submission.drawingUrl}
                  alt={`Submission by ${submission.userName}`}
                  className="w-full h-full object-contain"
                />
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  submission.status === 'approved' ? 'bg-green-500 text-white' :
                  submission.status === 'rejected' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {submission.status}
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-800">{submission.userName}</p>
                <p className="text-sm text-gray-600">{submission.gameMode}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(submission.timestamp).toLocaleDateString()}
                </p>
                {submission.rating && (
                  <p className="text-sm font-semibold text-blue-600 mt-2">
                    Rating: {submission.rating}/100
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No submissions found</p>
          </div>
        )}

        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedSubmission(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Submission Details</h2>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedSubmission.drawingUrl}
                      alt={`Submission by ${selectedSubmission.userName}`}
                      className="w-full rounded-lg border-2 border-gray-200"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                      <p className="text-gray-800">{selectedSubmission.userName}</p>
                      {selectedSubmission.userEmail && (
                        <p className="text-xs text-gray-500">{selectedSubmission.userEmail}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submission ID</label>
                      <p className="text-xs font-mono text-gray-600">{selectedSubmission.id}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Game Mode</label>
                      <p className="text-gray-800">{selectedSubmission.gameMode}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                      <p className="text-gray-800">{new Date(selectedSubmission.timestamp).toLocaleString()}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                      <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedSubmission.status === 'approved' ? 'bg-green-500 text-white' :
                        selectedSubmission.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {selectedSubmission.status}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                        Rating (0-100)
                      </label>
                      <input
                        type="number"
                        id="rating"
                        min="0"
                        max="100"
                        value={editRating || ''}
                        onChange={(e) => setEditRating(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateSubmission(selectedSubmission.id, {
                          status: 'approved',
                          rating: editRating,
                          adminNotes: editNotes
                        })}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateSubmission(selectedSubmission.id, {
                          status: 'rejected',
                          rating: editRating,
                          adminNotes: editNotes
                        })}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>

                    <button
                      onClick={() => handleUpdateSubmission(selectedSubmission.id, {
                        rating: editRating,
                        adminNotes: editNotes
                      })}
                      disabled={isUpdating}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
