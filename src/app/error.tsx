'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleButton } from '@/components/ui/simple-button'
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard'
import { AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SimpleCard className="w-full max-w-md">
        <SimpleCardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <SimpleCardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Something went wrong!
          </SimpleCardTitle>
          <SimpleCardDescription>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </SimpleCardDescription>
        </SimpleCardHeader>
        <SimpleCardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Error details:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <SimpleButton onClick={reset} className="w-full">
              Try again
            </SimpleButton>
            <SimpleButton 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go home
            </SimpleButton>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  )
}
