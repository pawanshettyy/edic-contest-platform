'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Clock, 
  Users, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Settings,
  Timer,
  Vote,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface ContestState {
  contestActive: boolean;
  quizActive: boolean;
  votingActive: boolean;
  resultsActive: boolean;
  quizTimeLimit: number;
  currentRound: number;
}

export default function ContestControlPage() {
  const [contestState, setContestState] = useState<ContestState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quizTimeLimitInput, setQuizTimeLimitInput] = useState('30');

  const { admin, loading: contextLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!contextLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, contextLoading, router]);

  useEffect(() => {
    if (admin) {
      fetchContestState();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchContestState, 5000);
      return () => clearInterval(interval);
    }
  }, [admin]);

  const fetchContestState = async () => {
    try {
      const response = await fetch('/api/admin/contest-control');
      const data = await response.json();
      
      if (data.success) {
        setContestState({
          contestActive: data.contestActive,
          quizActive: data.quizActive,
          votingActive: data.votingActive,
          resultsActive: data.resultsActive || false,
          quizTimeLimit: data.quizTimeLimit,
          currentRound: data.currentRound
        });
        setQuizTimeLimitInput(data.quizTimeLimit.toString());
      } else {
        setError(data.message || 'Failed to fetch contest state');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, value?: boolean | string) => {
    setActionLoading(action);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/contest-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        fetchContestState(); // Refresh state
        
        // Show auto-submit warning for quiz disable
        if (action === 'toggle_quiz' && value === false && data.autoSubmitIn) {
          setSuccess(`${data.message} Auto-submit in ${data.autoSubmitIn} seconds.`);
        }
      } else {
        setError(data.message || 'Action failed');
      }
    } catch {
      setError('Failed to execute action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuizTimeLimitUpdate = async () => {
    const timeLimit = parseInt(quizTimeLimitInput);
    if (isNaN(timeLimit) || timeLimit < 5 || timeLimit > 180) {
      setError('Time limit must be between 5 and 180 minutes');
      return;
    }
    
    await handleAction('set_quiz_time_limit', timeLimit.toString());
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!admin || !contestState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SimpleAlert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <SimpleAlertDescription>
            Failed to load contest control panel
          </SimpleAlertDescription>
        </SimpleAlert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contest Control Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage quiz and voting sessions in real-time
          </p>
        </div>
        <Link href="/admin/dashboard">
          <SimpleButton variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </SimpleButton>
        </Link>
      </div>

      {error && (
        <SimpleAlert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <SimpleAlertDescription>{error}</SimpleAlertDescription>
        </SimpleAlert>
      )}

      {success && (
        <SimpleAlert variant="default" className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <SimpleAlertDescription className="text-green-800">{success}</SimpleAlertDescription>
        </SimpleAlert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Control */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Quiz Control
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">Quiz Status</h3>
                <p className="text-sm text-gray-600">
                  {contestState.quizActive ? 'Quiz is currently active' : 'Quiz is inactive'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {contestState.quizActive ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Pause className="h-5 w-5" />
                    <span className="font-medium">Inactive</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="quizTimeLimit">Quiz Time Limit (minutes)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="quizTimeLimit"
                    type="number"
                    min="5"
                    max="180"
                    value={quizTimeLimitInput}
                    onChange={(e) => setQuizTimeLimitInput(e.target.value)}
                    className="flex-1"
                  />
                  <SimpleButton 
                    onClick={handleQuizTimeLimitUpdate}
                    disabled={actionLoading === 'set_quiz_time_limit'}
                    size="sm"
                  >
                    {actionLoading === 'set_quiz_time_limit' ? (
                      <RotateCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Update'
                    )}
                  </SimpleButton>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current limit: {contestState.quizTimeLimit} minutes
                </p>
              </div>

              <div className="flex gap-2">
                <SimpleButton
                  onClick={() => handleAction('toggle_quiz', true)}
                  disabled={contestState.quizActive || actionLoading === 'toggle_quiz'}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'toggle_quiz' ? (
                    <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Quiz
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => handleAction('toggle_quiz', false)}
                  disabled={!contestState.quizActive || actionLoading === 'toggle_quiz'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === 'toggle_quiz' ? (
                    <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Stop Quiz
                </SimpleButton>
              </div>

              {contestState.quizActive && (
                <SimpleAlert className="border-blue-200 bg-blue-50">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <SimpleAlertDescription className="text-blue-800">
                    Quiz is active! Teams can start taking the quiz. When you stop it, teams will have 1 minute to finish before auto-submission.
                  </SimpleAlertDescription>
                </SimpleAlert>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Voting Control */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Voting Control
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">Voting Status</h3>
                <p className="text-sm text-gray-600">
                  {contestState.votingActive ? 'Voting is currently active' : 'Voting is inactive'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {contestState.votingActive ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Pause className="h-5 w-5" />
                    <span className="font-medium">Inactive</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <SimpleButton
                  onClick={() => handleAction('toggle_voting', true)}
                  disabled={contestState.votingActive || actionLoading === 'toggle_voting'}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {actionLoading === 'toggle_voting' ? (
                    <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Voting
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => handleAction('toggle_voting', false)}
                  disabled={!contestState.votingActive || actionLoading === 'toggle_voting'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === 'toggle_voting' ? (
                    <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Stop Voting
                </SimpleButton>
              </div>

              {contestState.votingActive && (
                <SimpleAlert className="border-purple-200 bg-purple-50">
                  <Vote className="h-4 w-4 text-purple-600" />
                  <SimpleAlertDescription className="text-purple-800">
                    Voting is active! All teams can now cast their votes. When you stop voting, the session will end immediately for everyone.
                  </SimpleAlertDescription>
                </SimpleAlert>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Results Control */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Results Control
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">Results Status</h3>
                <p className="text-sm text-gray-600">
                  {contestState.resultsActive ? 'Results are published' : 'Results are hidden'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {contestState.resultsActive ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Published</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Pause className="h-5 w-5" />
                    <span className="font-medium">Hidden</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <SimpleButton
                  onClick={() => handleAction('toggle_results', true)}
                  disabled={contestState.resultsActive || actionLoading === 'toggle_results'}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'toggle_results' ? (
                    <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Publish Results
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => handleAction('toggle_results', false)}
                  disabled={!contestState.resultsActive || actionLoading === 'toggle_results'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === 'toggle_results' ? (
                    <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Hide Results
                </SimpleButton>
              </div>

              {contestState.resultsActive && (
                <SimpleAlert className="border-green-200 bg-green-50">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <SimpleAlertDescription className="text-green-800">
                    Results are published! All teams can now view final standings, quiz scores, and voting outcomes.
                  </SimpleAlertDescription>
                </SimpleAlert>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Status Overview */}
      <SimpleCard className="mt-6">
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contest Overview
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Quiz Time Limit</h3>
              <p className="text-2xl font-bold text-blue-600">{contestState.quizTimeLimit} min</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">Current Round</h3>
              <p className="text-2xl font-bold text-green-600">Round {contestState.currentRound}</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Timer className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">System Status</h3>
              <p className="text-lg font-medium text-purple-600">
                {contestState.contestActive ? 'Contest Active' : 'Contest Inactive'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold">Results Status</h3>
              <p className="text-lg font-medium text-orange-600">
                {contestState.resultsActive ? 'Published' : 'Hidden'}
              </p>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
}
