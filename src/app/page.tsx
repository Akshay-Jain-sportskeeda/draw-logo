'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Choose Game Mode
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Link href="/draw-memory">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-blue-400">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Draw from Memory
                </h2>
                <p className="text-blue-700">
                  Draw NFL team logos from memory and get scored on accuracy!
                </p>
              </div>
            </div>
          </Link>

          <Link href="/creative-remix">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-green-400">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Creative Remix
                </h2>
                <p className="text-green-700">
                  Add your artistic flair to templates and submit to our gallery!
                </p>
              </div>
            </div>
          </Link>

          <Link href="/gallery">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-purple-400">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  View Gallery
                </h2>
                <p className="text-purple-700">
                  Browse amazing artwork from our talented community!
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
