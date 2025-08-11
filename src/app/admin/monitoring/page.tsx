'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { SimpleAlert } from '@/components/ui/SimpleAlert';
import { SimpleButton } from '@/components/ui/simple-button';

interface LogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string;
  timestamp: string;
  admin_users: {
    username: string;
  };
}

interface SystemInfo {
  timestamp: string;
  database_status: 'connected' | 'error';
  total_teams: number;
  total_users: number;
  recent_errors: number;
}

export default function AdminMonitoringPage() {
  const { admin } = useAdmin();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/logs');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs || []);
        setSystemInfo(data.data.systemInfo || null);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to connect to logging API');
      console.error('Logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchLogs();
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

  if (loading && !logs.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading system logs...</p>
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
        <SimpleButton onClick={fetchLogs} className="bg-blue-600 hover:bg-blue-700 text-white">
          Retry
        </SimpleButton>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          System Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View system logs and basic platform statistics
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            <span className="mr-2">Last updated:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <SimpleButton 
            onClick={fetchLogs}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </SimpleButton>
        </div>
      </div>

      {/* System Status */}
      {systemInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SimpleCard className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Database</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                systemInfo.database_status === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`font-semibold ${
                systemInfo.database_status === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemInfo.database_status === 'connected' ? 'Connected' : 'Error'}
              </span>
            </div>
          </SimpleCard>

          <SimpleCard className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Teams</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo.total_teams}
            </p>
          </SimpleCard>

          <SimpleCard className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo.total_users}
            </p>
          </SimpleCard>

          <SimpleCard className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recent Errors</h3>
            <p className={`text-2xl font-bold ${
              systemInfo.recent_errors > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {systemInfo.recent_errors}
            </p>
          </SimpleCard>
        </div>
      )}

      {/* Admin Activity Logs */}
      <SimpleCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Activity Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Time</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Admin</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Action</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Target</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Details</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white font-medium">
                      {log.admin_users.username}
                    </td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.action.includes('ERROR') || log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                        log.action.includes('CREATE') || log.action.includes('UPDATE') ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                      {log.target_type ? `${log.target_type}${log.target_id ? `:${log.target_id.slice(0, 8)}` : ''}` : '-'}
                    </td>
                    <td className="py-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 100) : '-'}
                    </td>
                    <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No admin activity logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SimpleCard>
    </div>
  );
}
