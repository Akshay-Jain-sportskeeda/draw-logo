'use client';

import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { storage, firestore } from '@/lib/firebase';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { generateDateBasedStoragePath } from '@/utils/dateHelpers';

interface SubmissionFormProps {
  drawingData: string;
  user: FirebaseUser | null;
  onShowLogin: () => void;
  onSubmitSuccess: (submissionId: string) => void;
  onSubmitError: (error: string) => void;
  getCompositeImage?: (() => string) | null;
  puzzleDate?: string;
}

export default function SubmissionForm({ drawingData, user, onShowLogin, onSubmitSuccess, onSubmitError, getCompositeImage, puzzleDate }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateSubmission = (): boolean => {
    console.log('--- Validating Submission ---');
    console.log('drawingData present:', !!drawingData && drawingData !== '');
    console.log('User logged in:', !!user);

    if (!drawingData || drawingData === '') {
      setValidationError('Please create a drawing before submitting');
      console.log('Validation failed: No drawing data.');
      return false;
    }

    if (!user) {
      setValidationError('Please log in to submit your drawing');
      console.log('Validation failed: User not logged in.');
      return false;
    }

    setValidationError('');
    console.log('Validation successful.');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called.');

    if (!validateSubmission()) {
      console.log('handleSubmit: Validation failed, returning early.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    console.log('handleSubmit: Starting submission process.');

    try {
      // Get the user's display name or email as fallback
      const userName = user!.displayName || user!.email?.split('@')[0] || 'Anonymous';
      console.log('User Name for submission:', userName);

      // Use composite image if available, otherwise fallback to drawing data
      let imageToUpload = drawingData;
      if (getCompositeImage) {
        console.log('=== Generating composite image for submission ===');
        const composite = getCompositeImage();
        if (composite && composite.length > 100) {
          imageToUpload = composite;
          console.log('Using composite image for upload (size:', composite.length, 'bytes)');
        } else {
          console.warn('Composite image generation returned empty or invalid, using drawing data');
          console.warn('This may indicate the template was not properly loaded');
        }
      } else {
        console.log('No composite generator available, using drawing data only');
        console.warn('Template may not be included in submission');
      }

      // Create a unique filename for the drawing using date-based folder structure
      const timestamp = Date.now();
      const fileName = generateDateBasedStoragePath(user!.uid, timestamp, puzzleDate);
      console.log('Attempting to upload with fileName:', fileName);
      console.log('Using puzzleDate for storage path:', puzzleDate);

      // Upload the drawing to Firebase Storage
      const imageRef = storageRef(storage, fileName);
      console.log('Starting Firebase Storage upload...');

      await uploadString(imageRef, imageToUpload, 'data_url');
      console.log('Upload successful for fileName:', fileName);

      // Get the public download URL
      const publicUrl = await getDownloadURL(imageRef);
      console.log('Generated public URL:', publicUrl);

      // Save submission data to Firestore
      const submissionsRef = collection(firestore, 'nfl-draw-logo');

      const submissionData = {
        drawingUrl: publicUrl,
        userName: userName,
        userId: user!.uid,
        userEmail: user!.email,
        timestamp: Date.now(),
        status: 'pending',
        rating: null,
        gameMode: 'creative-remix',
        adminNotes: '',
        puzzleDate: puzzleDate || '',
        votes: 0
      };
      console.log('Attempting to save submission data to Firestore:', submissionData);

      const docRef = await addDoc(submissionsRef, submissionData);
      console.log('Firestore document added with ID:', docRef.id);

      // Get the generated document ID as submission ID
      const submissionId = docRef.id;
      
      if (submissionId) {
        onSubmitSuccess(submissionId);
        console.log('Submission successful, calling onSubmitSuccess.');
      } else {
        throw new Error('Failed to generate submission ID');
      }

    } catch (error) {
      console.error('Submission error caught:', error);
      console.error('Submission error:', error);
      let errorMessage = 'Failed to submit drawing. Please try again.';
      
      if (error instanceof Error) {
        // Handle specific Firebase errors
        if (error.message.includes('storage/unauthorized')) {
          errorMessage = 'You do not have permission to upload files. Please contact support.';
        } else if (error.message.includes('database/permission-denied')) {
          errorMessage = 'You do not have permission to save submissions. Please contact support.';
        } else if (error.message.includes('storage/quota-exceeded')) {
          errorMessage = 'Storage quota exceeded. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      onSubmitError(errorMessage);
      setValidationError(errorMessage);
      console.error('Final error message:', errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log('handleSubmit: Submission process finished (finally block).');
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