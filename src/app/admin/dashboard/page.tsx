'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';

interface OverviewData {
  totalUsers: number;
  totalTeams: number;
  activeTeams: number;
  contestActive: boolean;
}

interface ActiveTeam {
  id: string;
  team_name: string;
  current_round: number;
  total_score: number;
  last_activity: string;
}

interface Submission {
  id: string;
  submitted_at: string;
  status: string;
  teams: { team_name: string };
  contest_rounds: { title: string };
}

interface AdminAction {
  id: string;
  action: string;
  target_type: string;
  details: Record<string, unknown>;
  timestamp: string;
  admin_users: { username: string };
}

interface RecentActivity {
  submissions: Submission[];
  adminActions: AdminAction[];
}

interface SubmissionStat {
  period: string;
  count: number;
}

interface PerformanceMetric {
  team_id: string;
  average_solve_time: number;
  success_rate: number;
  teams: { team_name: string };
}

interface ContestConfig {
  id: string;
  contest_active: boolean;
  updated_at: string;
}

interface DashboardData {
  overview: OverviewData;
  recentActivity: RecentActivity;
  activeTeams: ActiveTeam[];
  submissionStats: SubmissionStat[];
  performanceMetrics: PerformanceMetric[];
  systemStatus: {
    databaseConnected: boolean;
    contestConfig: ContestConfig | null;
    lastUpdated: string;
  };
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { admin, signOut, loading: contextLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!contextLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, contextLoading, router]);

  useEffect(() => {
    if (admin) {
      fetchDashboardData();
    }
  }, [admin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/monitor', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <SimpleCard className="p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <SimpleButton onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700 text-white">
              Try Again
            </SimpleButton>
          </div>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {admin.username}
              </span>
              <SimpleButton
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
              >
                Sign Out
              </SimpleButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardData && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SimpleCard className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.overview.totalUsers}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">U</span>
                  </div>
                </div>
              </SimpleCard>

              <SimpleCard className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teams</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.overview.totalTeams}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm font-bold">T</span>
                  </div>
                </div>
              </SimpleCard>

              <SimpleCard className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Submissions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.recentActivity.submissions.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Last 24 hours</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">S</span>
                  </div>
                </div>
              </SimpleCard>

              <SimpleCard className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {dashboardData.systemStatus.databaseConnected ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                  </div>
                </div>
              </SimpleCard>
            </div>

            {/* Active Teams */}
            <SimpleCard className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Teams</h2>
              <div className="space-y-3">
                {dashboardData.activeTeams.slice(0, 5).map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {team.team_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Round {team.current_round} • Score: {team.total_score}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  </div>
                ))}
                {dashboardData.activeTeams.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No active teams found</p>
                )}
              </div>
            </SimpleCard>

            {/* Top Teams */}
            <SimpleCard className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Teams</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Team</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Round</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total Score</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.activeTeams
                      .sort((a, b) => b.total_score - a.total_score)
                      .slice(0, 5)
                      .map((team, index) => (
                      <tr key={team.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 text-sm text-gray-900 dark:text-white font-medium">
                          #{index + 1} {team.team_name}
                        </td>
                        <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          {team.current_round}
                        </td>
                        <td className="py-2 text-sm text-gray-900 dark:text-white font-medium">
                          {team.total_score}
                        </td>
                        <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(team.last_activity).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {dashboardData.activeTeams.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                          No teams found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SimpleCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <SimpleCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contest Control</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Real-time control of quiz and voting sessions for all teams.
                </p>
                <SimpleButton 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => router.push('/admin/control')}
                >
                  Control Panel
                </SimpleButton>
              </SimpleCard>

              <SimpleCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  View and manage all registered teams, update scores, and handle penalties.
                </p>
                <SimpleButton 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => router.push('/admin/teams')}
                >
                  Manage Teams
                </SimpleButton>
              </SimpleCard>

              <SimpleCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Bank</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add, edit, and manage quiz questions with timer settings and scoring.
                </p>
                <SimpleButton 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => router.push('/admin/config?tab=questions')}
                >
                  Manage Questions
                </SimpleButton>
              </SimpleCard>

              <SimpleCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contest Configuration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Configure contest rounds, timings, and platform settings.
                </p>
                <SimpleButton 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => router.push('/admin/config')}
                >
                  Configure Contest
                </SimpleButton>
              </SimpleCard>

              <SimpleCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Real-time Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Monitor live submissions, team progress, and system performance.
                </p>
                <SimpleButton 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => router.push('/admin/monitoring')}
                >
                  Live Monitor
                </SimpleButton>
              </SimpleCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
