"use client";

import { useState, useEffect } from 'react';
import { VotingComponent } from '@/components/voting/VotingComponent';
import { useAuth } from '@/context/AuthContext';
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { AlertCircle, Users, Timer, Trophy } from 'lucide-react';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';

export default function VotingPage() {
  const { user, team, isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading voting system...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <SimpleCard className="max-w-md w-full mx-4">
          <SimpleCardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <SimpleCardTitle>Authentication Required</SimpleCardTitle>
            <SimpleCardDescription>
              You need to be signed in with a team account to participate in voting.
            </SimpleCardDescription>
          </SimpleCardHeader>
          <SimpleCardContent className="text-center">
            <div className="space-y-4">
              <a
                href="/auth/signin"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In to Team
              </a>
              <a
                href="/auth/signup"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
              >
                Create Team Account
              </a>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Round 2: Team Voting
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pitch presentations and peer evaluation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{team.name}</span>
              </div>
              <a
                href="/dashboard"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SimpleAlert className="mb-6">
            <Timer className="h-4 w-4" />
            <SimpleAlertDescription>
              <strong>Voting Rules:</strong> Each team presents for 90 seconds, followed by 30 seconds of voting. 
              You have a maximum of 3 downvotes and unlimited upvotes. You cannot vote for your own team.
            </SimpleAlertDescription>
          </SimpleAlert>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <SimpleCard>
              <SimpleCardHeader className="text-center pb-2">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <SimpleCardTitle className="text-lg">Your Team</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="text-center">
                <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                  {team.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {team.members.length} members
                </p>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardHeader className="text-center pb-2">
                <Timer className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <SimpleCardTitle className="text-lg">Phase Duration</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="text-center">
                <p className="font-semibold text-green-600 dark:text-green-400">
                  90s Pitch + 30s Vote
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Per team presentation
                </p>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardHeader className="text-center pb-2">
                <Trophy className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <SimpleCardTitle className="text-lg">Voting Power</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="text-center">
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  3 Downvotes Max
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unlimited upvotes
                </p>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>

        {/* Voting Component */}
        <VotingComponent teamId={team.id} teamName={team.name} />
      </main>
    </div>
  );
}
