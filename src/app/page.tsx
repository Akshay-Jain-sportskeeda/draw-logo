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
          <p className="text-lg text-gray-600">
            Choose your challenge and unleash your creativity!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link href="/draw-memory">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-blue-400">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Draw from Memory
                </h2>
                <p className="text-gray-600 mb-6">
                  Test your memory! Draw NFL team logos from scratch and see how accurately you can recreate them. Get scored on your accuracy!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Challenge
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Scoring
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Memory Test
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/creative-remix">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-green-400">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Creative Remix
                </h2>
                <p className="text-gray-600 mb-6">
                  Unleash your creativity! Start with a template and add your own artistic flair. Submit your masterpiece to our community gallery!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Creative
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Community
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Gallery
                  </span>
                </div>
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
