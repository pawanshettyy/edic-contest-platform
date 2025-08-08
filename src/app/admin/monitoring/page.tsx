'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { 
  Monitor, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  ArrowLeft,
  RefreshCw,
  Eye,
  BarChart3,
  TrendingUp,
  Play,
  Pause,
  Square,
  Vote
} from 'lucide-react';
import Link from 'next/link';

interface TeamActivity {
  teamId: string;
  teamName: string;
  currentRound: string;
  status: 'active' | 'idle' | 'offline' | 'completed';
  lastActivity: string;
  currentScore: number;
  progress: number; // percentage
  timeRemaining: number; // seconds
  memberCount: number;
  activeMembers: number;
}

interface SystemMetrics {
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
  offlineTeams: number;
  serverLoad: number; // percentage
  databaseLoad: number; // percentage
  responseTime: number; // ms
  uptime: string;
  lastUpdate: string;
}

interface RoundStatus {
  roundId: string;
  roundName: string;
  isActive: boolean;
  totalTeams: number;
  activeTeams: number;
  completedTeams: number;
  startTime?: string;
  endTime?: string;
  timeRemaining?: number; // seconds
}

export default function RealTimeMonitoringPage() {
  const [teams, setTeams] = useState<TeamActivity[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [rounds, setRounds] = useState<RoundStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamActivity | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [startingVoting, setStartingVoting] = useState(false);
  const [votingStatus, setVotingStatus] = useState<'waiting' | 'active' | 'completed'>('waiting');

  const { admin, loading: contextLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!contextLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, contextLoading, router]);

  useEffect(() => {
    if (admin) {
      fetchData();
      fetchVotingStatus(); // Fetch voting status on load
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (admin && autoRefresh) {
      interval = setInterval(() => {
        fetchData();
        fetchVotingStatus(); // Also refresh voting status
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, autoRefresh]);

  const fetchData = async () => {
    try {
      setError('');
      
      // Mock real-time data
      const mockTeams: TeamActivity[] = [
        {
          teamId: 'team1',
          teamName: 'Code Warriors',
          currentRound: 'Quiz Round',
          status: 'active',
          lastActivity: new Date(Date.now() - 30000).toISOString(),
          currentScore: 285,
          progress: 75,
          timeRemaining: 450, // 7.5 minutes
          memberCount: 5,
          activeMembers: 4
        },
        {
          teamId: 'team2',
          teamName: 'Tech Innovators',
          currentRound: 'Quiz Round',
          status: 'active',
          lastActivity: new Date(Date.now() - 15000).toISOString(),
          currentScore: 267,
          progress: 80,
          timeRemaining: 420,
          memberCount: 5,
          activeMembers: 5
        },
        {
          teamId: 'team3',
          teamName: 'Digital Pioneers',
          currentRound: 'Quiz Round',
          status: 'idle',
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          currentScore: 198,
          progress: 60,
          timeRemaining: 480,
          memberCount: 4,
          activeMembers: 1
        },
        {
          teamId: 'team4',
          teamName: 'Future Builders',
          currentRound: 'Completed',
          status: 'completed',
          lastActivity: new Date(Date.now() - 600000).toISOString(),
          currentScore: 312,
          progress: 100,
          timeRemaining: 0,
          memberCount: 5,
          activeMembers: 0
        },
        {
          teamId: 'team5',
          teamName: 'Innovation Squad',
          currentRound: 'Quiz Round',
          status: 'offline',
          lastActivity: new Date(Date.now() - 900000).toISOString(),
          currentScore: 156,
          progress: 40,
          timeRemaining: 510,
          memberCount: 3,
          activeMembers: 0
        }
      ];

      const mockMetrics: SystemMetrics = {
        totalTeams: 50,
        activeTeams: 32,
        completedTeams: 8,
        offlineTeams: 10,
        serverLoad: Math.floor(Math.random() * 30) + 20, // 20-50%
        databaseLoad: Math.floor(Math.random() * 25) + 15, // 15-40%
        responseTime: Math.floor(Math.random() * 50) + 80, // 80-130ms
        uptime: '2 days, 14 hours',
        lastUpdate: new Date().toISOString()
      };

      const mockRounds: RoundStatus[] = [
        {
          roundId: 'round1',
          roundName: 'Quiz Round',
          isActive: false,
          totalTeams: 42,
          activeTeams: 0,
          completedTeams: 42,
          startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          endTime: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        },
        {
          roundId: 'round2',
          roundName: 'Voting Round',
          isActive: votingStatus === 'active',
          totalTeams: 42,
          activeTeams: votingStatus === 'active' ? 35 : 0,
          completedTeams: votingStatus === 'completed' ? 42 : 0,
          ...(votingStatus === 'active' && {
            startTime: new Date(Date.now() - 300000).toISOString(), // 5 min ago
            timeRemaining: 600 // 10 minutes
          })
        },
        {
          roundId: 'round3',
          roundName: 'Final Round',
          isActive: false,
          totalTeams: 0,
          activeTeams: 0,
          completedTeams: 0
        }
      ];

      setTeams(mockTeams);
      setMetrics(mockMetrics);
      setRounds(mockRounds);
      setIsLive(true);
      
      if (loading) setLoading(false);
    } catch {
      setError('Failed to fetch monitoring data');
      setIsLive(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'idle': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'offline': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLoadColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const startVoting = async () => {
    try {
      setStartingVoting(true);
      setError('');
      
      const response = await fetch('/api/voting?action=control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_voting'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVotingStatus('active');
        // Optionally refresh the data to show updated status
        fetchData();
      } else {
        setError(data.error || 'Failed to start voting');
      }
    } catch (error) {
      console.error('Error starting voting:', error);
      setError('Failed to start voting session');
    } finally {
      setStartingVoting(false);
    }
  };

  const fetchVotingStatus = async () => {
    try {
      const response = await fetch('/api/voting?action=status');
      const data = await response.json();
      
      if (data.success && data.session) {
        // Update voting status based on session phase
        if (data.session.phase === 'voting' || data.session.phase === 'pitching') {
          setVotingStatus('active');
        } else if (data.session.phase === 'completed') {
          setVotingStatus('completed');
        } else {
          setVotingStatus('waiting');
        }
      }
    } catch (error) {
      console.error('Error fetching voting status:', error);
      // Don't set error for this background fetch
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Monitor className="h-6 w-6 mr-2 text-blue-600" />
                Real-Time Monitoring
              </h1>
              <div className="flex items-center space-x-2">
                {isLive ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="h-4 w-4 mr-1" />
                    <span className="text-sm">Live</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="h-4 w-4 mr-1" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <SimpleButton
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                >
                  {autoRefresh ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                  {autoRefresh ? 'Pause' : 'Resume'}
                </SimpleButton>
                <SimpleButton
                  onClick={fetchData}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <SimpleAlert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <SimpleAlertDescription>{error}</SimpleAlertDescription>
          </SimpleAlert>
        )}

        {/* System Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SimpleCard>
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Teams</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.activeTeams}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.totalTeams} total teams
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Load</p>
                    <p className={`text-2xl font-bold ${getLoadColor(metrics.serverLoad)}`}>
                      {metrics.serverLoad}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Response: {metrics.responseTime}ms
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Load</p>
                    <p className={`text-2xl font-bold ${getLoadColor(metrics.databaseLoad)}`}>
                      {metrics.databaseLoad}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Uptime: {metrics.uptime}
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.completedTeams}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.offlineTeams} offline teams
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {/* Round Status */}
        <SimpleCard className="mb-8">
          <SimpleCardHeader>
            <div className="flex justify-between items-center">
              <SimpleCardTitle>Round Status</SimpleCardTitle>
              <div className="flex space-x-2">
                {votingStatus === 'waiting' && (
                  <SimpleButton
                    onClick={startVoting}
                    disabled={startingVoting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Vote className="h-4 w-4 mr-2" />
                    {startingVoting ? 'Starting...' : 'Start Voting'}
                  </SimpleButton>
                )}
                {votingStatus === 'active' && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm font-medium">Voting Active</span>
                    </div>
                    <SimpleButton
                      onClick={() => {
                        // Add end voting functionality if needed
                        setVotingStatus('completed');
                      }}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      End Voting
                    </SimpleButton>
                  </div>
                )}
                {votingStatus === 'completed' && (
                  <div className="flex items-center text-blue-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Voting Completed</span>
                  </div>
                )}
              </div>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rounds.map((round) => (
                <div key={round.roundId} className={`p-4 rounded-lg border-2 ${
                  round.isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{round.roundName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      round.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {round.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {round.isActive && (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Active Teams:</span>
                          <span className="font-medium">{round.activeTeams}/{round.totalTeams}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                          <span className="font-medium">{round.completedTeams}</span>
                        </div>
                        {round.timeRemaining && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Time Left:</span>
                            <span className="font-medium text-orange-600">{formatTime(round.timeRemaining)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(round.completedTeams / round.totalTeams) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round((round.completedTeams / round.totalTeams) * 100)}% completed
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Team Activity */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>Team Activity</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {teams.map((team) => (
                    <tr key={team.teamId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.teamName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.currentRound}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(team.status)}`}>
                          {team.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              team.status === 'completed' ? 'bg-blue-600' :
                              team.status === 'active' ? 'bg-green-600' :
                              team.status === 'idle' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${team.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{team.progress}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.currentScore}
                        </div>
                        {team.timeRemaining > 0 && (
                          <div className="text-xs text-orange-600">
                            {formatTime(team.timeRemaining)} left
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {team.activeMembers}/{team.memberCount}
                        </div>
                        <div className="text-xs text-gray-500">online</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(team.lastActivity).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <SimpleButton
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTeam(team)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </SimpleButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Team Detail Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTeam.teamName} - Live Activity
                  </h2>
                  <SimpleButton
                    onClick={() => setSelectedTeam(null)}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="h-4 w-4" />
                  </SimpleButton>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <div className={`mt-1 px-3 py-2 rounded-md ${getStatusColor(selectedTeam.status)}`}>
                        {selectedTeam.status}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Round</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTeam.currentRound}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</label>
                      <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{selectedTeam.currentScore}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</label>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${selectedTeam.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{selectedTeam.progress}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedTeam.activeMembers}/{selectedTeam.memberCount} online
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Remaining</label>
                      <div className="mt-1 text-sm font-medium text-orange-600">
                        {selectedTeam.timeRemaining > 0 ? formatTime(selectedTeam.timeRemaining) : 'Completed'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Activity</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedTeam.lastActivity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
