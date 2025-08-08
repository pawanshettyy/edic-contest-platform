"use client";

import { useState, useEffect, useCallback } from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { Crown, Trophy, Medal, Award, Target, Users, BarChart3, TrendingUp, Star, CheckCircle } from 'lucide-react';

interface ScoreboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  quizScore: number;
  votingScore: number;
  onlineTotal: number;
  offlineScore?: number;
  finalScore?: number;
  status: 'qualified' | 'eliminated' | 'completed';
}

interface ScoreboardData {
  success: boolean;
  type: 'online' | 'final';
  scoreboard: ScoreboardEntry[];
  qualificationThreshold?: number;
  maxQuizScore?: number;
  weights?: {
    online: number;
    offline: number;
  };
  summary?: {
    totalTeams: number;
    qualified?: number;
    winner?: ScoreboardEntry;
    averageQuizScore?: number;
    averageVotingScore?: number;
    averageFinalScore?: number;
    scoreRange?: {
      highest: number;
      lowest: number;
    };
  };
}

interface ResultsComponentProps {
  teamId: string;
  teamName: string;
}

export function ResultsComponent({ teamId }: ResultsComponentProps) {
  const [onlineResults, setOnlineResults] = useState<ScoreboardData | null>(null);
  const [finalResults, setFinalResults] = useState<ScoreboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'online' | 'final'>('online');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch results data
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch online results
      const onlineResponse = await fetch('/api/scoreboard?type=online');
      const onlineData = await onlineResponse.json();
      
      if (onlineData.success) {
        setOnlineResults(onlineData);
      }

      // Fetch final results
      const finalResponse = await fetch('/api/scoreboard?type=final');
      const finalData = await finalResponse.json();
      
      if (finalData.success) {
        setFinalResults(finalData);
        // If final results are available, show them by default
        if (finalData.scoreboard && finalData.scoreboard.length > 0) {
          setActiveTab('final');
        }
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch results data');
      console.error('Results fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTeamHighlight = (entry: ScoreboardEntry) => {
    if (entry.teamId === teamId) {
      return 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
    return '';
  };

  const formatPercentage = (value: number, max: number) => {
    return Math.round((value / max) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SimpleAlert variant="destructive">
        <SimpleAlertDescription>
          <strong>Error:</strong> {error}
          <SimpleButton onClick={fetchResults} className="ml-4" size="sm">
            Retry
          </SimpleButton>
        </SimpleAlertDescription>
      </SimpleAlert>
    );
  }

  const currentResults = activeTab === 'online' ? onlineResults : finalResults;

  if (!currentResults) {
    return (
      <SimpleAlert>
        <SimpleAlertDescription>
          No results data available yet. Results will be published after the evaluation is complete.
        </SimpleAlertDescription>
      </SimpleAlert>
    );
  }

  const myTeamResult = currentResults.scoreboard.find(entry => entry.teamId === teamId);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('online')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'online'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Online Results (Quiz + Voting)
        </button>
        <button
          onClick={() => setActiveTab('final')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'final'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Final Results (Including Offline)
        </button>
      </div>

      {/* Your Team Summary */}
      {myTeamResult && (
        <SimpleCard className="border-2 border-blue-500">
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Your Team Performance</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {getRankIcon(myTeamResult.rank)}
                  <span className="text-2xl font-bold">{myTeamResult.rank}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rank</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {myTeamResult.quizScore}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quiz Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {myTeamResult.votingScore}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Voting Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {activeTab === 'final' ? myTeamResult.finalScore : myTeamResult.onlineTotal}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activeTab === 'final' ? 'Final Score' : 'Online Total'}
                </p>
              </div>
            </div>
            
            {activeTab === 'online' && myTeamResult.status === 'qualified' && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800 dark:text-green-200">
                  Qualified for Final Evaluation!
                </span>
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Summary Statistics */}
      {currentResults.summary && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Competition Summary</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentResults.summary.totalTeams}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Teams</p>
              </div>
              
              {activeTab === 'online' && currentResults.summary.qualified !== undefined && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentResults.summary.qualified}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Qualified</p>
                </div>
              )}
              
              {activeTab === 'online' && currentResults.summary.averageQuizScore && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {currentResults.summary.averageQuizScore}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Quiz Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {currentResults.summary.averageVotingScore}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Voting Score</p>
                  </div>
                </>
              )}
              
              {activeTab === 'final' && currentResults.summary.scoreRange && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {currentResults.summary.scoreRange.highest}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Highest Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {currentResults.summary.scoreRange.lowest}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lowest Score</p>
                  </div>
                </>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Leaderboard */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>
              {activeTab === 'online' ? 'Online Leaderboard' : 'Final Leaderboard'}
            </span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="space-y-3">
            {currentResults.scoreboard.map((entry) => (
              <div
                key={entry.teamId}
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${getTeamHighlight(entry)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(entry.rank)}`}>
                      {entry.rank}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg flex items-center space-x-2">
                        <span>{entry.teamName}</span>
                        {entry.teamId === teamId && (
                          <Star className="h-4 w-4 text-blue-500" />
                        )}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>Quiz: {entry.quizScore}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Voting: {entry.votingScore}</span>
                        </span>
                        {activeTab === 'final' && entry.offlineScore !== undefined && (
                          <span className="flex items-center space-x-1">
                            <BarChart3 className="h-4 w-4" />
                            <span>Offline: {entry.offlineScore}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {activeTab === 'final' ? entry.finalScore : entry.onlineTotal}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {activeTab === 'final' ? 'Final Score' : 'Online Total'}
                    </div>
                    {activeTab === 'online' && currentResults.qualificationThreshold && (
                      <div className={`text-xs font-semibold ${
                        entry.status === 'qualified' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {entry.status === 'qualified' ? 'QUALIFIED' : 'ELIMINATED'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bars for score breakdown */}
                {activeTab === 'online' && currentResults.maxQuizScore && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Quiz Performance</span>
                        <span>{formatPercentage(entry.quizScore, currentResults.maxQuizScore)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${formatPercentage(entry.quizScore, currentResults.maxQuizScore)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Scoring Information */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Scoring Information</span>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {activeTab === 'online' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Online Score Calculation:</strong> Quiz Score + Voting Score
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">Quiz Component:</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    <li>15 multiple choice questions</li>
                    <li>Variable points per question (+4, +2, -2)</li>
                    <li>Maximum possible: 60 points</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400">Voting Component:</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    <li>Peer voting on presentations</li>
                    <li>Upvotes (+1) and Downvotes (-1)</li>
                    <li>Maximum 3 downvotes per team</li>
                  </ul>
                </div>
              </div>
              {currentResults.qualificationThreshold && (
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Qualification Threshold: {currentResults.qualificationThreshold} points
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Final Score Calculation:</strong> Weighted combination of online and offline evaluations
              </p>
              {currentResults.weights && (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                      Online Component ({(currentResults.weights.online * 100)}%):
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">Quiz + Voting scores</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">
                      Offline Component ({(currentResults.weights.offline * 100)}%):
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">Expert evaluation and assessment</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Final Score = (Online Score × {currentResults.weights?.online}) + (Offline Score × {currentResults.weights?.offline})
              </p>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
}
