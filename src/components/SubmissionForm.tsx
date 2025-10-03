'use client';

import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';

interface SubmissionFormProps {
  drawingData: string;
  user: FirebaseUser | null;
  onShowLogin: () => void;
  onSubmitSuccess: (submissionId: string) => void;
  onSubmitError: (error: string) => void;
}

export default function SubmissionForm({ drawingData, user, onShowLogin, onSubmitSuccess, onSubmitError }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateSubmission = (): boolean => {
    if (!drawingData || drawingData === '') {
      setValidationError('Please create a drawing before submitting');
      return false;
    }

    if (!user) {
      setValidationError('Please log in to submit your drawing');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSubmission()) {
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      // Get the user's ID token for authentication
      const idToken = await user!.getIdToken();
      
      // Get the user's display name or email as fallback
      const userName = user!.displayName || user!.email?.split('@')[0] || 'Anonymous';

      const response = await fetch('/api/submit-creative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          drawingData,
          userName,
          gameMode: 'creative-remix'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit drawing');
      }

      const result = await response.json();
      onSubmitSuccess(result.submissionId);
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit drawing. Please try again.';
      onSubmitError(errorMessage);
      setValidationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">
            Please log in to submit your artwork to the gallery
          </p>
          <button
            onClick={onShowLogin}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Login to Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Submitting as:</strong> {user.displayName || user.email?.split('@')[0] || 'Anonymous'}
        </p>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          By submitting, you agree that your artwork may be displayed in our public gallery after admin review.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit to Gallery'}
      </button>
    </form>
  );
}
