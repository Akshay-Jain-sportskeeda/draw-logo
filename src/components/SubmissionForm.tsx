'use client';

import React, { useState } from 'react';

interface SubmissionFormProps {
  drawingData: string;
  onSubmitSuccess: (submissionId: string) => void;
  onSubmitError: (error: string) => void;
}

export default function SubmissionForm({ drawingData, onSubmitSuccess, onSubmitError }: SubmissionFormProps) {
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateSubmission = (): boolean => {
    if (!drawingData || drawingData === '') {
      setValidationError('Please create a drawing before submitting');
      return false;
    }

    if (userName.length > 50) {
      setValidationError('Name must be 50 characters or less');
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
      const response = await fetch('/api/submit-creative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drawingData,
          userName: userName.trim() || 'Anonymous',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
          Your Name (Optional)
        </label>
        <input
          type="text"
          id="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          maxLength={50}
          placeholder="Anonymous"
          disabled={isSubmitting}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          {userName.length}/50 characters
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
