"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Users, Trophy, Clock, Shield, HelpCircle, Vote, BarChart3 } from 'lucide-react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, team, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Simulate team status - in real app this would come from API/context
  const getTeamStatus = () => {
    // This would be dynamic based on actual contest results
    const currentRound = 1; // This would come from contest state
    const teamResults = {
      round1Completed: true,
      round1Qualified: true, // Change this to false to test "not qualified" state
      round2Completed: false,
      round2Qualified: false,
      finalRank: null, // This would be set after all rounds complete
      finalScore: null
    };

    if (teamResults.finalRank !== null) {
      // Contest completed - show final results
      return {
        status: `#${teamResults.finalRank} Place`,
        description: `Final Score: ${teamResults.finalScore}`,
        color: teamResults.finalRank <= 3 ? "text-green-600" : "text-blue-600"
      };
    } else if (teamResults.round1Completed && currentRound === 1) {
      // Round 1 completed, show qualification status
      if (teamResults.round1Qualified) {
        return {
          status: "Qualified ✨",
          description: "Good luck in next round!",
          color: "text-green-600"
        };
      } else {
        return {
          status: "Not Qualified",
          description: "Better luck next time!",
          color: "text-red-600"
        };
      }
    } else {
      // Default ready state
      return {
        status: "Ready",
        description: "Current status",
        color: "text-blue-600"
      };
    }
  };

  const getCurrentRoundInfo = () => {
    // This would be dynamic based on actual contest state
    const teamResults = {
      round1Completed: true,
      round1Qualified: true,
      round2Completed: false,
      round2Qualified: false,
      contestCompleted: false
    };

    if (teamResults.contestCompleted) {
      return {
        round: "Contest Complete",
        phase: "Final Results"
      };
    } else if (teamResults.round1Completed && teamResults.round1Qualified) {
      return {
        round: "Round 2",
        phase: "Voting Phase"
      };
    } else if (teamResults.round1Completed && !teamResults.round1Qualified) {
      return {
        round: "Eliminated",
        phase: "Thank you for participating"
      };
    } else {
      return {
        round: "Round 1",
        phase: "Quiz Phase"
      };
    }
  };

  const teamStatus = getTeamStatus();
  const roundInfo = getCurrentRoundInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !team) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <span className="text-sm font-bold text-white">AX</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Axios EDIC Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Welcome, {user.name}
              </span>
              <ThemeToggle />
              <SimpleButton variant="outline" onClick={handleSignOut}>
                Sign Out
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user.name}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your team today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SimpleCard>
              <SimpleCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <SimpleCardTitle className="text-sm font-medium">Team</SimpleCardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="text-2xl font-bold">{team.name}</div>
                <p className="text-xs text-muted-foreground">
                  {team.members.length} members
                </p>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <SimpleCardTitle className="text-sm font-medium">Role</SimpleCardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="text-2xl font-bold">
                  {user.isLeader ? 'Leader' : 'Member'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Team position
                </p>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <SimpleCardTitle className="text-sm font-medium">Current Round</SimpleCardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="text-2xl font-bold">{roundInfo.round}</div>
                <p className="text-xs text-muted-foreground">
                  {roundInfo.phase}
                </p>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <SimpleCardTitle className="text-sm font-medium">Status</SimpleCardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className={`text-2xl font-bold ${teamStatus.color}`}>
                  {teamStatus.status}
                </div>
                <p className="text-xs text-muted-foreground">
                  {teamStatus.description}
                </p>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Team Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>Team Information</SimpleCardTitle>
                <SimpleCardDescription>
                  Details about your team and members
                </SimpleCardDescription>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Team Members
                    </h4>
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {member.name}
                          </span>
                          <div className="flex space-x-2">
                            {member.id === team.leader.id && (
                              <Badge variant="secondary">Leader</Badge>
                            )}
                            {member.id === user.id && (
                              <Badge variant="outline">You</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Team Created
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Contest Progress
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Round 1 (Quiz)</span>
                        <span className={`text-sm font-medium ${teamStatus.color}`}>
                          {teamStatus.status.includes('Qualified') ? '✓ Qualified' : 
                           teamStatus.status.includes('Not Qualified') ? '✗ Not Qualified' : 
                           'In Progress'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Round 2 (Voting)</span>
                        <span className="text-sm text-gray-500">
                          {teamStatus.status.includes('Qualified') ? 'Available' : 'Locked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Round 3 (Results)</span>
                        <span className="text-sm text-gray-500">Locked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>Contest Rounds</SimpleCardTitle>
                <SimpleCardDescription>
                  Navigate to different contest rounds
                </SimpleCardDescription>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <Link href="/quiz" className="block">
                    <SimpleButton className="w-full justify-start" variant="outline">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Round 1 - Quiz
                    </SimpleButton>
                  </Link>
                  <Link href="/voting" className="block">
                    <SimpleButton className="w-full justify-start" variant="outline">
                      <Vote className="mr-2 h-4 w-4" />
                      Round 2 - Voting
                    </SimpleButton>
                  </Link>
                  <Link href="/results" className="block">
                    <SimpleButton className="w-full justify-start" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Round 3 - Results
                    </SimpleButton>
                  </Link>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
