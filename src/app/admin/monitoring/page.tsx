'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { SimpleAlert } from '@/components/ui/SimpleAlert';

interface MonitoringStats {
  totalTeams: number;
  activeTeams: number;
  onlineRound: {
    completed: number;
    pending: number;
    averageScore: number;
  };
  finalRound: {
    completed: number;
    pending: number;
    averageScore: number;
  };
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    overall: 'healthy' | 'warning' | 'error';
  };
  recentActivity: Array<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
}

export default function AdminMonitoringPage() {
  const { admin } = useAdmin();
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/monitor');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      setError('Failed to connect to monitoring API');
      console.error('Monitoring fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchMonitoringData();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchMonitoringData, 30000);
      return () => clearInterval(interval);
    }
  }, [admin]);

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SimpleAlert 
          variant="destructive"
          className="max-w-md"
        >
          Access denied. Please login as admin.
        </SimpleAlert>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SimpleAlert 
          variant="destructive"
          className="mb-4"
        >
          {error}
        </SimpleAlert>
        <button 
          onClick={fetchMonitoringData}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Contest Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time contest statistics and system health
        </p>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <span className="mr-2">Last updated:</span>
          <span>{new Date().toLocaleTimeString()}</span>
          <button 
            onClick={fetchMonitoringData}
            className="ml-4 text-blue-500 hover:text-blue-700"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Team Statistics */}
          <SimpleCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Team Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Teams:</span>
                <span className="font-bold">{stats.totalTeams}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Teams:</span>
                <span className="font-bold text-green-600">{stats.activeTeams}</span>
              </div>
            </div>
          </SimpleCard>

          {/* Online Round Stats */}
          <SimpleCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Online Round</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-bold text-green-600">{stats.onlineRound.completed}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-bold text-orange-600">{stats.onlineRound.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Score:</span>
                <span className="font-bold">{stats.onlineRound.averageScore}%</span>
              </div>
            </div>
          </SimpleCard>

          {/* Final Round Stats */}
          <SimpleCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Final Round</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-bold text-green-600">{stats.finalRound.completed}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-bold text-orange-600">{stats.finalRound.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Score:</span>
                <span className="font-bold">{stats.finalRound.averageScore}%</span>
              </div>
            </div>
          </SimpleCard>

          {/* System Health */}
          <SimpleCard className="p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`inline-block w-4 h-4 rounded-full mr-2 ${
                  stats.systemHealth.database === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.database === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span>Database: {stats.systemHealth.database}</span>
              </div>
              <div className="text-center">
                <div className={`inline-block w-4 h-4 rounded-full mr-2 ${
                  stats.systemHealth.api === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.api === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span>API: {stats.systemHealth.api}</span>
              </div>
              <div className="text-center">
                <div className={`inline-block w-4 h-4 rounded-full mr-2 ${
                  stats.systemHealth.overall === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span>Overall: {stats.systemHealth.overall}</span>
              </div>
            </div>
          </SimpleCard>

          {/* Recent Activity */}
          <SimpleCard className="p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{activity.action}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.details}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </SimpleCard>
        </div>
      )}
    </div>
  );
}
