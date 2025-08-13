"use client";

import { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { Badge } from '@/components/ui/badge';
import { 
  Timer, Users, ArrowUp, ArrowDown, Play, Pause, 
  RotateCcw, Settings, Trophy, Clock, AlertCircle, CheckCircle,
  PlayCircle, StopCircle, SkipForward
} from 'lucide-react';

interface VotingSession {
  id: string;
  phase: string;
  currentPresentingTeam?: string;
  timeRemaining: number;
  isActive: boolean;
  registeredTeams: number;
  teamsWithOrder: number;
}

interface Team {
  id: string;
  team_name: string;
  presentation_order?: number;
  has_presented: boolean;
  upvotes: number;
  downvotes: number;
  total_score: number;
}

interface VotingStats {
  totalVotes: number;
  upvotes: number;
  downvotes: number;
}

const PHASE_LABELS = {
  waiting: { label: 'Waiting', color: 'bg-gray-100 text-gray-800', icon: Clock },
  pitching: { label: 'Pitching', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
  voting: { label: 'Voting', color: 'bg-green-100 text-green-800', icon: Timer },
  break: { label: 'Break', color: 'bg-orange-100 text-orange-800', icon: Pause },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
};

export default function AdminVotingPage() {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<VotingStats>({ totalVotes: 0, upvotes: 0, downvotes: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerInput, setTimerInput] = useState('');

  // Configuration
  const [pitchDuration, setPitchDuration] = useState(90);
  const [votingDuration, setVotingDuration] = useState(30);

  const fetchVotingData = async () => {
    try {
      const response = await fetch('/api/admin/voting', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch voting data');
      }

      const data = await response.json();
      
      if (data.success) {
        setSession(data.currentSession);
        setTeams(data.teams || []);
        setStats(data.stats || { totalVotes: 0, upvotes: 0, downvotes: 0 });
        setError(null);
      } else {
        setError(data.error || 'Failed to load voting data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotingData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchVotingData, 5000);
    return () => clearInterval(interval);
  }, []);

  const performAction = async (action: string, data: Record<string, unknown> = {}) => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/admin/voting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          data: {
            ...data,
            pitchDuration,
            votingDuration
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchVotingData(); // Refresh data
        setError(null);
      } else {
        setError(result.error || `Failed to ${action.replace('_', ' ')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action.replace('_', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateTimer = async () => {
    const timeInSeconds = parseInt(timerInput);
    if (isNaN(timeInSeconds) || timeInSeconds < 0) {
      setError('Please enter a valid time in seconds');
      return;
    }
    
    await performAction('update_timer', {
      sessionId: session?.id,
      timeRemaining: timeInSeconds
    });
    setTimerInput('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTeam = () => {
    if (!session?.currentPresentingTeam) return null;
    return teams.find(t => t.id === session.currentPresentingTeam);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading voting control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Voting Session Control
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage team presentations and voting rounds
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SimpleButton
            onClick={fetchVotingData}
            variant="outline"
            size="sm"
          >
            Refresh
          </SimpleButton>
        </div>
      </div>

      {error && (
        <SimpleAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <SimpleAlertDescription>{error}</SimpleAlertDescription>
        </SimpleAlert>
      )}

      {/* Configuration */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration</span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pitch Duration (seconds)
              </label>
              <input
                type="number"
                value={pitchDuration}
                onChange={(e) => setPitchDuration(parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="30"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Voting Duration (seconds)
              </label>
              <input
                type="number"
                value={votingDuration}
                onChange={(e) => setVotingDuration(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="15"
                max="120"
              />
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Session Status */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Current Session</span>
            </span>
            {session && (
              <Badge className={PHASE_LABELS[session.phase as keyof typeof PHASE_LABELS]?.color}>
                {PHASE_LABELS[session.phase as keyof typeof PHASE_LABELS]?.label || session.phase}
              </Badge>
            )}
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {!session ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No active voting session
              </p>
              <SimpleButton
                onClick={() => performAction('create_session')}
                disabled={actionLoading === 'create_session'}
              >
                {actionLoading === 'create_session' ? 'Creating...' : 'Create New Session'}
              </SimpleButton>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Session ID</p>
                  <p className="font-mono text-sm">{session.id.slice(0, 8)}...</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Teams</p>
                  <p className="text-xl font-bold">{session.registeredTeams}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</p>
                  <p className="text-xl font-bold">{formatTime(session.timeRemaining)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes</p>
                  <p className="text-xl font-bold">{stats.totalVotes}</p>
                </div>
              </div>

              {/* Current Team */}
              {session.currentPresentingTeam && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    {session.phase === 'pitching' ? 'Now Presenting' : 'Voting For'}
                  </p>
                  <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    {getCurrentTeam()?.team_name || 'Unknown Team'}
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap gap-2">
                {session.phase === 'waiting' && (
                  <SimpleButton
                    onClick={() => performAction('start_session', { sessionId: session.id })}
                    disabled={actionLoading === 'start_session'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {actionLoading === 'start_session' ? 'Starting...' : 'Start Session'}
                  </SimpleButton>
                )}

                {(session.phase === 'pitching' || session.phase === 'voting') && (
                  <SimpleButton
                    onClick={() => performAction('next_phase', { sessionId: session.id })}
                    disabled={actionLoading === 'next_phase'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    {actionLoading === 'next_phase' ? 'Advancing...' : 'Next Phase'}
                  </SimpleButton>
                )}

                <SimpleButton
                  onClick={() => performAction('end_session', { sessionId: session.id })}
                  disabled={actionLoading === 'end_session'}
                  variant="destructive"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  {actionLoading === 'end_session' ? 'Ending...' : 'End Session'}
                </SimpleButton>

                <SimpleButton
                  onClick={() => performAction('reset_votes', { sessionId: session.id })}
                  disabled={actionLoading === 'reset_votes'}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {actionLoading === 'reset_votes' ? 'Resetting...' : 'Reset All Votes'}
                </SimpleButton>
              </div>

              {/* Timer Control */}
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Time in seconds"
                  value={timerInput}
                  onChange={(e) => setTimerInput(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
                />
                <SimpleButton
                  onClick={updateTimer}
                  disabled={!timerInput || actionLoading === 'update_timer'}
                  size="sm"
                >
                  <Timer className="h-4 w-4 mr-2" />
                  Update Timer
                </SimpleButton>
              </div>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* Teams Overview */}
      {teams.length > 0 && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Teams ({teams.length})</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="space-y-3">
              {teams
                .sort((a, b) => (a.presentation_order || 999) - (b.presentation_order || 999))
                .map((team) => (
                  <div
                    key={team.id}
                    className={`p-4 border rounded-lg ${
                      session?.currentPresentingTeam === team.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                          {team.presentation_order || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold">{team.team_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <ArrowUp className="h-4 w-4 text-green-500" />
                              <span>{team.upvotes}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <ArrowDown className="h-4 w-4 text-red-500" />
                              <span>{team.downvotes}</span>
                            </span>
                            <span className="font-semibold">
                              Score: {team.total_score}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {team.has_presented && (
                          <Badge className="bg-green-100 text-green-800">
                            Presented
                          </Badge>
                        )}
                        {session?.currentPresentingTeam === team.id && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Current
                          </Badge>
                        )}
                        <SimpleButton
                          onClick={() => performAction('reset_votes', { 
                            sessionId: session?.id, 
                            teamId: team.id 
                          })}
                          disabled={actionLoading === 'reset_votes'}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </SimpleButton>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Voting Statistics */}
      {session && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>Voting Statistics</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVotes}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.upvotes}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upvotes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {stats.downvotes}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Downvotes</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}
    </div>
  );
}
