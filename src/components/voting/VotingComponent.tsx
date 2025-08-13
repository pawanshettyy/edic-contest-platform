"use client";

import { useState, useEffect, useCallback } from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { Timer, Users, ArrowUp, ArrowDown, Clock, Trophy, PlayCircle, PauseCircle, Shield, Vote, Home } from 'lucide-react';
import { VotingSession, VotingPhase, VoteType } from '@/types/voting-enhanced';
import { useAuth } from '@/context/AuthContext';

interface VotingComponentProps {
  teamId?: string;
  teamName?: string;
}

interface FinalResult {
  teamId: string;
  teamName: string;
  upvotes: number;
  downvotes: number;
  totalScore: number;
}

export function VotingComponent({ teamId: propTeamId }: VotingComponentProps) {
  const { user, team } = useAuth();
  const [session, setSession] = useState<VotingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [votingCompleted, setVotingCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState<FinalResult[] | null>(null);

  // Use team from auth context or prop
  const teamId = team?.id || propTeamId;

  // Check if user is team leader
  const isTeamLeader = user?.isLeader === true;

  // Fetch voting session status
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/voting?action=status');
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
        // Update timeRemaining from server to sync with actual time
        setTimeRemaining(data.session?.timeRemaining || 0);
        
        // Check if voting is completed
        if (data.session?.phase === 'completed') {
          setVotingCompleted(true);
          // Fetch final results
          const resultsResponse = await fetch('/api/voting?action=results');
          const resultsData = await resultsResponse.json();
          if (resultsData.success) {
            setFinalResults(resultsData.results);
          }
        }
        
        setError(null);
      } else {
        // Check if this is a database setup issue
        if (data.details && data.details.includes('does not exist')) {
          setError('Voting system not set up. Please contact administrator.');
        } else {
          setError(data.error || 'Failed to fetch voting session');
        }
      }
    } catch (err) {
      // Handle network errors gracefully
      const error = err as Error;
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Unable to connect to voting system. Please check your connection.');
      } else {
        console.error('Voting fetch error:', err);
        setError('Voting system temporarily unavailable.');
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cast vote
  const castVote = async (toTeamId: string, voteType: VoteType) => {
    if (voting) return;
    
    setVoting(true);
    try {
      const response = await fetch('/api/voting?action=vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTeamId: teamId,
          toTeamId,
          voteType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh session data
        await fetchSession();
      } else {
        setError(data.error || 'Failed to cast vote');
      }
    } catch (err) {
      setError('Failed to cast vote');
      console.error('Vote error:', err);
    } finally {
      setVoting(false);
    }
  };

  // Update timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          fetchSession(); // Refresh when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchSession]);

  // Initial load and more frequent refresh during active sessions
  useEffect(() => {
    fetchSession();
    // More frequent polling to keep timers in sync
    const interval = setInterval(fetchSession, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchSession]);

  // Check authentication and team leader status
  if (!user || !team) {
    return (
      <SimpleCard className="w-full max-w-2xl mx-auto">
        <SimpleCardHeader>
          <SimpleCardTitle>Authentication Required</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <SimpleAlert variant="destructive">
            <SimpleAlertDescription>
              Please sign in to your team account to access voting.
            </SimpleAlertDescription>
          </SimpleAlert>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  // Allow leaders to vote, but show info for non-leaders
  if (!isTeamLeader) {
    return (
      <SimpleCard className="w-full max-w-2xl mx-auto">
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <span>Team Leader Access Required</span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <SimpleAlert variant="destructive">
            <SimpleAlertDescription>
              <strong>Voting is restricted to team leaders only.</strong>
              <br />
              You are signed in as <strong>{user.name}</strong> from team <strong>{team.name}</strong>.
              <br />
              Current role: <strong>{user.isLeader ? 'Team Leader' : 'Team Member'}</strong>
              <br />
              {!user.isLeader && "Only the team leader can vote for your team. Please ask your team leader to handle voting."}
            </SimpleAlertDescription>
          </SimpleAlert>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseDisplay = (phase: VotingPhase) => {
    switch (phase) {
      case 'waiting':
        return { text: 'Waiting to Start', color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'pitching':
        return { text: 'Team Pitching', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'voting':
        return { text: 'Voting Active', color: 'text-green-600', bg: 'bg-green-100' };
      case 'break':
        return { text: 'Break - Get Ready', color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'completed':
        return { text: 'Completed', color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const canVote = (targetTeamId: string) => {
    if (!session || !session.teams) return false;
    
    const myTeam = session.teams.find(t => t.teamId === teamId);
    const targetTeam = session.teams.find(t => t.teamId === targetTeamId);
    
    if (!myTeam || !targetTeam) return false;
    
    // Cannot vote for own team
    if (targetTeamId === teamId) return false;
    
    // Can only vote during voting phase
    if (session.phase !== 'voting') return false;
    
    // Check if already voted for this team
    const hasVoted = myTeam.votingHistory.some(vote => 
      vote.toTeamId === targetTeamId && vote.sessionId === session.id
    );
    
    return !hasVoted && myTeam.canVote;
  };

  const canDownvote = () => {
    if (!session || !session.teams) return false;
    const myTeam = session.teams.find(t => t.teamId === teamId);
    return myTeam ? myTeam.downvotesUsed < 3 : false;
  };

  const getCurrentPresentingTeam = () => {
    if (!session || !session.teams) return null;
    return session.teams.find(t => t.teamId === session.currentPresentingTeam);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading voting session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SimpleAlert variant="destructive">
        <SimpleAlertDescription>
          <strong>Error:</strong> {error}
          <SimpleButton onClick={fetchSession} className="ml-4" size="sm">
            Retry
          </SimpleButton>
        </SimpleAlertDescription>
      </SimpleAlert>
    );
  }

  if (!session) {
    return (
      <SimpleCard className="w-full max-w-2xl mx-auto">
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5 text-gray-500" />
            <span>Voting Session</span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <SimpleAlert>
            <SimpleAlertDescription>
              Voting is currently disabled. This feature will be available during the contest.
            </SimpleAlertDescription>
          </SimpleAlert>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  const phaseDisplay = getPhaseDisplay(session.phase);
  const currentTeam = getCurrentPresentingTeam();
  const myTeam = session.teams.find(t => t.teamId === teamId);

  // Show completion screen if voting is finished
  if (votingCompleted && finalResults) {
    return (
      <div className="space-y-6">
        {/* Completion Status */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Voting Session Completed!</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-center">
              <div className="mb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">🎉</div>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  All teams have presented and voting has been completed.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Thank you for participating! The results have been saved and voting is now locked.
                </p>
              </div>
              
              {/* Team participation status */}
              {myTeam && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    Your Team: {team?.name}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Votes Cast: {myTeam.votingHistory.length} | 
                    Downvotes Used: {myTeam.downvotesUsed}/3
                  </p>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Final Results */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Final Voting Results</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="space-y-3">
              {finalResults
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((result, index) => (
                  <div key={result.teamId} className={`flex items-center justify-between p-4 border rounded-lg ${
                    index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                    index === 1 ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' :
                    index === 2 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                    'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{result.teamName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.upvotes} upvotes • {result.downvotes} downvotes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {result.totalScore}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">points</div>
                    </div>
                  </div>
                ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Navigation */}
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Voting session is now complete. You can view these results anytime.
              </p>
              <SimpleButton onClick={() => window.location.href = '/dashboard'} className="mr-2">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </SimpleButton>
              <SimpleButton 
                onClick={() => window.location.href = '/results'} 
                variant="outline"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Detailed Results
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Phase Status */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${phaseDisplay.bg} ${phaseDisplay.color}`}>
                {phaseDisplay.text}
              </div>
              {session.phase === 'pitching' && (
                <PlayCircle className="h-5 w-5 text-blue-500" />
              )}
              {session.phase === 'voting' && (
                <Timer className="h-5 w-5 text-green-500" />
              )}
              {session.phase === 'break' && (
                <PauseCircle className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <div className="flex items-center space-x-4">
              {timeRemaining > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-mono text-lg font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          {currentTeam && session.phase !== 'break' && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {session.phase === 'pitching' ? 'Now Presenting:' : 
                 session.phase === 'voting' ? 'Vote for:' : 'Current Team:'}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentTeam.teamName}
              </p>
            </div>
          )}

          {session.phase === 'break' && (
            <div className="text-center">
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                🕐 Break Time - Get Ready!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Take a 2-minute break. Next team will start presenting soon.
              </p>
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ⏰ Use this time to prepare for the next presentation<br/>
                  🎯 Get ready to evaluate and vote<br/>
                  💡 Discuss with your team if needed
                </p>
              </div>
            </div>
          )}
          
          {session.phase === 'waiting' && (
            <p className="text-center text-gray-600 dark:text-gray-400">
              Waiting for the first presentation to begin...
            </p>
          )}
          
          {session.phase === 'completed' && (
            <p className="text-center text-green-600 dark:text-green-400 font-semibold">
              All presentations completed! Check the results below.
            </p>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* Your Team Status */}
      {myTeam && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Your Team Status</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Downvotes Used</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {myTeam.downvotesUsed} / 3
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Votes Cast</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {myTeam.votingHistory.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {myTeam.hasPresented ? 'Presented' : 'Pending'}
                </p>
              </div>
            </div>
            
            {myTeam.downvotesUsed >= 3 && (
              <SimpleAlert className="mt-4">
                <SimpleAlertDescription>
                  You&apos;ve used all 3 downvotes. You can only upvote remaining teams.
                </SimpleAlertDescription>
              </SimpleAlert>
            )}
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Teams and Voting */}
      <div className="grid gap-4">
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Teams & Voting</span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        
        {session.teams
          .sort((a, b) => a.presentationOrder - b.presentationOrder)
          .map((team) => (
            <SimpleCard key={team.teamId} className={team.isCurrentlyPresenting ? 'ring-2 ring-blue-500' : ''}>
              <SimpleCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {team.presentationOrder}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{team.teamName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <ArrowUp className="h-4 w-4 text-green-500" />
                          <span>{team.votesReceived.upvotes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <ArrowDown className="h-4 w-4 text-red-500" />
                          <span>{team.votesReceived.downvotes}</span>
                        </span>
                        <span className="font-semibold">
                          Score: {team.votesReceived.totalScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {team.teamId === teamId ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        Your Team
                      </span>
                    ) : session.phase === 'voting' && canVote(team.teamId) ? (
                      <>
                        <SimpleButton
                          onClick={() => castVote(team.teamId, 'upvote')}
                          disabled={voting}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <ArrowUp className="h-4 w-4 mr-1" />
                          Upvote
                        </SimpleButton>
                        <SimpleButton
                          onClick={() => castVote(team.teamId, 'downvote')}
                          disabled={voting || !canDownvote()}
                          variant="destructive"
                          size="sm"
                        >
                          <ArrowDown className="h-4 w-4 mr-1" />
                          Downvote
                        </SimpleButton>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {session.phase !== 'voting' ? 'Voting not active' : 
                         myTeam?.votingHistory.some(v => v.toTeamId === team.teamId) ? 'Already voted' : 
                         'Cannot vote'}
                      </div>
                    )}
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          ))}
      </div>

      {/* Current Results */}
      {session.phase === 'completed' && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Final Voting Results</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="space-y-2">
              {session.teams
                .sort((a, b) => b.votesReceived.totalScore - a.votesReceived.totalScore)
                .map((team, index) => (
                  <div key={team.teamId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold">{team.teamName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{team.votesReceived.totalScore} pts</div>
                      <div className="text-sm text-gray-600">
                        {team.votesReceived.upvotes}↑ {team.votesReceived.downvotes}↓
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}
    </div>
  );
}
