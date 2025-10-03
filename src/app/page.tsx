'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 lg:block hidden">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            NFL Logo Drawing Games
          </h1>
          <p className="text-xl text-gray-600">
            Choose your challenge and unleash your creativity!
          </p>
        </div>

        <div className="text-center mb-8 lg:hidden block">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Choose Game Mode
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
        </div>

        <div className="text-center mt-12">
          <Link href="/gallery" className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
            View Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
