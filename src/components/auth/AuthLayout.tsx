"use client";

import React from 'react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
      
      {/* Theme Toggle and Back Button */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl font-bold text-white">T3</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Techpreneur 3.0 Summit
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Innovation Challenge
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          
          {children}
        </div>

        {/* Back to Landing Page Button */}
        <div className="mt-6">
          <Link 
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <Home className="h-4 w-4" />
            Back to Landing Page
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Axios EDIC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};