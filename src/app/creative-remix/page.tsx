'use client';

import React, { useState } from 'react';
import DrawingCanvas from '@/components/DrawingCanvas';
import SubmissionForm from '@/components/SubmissionForm';
import Link from 'next/link';
import { getDefaultTemplate } from '@/lib/templates';
import { useAuth } from '@/lib/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';

export default function CreativeRemixPage() {
  const [drawingData, setDrawingData] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');

  const { user } = useAuth();
  const { setShowLoginModal } = useAuthModal();

  const template = getDefaultTemplate();

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

  const handleDrawingChange = (dataUrl: string) => {
    setDrawingData(dataUrl);
  };

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

        <div className="text-center mb-8 lg:hidden block">
          <Link href="/" className="inline-block mb-4 text-green-600 hover:text-green-700 font-medium">
            ← Back to Menu
          </Link>
          <p className="text-lg text-gray-600">
            Add your unique style to the template and submit your masterpiece!
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
              {template.name}
            </h2>
            <p className="text-gray-600 text-center">
              {template.description}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-8">
            <div className="w-full flex flex-col items-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">
                Your Creative Remix
              </h3>
              <DrawingCanvas
                onDrawingChange={handleDrawingChange}
                availableColors={defaultColors}
                permanentTemplate={true}
                templateImageUrl={template.imageUrl}
              />
            </div>

            <div className="w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">
                Submit Your Artwork
              </h3>
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
