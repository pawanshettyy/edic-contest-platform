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
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Award, 
  AlertTriangle,
  Eye,
  User,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  isLeader: boolean;
}

interface Team {
  id: string;
  name: string;
  leader: TeamMember;
  members: TeamMember[];
  createdAt: string;
  totalScore: number;
  currentRound: number;
  status: 'active' | 'inactive' | 'disqualified';
  lastActivity: string;
  quizScore?: number;
  votingScore?: number;
  offlineScore?: number;
}

interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  disqualifiedTeams: number;
  averageScore: number;
  topScore: number;
}

export default function TeamManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    leaderName: '',
    leaderEmail: '',
    memberNames: ['', '', '', ''] // For 4 additional members
  });

  const { admin, loading: contextLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!contextLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, contextLoading, router]);

  useEffect(() => {
    if (admin) {
      fetchTeamsData();
    }
  }, [admin]);

  useEffect(() => {
    // Filter teams based on search term
    if (searchTerm.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.members.some(member => 
          member.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredTeams(filtered);
    }
  }, [searchTerm, teams]);

  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams data from API
      const response = await fetch('/api/admin/teams', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.teams) {
        setTeams(data.teams);
        setStats(data.stats || {
          totalTeams: data.teams.length,
          activeTeams: data.teams.filter((t: Team) => t.status === 'active').length,
          disqualifiedTeams: data.teams.filter((t: Team) => t.status === 'disqualified').length,
          averageScore: data.teams.length > 0 ? Math.round(data.teams.reduce((sum: number, team: Team) => sum + team.totalScore, 0) / data.teams.length) : 0,
          topScore: data.teams.length > 0 ? Math.max(...data.teams.map((team: Team) => team.totalScore)) : 0
        });
      } else {
        console.error('Failed to fetch teams data:', data);
        setTeams([]);
        setStats({
          totalTeams: 0,
          activeTeams: 0,
          disqualifiedTeams: 0,
          averageScore: 0,
          topScore: 0
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      setActionLoading(true);
      
      // Validate form data
      if (!newTeamData.name.trim() || !newTeamData.leaderName.trim() || !newTeamData.leaderEmail.trim()) {
        setError('Team name, leader name, and leader email are required');
        return;
      }

      // Create new team object
      const newTeam: Team = {
        id: `team${Date.now()}`,
        name: newTeamData.name.trim(),
        leader: {
          id: `user${Date.now()}`,
          name: newTeamData.leaderName.trim(),
          email: newTeamData.leaderEmail.trim(),
          isLeader: true
        },
        members: [
          {
            id: `user${Date.now()}`,
            name: newTeamData.leaderName.trim(),
            email: newTeamData.leaderEmail.trim(),
            isLeader: true
          },
          ...newTeamData.memberNames
            .filter(name => name.trim() !== '')
            .map((name, index) => ({
              id: `user${Date.now() + index + 1}`,
              name: name.trim(),
              email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
              isLeader: false
            }))
        ],
        createdAt: new Date().toISOString(),
        totalScore: 0,
        currentRound: 1,
        status: 'active',
        lastActivity: new Date().toISOString(),
        quizScore: 0,
        votingScore: 0,
        offlineScore: 0
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to teams list
      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          totalTeams: stats.totalTeams + 1,
          activeTeams: stats.activeTeams + 1
        });
      }
      
      // Reset form and close modal
      setNewTeamData({
        name: '',
        leaderName: '',
        leaderEmail: '',
        memberNames: ['', '', '', '']
      });
      setShowCreateModal(false);
      setError('');
      
    } catch {
      setError('Failed to create team');
    } finally {
      setActionLoading(false);
    }
  };

  const updateNewTeamMember = (index: number, value: string) => {
    const updatedMembers = [...newTeamData.memberNames];
    updatedMembers[index] = value;
    setNewTeamData({ ...newTeamData, memberNames: updatedMembers });
  };

  const handleTeamAction = async (teamId: string, action: 'activate' | 'deactivate' | 'disqualify' | 'delete') => {
    try {
      setActionLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (action === 'delete') {
        setTeams(teams.filter(team => team.id !== teamId));
      } else {
        setTeams(teams.map(team => 
          team.id === teamId 
            ? { ...team, status: action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : 'disqualified' }
            : team
        ));
      }
      
      setShowTeamModal(false);
      setSelectedTeam(null);
    } catch {
      setError('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'disqualified': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading team management...</p>
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
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                Team Management
              </h1>
            </div>
            <SimpleButton 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Team
            </SimpleButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <SimpleAlert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <SimpleAlertDescription>{error}</SimpleAlertDescription>
          </SimpleAlert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <SimpleCard className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teams</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTeams}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </SimpleCard>

            <SimpleCard className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Teams</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeTeams}</p>
                </div>
                <Trophy className="h-8 w-8 text-green-500" />
              </div>
            </SimpleCard>

            <SimpleCard className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disqualified</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.disqualifiedTeams}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </SimpleCard>

            <SimpleCard className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.averageScore}</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </SimpleCard>

            <SimpleCard className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Score</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.topScore}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </SimpleCard>
          </div>
        )}

        {/* Search and Filters */}
        <SimpleCard className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Teams</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by team name, leader, or member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </SimpleCard>

        {/* Teams Table */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>All Teams ({filteredTeams.length})</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Team</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Leader</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Members</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Round</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Last Activity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
                        <div className="text-xs text-gray-500">Created: {formatDate(team.createdAt)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{team.leader.name}</div>
                            <div className="text-xs text-gray-500">{team.leader.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900 dark:text-white">{team.members.length} members</div>
                        <div className="text-xs text-gray-500">
                          {team.members.slice(0, 2).map(m => m.name).join(', ')}
                          {team.members.length > 2 && ` +${team.members.length - 2} more`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{team.totalScore}</div>
                        <div className="text-xs text-gray-500">
                          Q:{team.quizScore} V:{team.votingScore} O:{team.offlineScore}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900 dark:text-white">Round {team.currentRound}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(team.status)}`}>
                          {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-500">{formatDate(team.lastActivity)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <SimpleButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTeam(team);
                              setShowTeamModal(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </SimpleButton>
                          <SimpleButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTeam(team);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </SimpleButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </main>

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedTeam.name}
                </h2>
                <SimpleButton
                  variant="outline"
                  onClick={() => setShowTeamModal(false)}
                >
                  ✕
                </SimpleButton>
              </div>

              <div className="space-y-6">
                {/* Team Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Team Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Score</Label>
                      <p className="text-2xl font-bold text-blue-600">{selectedTeam.totalScore}</p>
                    </div>
                    <div>
                      <Label>Current Round</Label>
                      <p className="text-xl font-medium">Round {selectedTeam.currentRound}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTeam.status)}`}>
                        {selectedTeam.status.charAt(0).toUpperCase() + selectedTeam.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm">{formatDate(selectedTeam.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Score Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <Label>Quiz Score</Label>
                      <p className="text-xl font-bold text-blue-600">{selectedTeam.quizScore}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <Label>Voting Score</Label>
                      <p className="text-xl font-bold text-green-600">{selectedTeam.votingScore}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <Label>Offline Score</Label>
                      <p className="text-xl font-bold text-purple-600">{selectedTeam.offlineScore}</p>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Team Members</h3>
                  <div className="space-y-2">
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.name}
                              {member.isLeader && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Leader
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedTeam.status === 'active' ? (
                    <SimpleButton
                      variant="destructive"
                      onClick={() => handleTeamAction(selectedTeam.id, 'deactivate')}
                      disabled={actionLoading}
                    >
                      Deactivate Team
                    </SimpleButton>
                  ) : (
                    <SimpleButton
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleTeamAction(selectedTeam.id, 'activate')}
                      disabled={actionLoading}
                    >
                      Activate Team
                    </SimpleButton>
                  )}
                  <SimpleButton
                    variant="destructive"
                    onClick={() => handleTeamAction(selectedTeam.id, 'disqualify')}
                    disabled={actionLoading}
                  >
                    Disqualify
                  </SimpleButton>
                  <SimpleButton
                    variant="destructive"
                    onClick={() => handleTeamAction(selectedTeam.id, 'delete')}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Team</h2>
                <SimpleButton
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamData({
                      name: '',
                      leaderName: '',
                      leaderEmail: '',
                      memberNames: ['', '', '', '']
                    });
                    setError('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </SimpleButton>
              </div>
              
              <div className="space-y-6">
                {/* Team Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Information</h3>
                  
                  <div>
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input
                      id="teamName"
                      value={newTeamData.name}
                      onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                      placeholder="Enter team name..."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Team Leader */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Leader</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leaderName">Leader Name *</Label>
                      <Input
                        id="leaderName"
                        value={newTeamData.leaderName}
                        onChange={(e) => setNewTeamData({ ...newTeamData, leaderName: e.target.value })}
                        placeholder="Enter leader name..."
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="leaderEmail">Leader Email *</Label>
                      <Input
                        id="leaderEmail"
                        type="email"
                        value={newTeamData.leaderEmail}
                        onChange={(e) => setNewTeamData({ ...newTeamData, leaderEmail: e.target.value })}
                        placeholder="Enter leader email..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Members (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add up to 4 additional team members. Leave blank if not needed.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newTeamData.memberNames.map((memberName, index) => (
                      <div key={index}>
                        <Label htmlFor={`member${index + 1}`}>Member {index + 1}</Label>
                        <Input
                          id={`member${index + 1}`}
                          value={memberName}
                          onChange={(e) => updateNewTeamMember(index, e.target.value)}
                          placeholder={`Enter member ${index + 1} name...`}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <SimpleButton
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewTeamData({
                        name: '',
                        leaderName: '',
                        leaderEmail: '',
                        memberNames: ['', '', '', '']
                      });
                      setError('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </SimpleButton>
                  <SimpleButton
                    onClick={handleCreateTeam}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={actionLoading || !newTeamData.name.trim() || !newTeamData.leaderName.trim() || !newTeamData.leaderEmail.trim()}
                  >
                    {actionLoading ? 'Creating...' : 'Create Team'}
                  </SimpleButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
