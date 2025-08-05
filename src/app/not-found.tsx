"use client";

import Link from 'next/link'
import { SimpleButton } from '@/components/ui/simple-button'
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard'
import { Search, Home, ArrowLeft, Trophy, Users } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <span className="text-2xl font-bold text-white">AX</span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Oops! The page you&apos;re looking for seems to have wandered off the contest platform.
          </p>
        </div>

        {/* Main Card */}
        <SimpleCard className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <SimpleCardHeader className="text-center pb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <Search className="h-10 w-10 text-gray-600 dark:text-gray-400" />
            </div>
            <SimpleCardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Let&apos;s get you back on track
            </SimpleCardTitle>
            <SimpleCardDescription className="text-base">
              This might have happened because the page was moved, deleted, or you entered an incorrect URL.
            </SimpleCardDescription>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/" className="w-full">
                <SimpleButton className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Homepage
                </SimpleButton>
              </Link>
              <SimpleButton 
                variant="outline" 
                onClick={() => window.history.back()} 
                className="w-full h-12 border-gray-300 dark:border-gray-600"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </SimpleButton>
            </div>

            {/* Quick Links */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
                Quick Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link href="/dashboard" className="w-full">
                  <SimpleButton variant="outline" className="w-full justify-start">
                    <Trophy className="mr-2 h-4 w-4" />
                    Dashboard
                  </SimpleButton>
                </Link>
                <Link href="/auth/signin" className="w-full">
                  <SimpleButton variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Sign In
                  </SimpleButton>
                </Link>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Still having trouble? Contact support or try refreshing the page.
              </p>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 Axios EDIC Contest Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
