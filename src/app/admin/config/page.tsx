'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { SimpleButton } from '@/components/ui/simple-button';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Clock, 
  Trophy, 
  Users, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface ContestRound {
  id: string;
  name: string;
  title: string;
  description: string;
  duration: number; // minutes
  maxTeams: number;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  type: 'quiz' | 'voting' | 'presentation' | 'final';
}

interface QuizOption {
  id?: string;
  option_text: string;
  points: number;
  is_correct: boolean;
  option_order: number;
  category: string;
}

interface QuizQuestion {
  id?: string;
  question: string;
  is_active: boolean;
  options: QuizOption[];
}

interface ContestConfig {
  contestName: string;
  contestDescription: string;
  totalRounds: number;
  maxTeamsPerRound: number;
  teamSize: number;
  registrationDeadline: string;
  contestStartDate: string;
  contestEndDate: string;
  timeZone: string;
  
  // Quiz Configuration
  quizDuration: number; // minutes
  questionsPerQuiz: number;
  quizTimePerQuestion: number; // seconds
  quizPassingScore: number; // percentage
  
  // Voting Configuration
  votingEnabled: boolean;
  votingDuration: number; // minutes
  maxDownvotes: number;
  pitchDuration: number; // seconds
  votingWindow: number; // seconds
  
  // Scoring Configuration
  quizWeight: number; // percentage
  votingWeight: number; // percentage
  offlineWeight: number; // percentage
  
  // System Configuration
  autoAdvanceRounds: boolean;
  enableRealTimeUpdates: boolean;
  allowLateSubmissions: boolean;
  maxLateSubmissionTime: number; // minutes
  
  rounds: ContestRound[];
  questions: QuizQuestion[];
}

export default function ContestConfigurationPage() {
  const [config, setConfig] = useState<ContestConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const { admin, loading: contextLoading } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!contextLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, contextLoading, router]);

  useEffect(() => {
    if (admin) {
      fetchContestConfig();
    }
  }, [admin]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'quiz', 'voting', 'questions', 'rounds'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchContestConfig = async () => {
    try {
      setLoading(true);
      
      // Mock API call - in real implementation, fetch from /api/admin/config
      const mockConfig: ContestConfig = {
        contestName: 'Techpreneur 3.0 Summit',
        contestDescription: 'Innovation Challenge for emerging entrepreneurs',
        totalRounds: 3,
        maxTeamsPerRound: 50,
        teamSize: 5,
        registrationDeadline: '2025-02-15T23:59:59',
        contestStartDate: '2025-02-20T09:00:00',
        contestEndDate: '2025-02-22T18:00:00',
        timeZone: 'Asia/Kolkata',
        
        quizDuration: 30,
        questionsPerQuiz: 15,
        quizTimePerQuestion: 45,
        quizPassingScore: 60,
        
        votingEnabled: true,
        votingDuration: 120,
        maxDownvotes: 3,
        pitchDuration: 90,
        votingWindow: 30,
        
        quizWeight: 40,
        votingWeight: 30,
        offlineWeight: 30,
        
        autoAdvanceRounds: false,
        enableRealTimeUpdates: true,
        allowLateSubmissions: true,
        maxLateSubmissionTime: 10,
        
        rounds: [
          {
            id: 'round1',
            name: 'round1',
            title: 'Quiz Round',
            description: 'MCQ-based quiz testing entrepreneurship knowledge',
            duration: 30,
            maxTeams: 50,
            isActive: false,
            type: 'quiz'
          },
          {
            id: 'round2',
            name: 'round2', 
            title: 'Voting Round',
            description: 'Team presentations with peer voting',
            duration: 120,
            maxTeams: 20,
            isActive: false,
            type: 'voting'
          },
          {
            id: 'round3',
            name: 'round3',
            title: 'Final Round',
            description: 'Final presentations and evaluation',
            duration: 180,
            maxTeams: 10,
            isActive: false,
            type: 'final'
          }
        ],
        
        questions: [
          {
            id: 'q1',
            question: 'What is the primary goal of entrepreneurship?',
            options: [
              { id: 'q1_a', option_text: 'To make maximum profit', points: 5, is_correct: false, option_order: 1, category: 'Capital' },
              { id: 'q1_b', option_text: 'To create value and solve problems', points: 10, is_correct: true, option_order: 2, category: 'Strategy' },
              { id: 'q1_c', option_text: 'To become famous', points: -2, is_correct: false, option_order: 3, category: 'Marketing' },
              { id: 'q1_d', option_text: 'To work independently', points: 3, is_correct: false, option_order: 4, category: 'Team Building' }
            ],
            is_active: true
          },
          {
            id: 'q2',
            question: 'Which of the following are key components of a business model canvas?',
            options: [
              { id: 'q2_a', option_text: 'Value Propositions', points: 8, is_correct: true, option_order: 1, category: 'Strategy' },
              { id: 'q2_b', option_text: 'Customer Segments', points: 8, is_correct: true, option_order: 2, category: 'Marketing' },
              { id: 'q2_c', option_text: 'Personal Hobbies', points: -5, is_correct: false, option_order: 3, category: 'Marketing' },
              { id: 'q2_d', option_text: 'Revenue Streams', points: 8, is_correct: true, option_order: 4, category: 'Capital' },
              { id: 'q2_e', option_text: 'Key Partnerships', points: 8, is_correct: true, option_order: 5, category: 'Team Building' }
            ],
            is_active: true
          },
          {
            id: 'q3',
            question: 'Lean startup methodology emphasizes building a minimum viable product (MVP) first.',
            options: [
              { id: 'q3_a', option_text: 'True', points: 10, is_correct: true, option_order: 1, category: 'Strategy' },
              { id: 'q3_b', option_text: 'False', points: -3, is_correct: false, option_order: 2, category: 'Strategy' }
            ],
            is_active: true
          }
        ]
      };

      setConfig(mockConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError('');
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleRoundAction = async (roundId: string, action: 'start' | 'stop' | 'reset') => {
    if (!config) return;

    try {
      setSaving(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setConfig({
        ...config,
        rounds: config.rounds.map(round => 
          round.id === roundId 
            ? { 
                ...round, 
                isActive: action === 'start',
                startTime: action === 'start' ? new Date().toISOString() : undefined,
                endTime: action === 'stop' ? new Date().toISOString() : undefined
              }
            : { ...round, isActive: false } // Only one round can be active
        )
      });
      
      setSuccess(`Round ${action}ed successfully!`);
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to update round status');
    } finally {
      setSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateConfig = (field: keyof ContestConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRound = (roundId: string, field: keyof ContestRound, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      rounds: config.rounds.map(round =>
        round.id === roundId ? { ...round, [field]: value } : round
      )
    });
  };

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading contest configuration...</p>
        </div>
      </div>
    );
  }

  if (!admin || !config) {
    return null;
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'quiz', label: 'Quiz Settings', icon: Trophy },
    { id: 'voting', label: 'Voting Settings', icon: Users },
    { id: 'questions', label: 'Questions Bank', icon: BookOpen },
    { id: 'rounds', label: 'Rounds Management', icon: Clock },
  ];

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
                <Settings className="h-6 w-6 mr-2 text-blue-600" />
                Contest Configuration
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <SimpleButton
                onClick={fetchContestConfig}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </SimpleButton>
              <SimpleButton
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </SimpleButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <SimpleAlert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <SimpleAlertDescription>{error}</SimpleAlertDescription>
          </SimpleAlert>
        )}

        {success && (
          <SimpleAlert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <SimpleAlertDescription className="text-green-700 dark:text-green-400">
              {success}
            </SimpleAlertDescription>
          </SimpleAlert>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>Contest Information</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contestName">Contest Name</Label>
                      <Input
                        id="contestName"
                        value={config.contestName}
                        onChange={(e) => updateConfig('contestName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Input
                        id="teamSize"
                        type="number"
                        value={config.teamSize}
                        onChange={(e) => updateConfig('teamSize', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalRounds">Total Rounds</Label>
                      <Input
                        id="totalRounds"
                        type="number"
                        value={config.totalRounds}
                        onChange={(e) => updateConfig('totalRounds', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxTeamsPerRound">Max Teams Per Round</Label>
                      <Input
                        id="maxTeamsPerRound"
                        type="number"
                        value={config.maxTeamsPerRound}
                        onChange={(e) => updateConfig('maxTeamsPerRound', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contestDescription">Contest Description</Label>
                    <Input
                      id="contestDescription"
                      value={config.contestDescription}
                      onChange={(e) => updateConfig('contestDescription', e.target.value)}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>Contest Dates & Time</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                      <Input
                        id="registrationDeadline"
                        type="datetime-local"
                        value={config.registrationDeadline.slice(0, 16)}
                        onChange={(e) => updateConfig('registrationDeadline', e.target.value + ':00')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contestStartDate">Contest Start</Label>
                      <Input
                        id="contestStartDate"
                        type="datetime-local"
                        value={config.contestStartDate.slice(0, 16)}
                        onChange={(e) => updateConfig('contestStartDate', e.target.value + ':00')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contestEndDate">Contest End</Label>
                      <Input
                        id="contestEndDate"
                        type="datetime-local"
                        value={config.contestEndDate.slice(0, 16)}
                        onChange={(e) => updateConfig('contestEndDate', e.target.value + ':00')}
                      />
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>Scoring Configuration</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quizWeight">Quiz Weight (%)</Label>
                      <Input
                        id="quizWeight"
                        type="number"
                        value={config.quizWeight}
                        onChange={(e) => updateConfig('quizWeight', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="votingWeight">Voting Weight (%)</Label>
                      <Input
                        id="votingWeight"
                        type="number"
                        value={config.votingWeight}
                        onChange={(e) => updateConfig('votingWeight', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="offlineWeight">Offline Weight (%)</Label>
                      <Input
                        id="offlineWeight"
                        type="number"
                        value={config.offlineWeight}
                        onChange={(e) => updateConfig('offlineWeight', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total: {config.quizWeight + config.votingWeight + config.offlineWeight}% 
                    {config.quizWeight + config.votingWeight + config.offlineWeight !== 100 && (
                      <span className="text-red-500 ml-2">⚠️ Should equal 100%</span>
                    )}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {/* Quiz Settings */}
          {activeTab === 'quiz' && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>Quiz Configuration</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quizDuration">Quiz Duration (minutes)</Label>
                    <Input
                      id="quizDuration"
                      type="number"
                      value={config.quizDuration}
                      onChange={(e) => updateConfig('quizDuration', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="questionsPerQuiz">Questions Per Quiz</Label>
                    <Input
                      id="questionsPerQuiz"
                      type="number"
                      value={config.questionsPerQuiz}
                      onChange={(e) => updateConfig('questionsPerQuiz', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quizTimePerQuestion">Time Per Question (seconds)</Label>
                    <Input
                      id="quizTimePerQuestion"
                      type="number"
                      value={config.quizTimePerQuestion}
                      onChange={(e) => updateConfig('quizTimePerQuestion', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quizPassingScore">Passing Score (%)</Label>
                    <Input
                      id="quizPassingScore"
                      type="number"
                      value={config.quizPassingScore}
                      onChange={(e) => updateConfig('quizPassingScore', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* Voting Settings */}
          {activeTab === 'voting' && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>Voting Configuration</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="votingEnabled"
                    checked={config.votingEnabled}
                    onChange={(e) => updateConfig('votingEnabled', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="votingEnabled">Enable Voting Round</Label>
                </div>
                
                {config.votingEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="votingDuration">Voting Round Duration (minutes)</Label>
                      <Input
                        id="votingDuration"
                        type="number"
                        value={config.votingDuration}
                        onChange={(e) => updateConfig('votingDuration', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxDownvotes">Max Downvotes Per Team</Label>
                      <Input
                        id="maxDownvotes"
                        type="number"
                        value={config.maxDownvotes}
                        onChange={(e) => updateConfig('maxDownvotes', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pitchDuration">Pitch Duration (seconds)</Label>
                      <Input
                        id="pitchDuration"
                        type="number"
                        value={config.pitchDuration}
                        onChange={(e) => updateConfig('pitchDuration', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="votingWindow">Voting Window (seconds)</Label>
                      <Input
                        id="votingWindow"
                        type="number"
                        value={config.votingWindow}
                        onChange={(e) => updateConfig('votingWindow', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* Questions Bank */}
          {activeTab === 'questions' && (
            <QuestionBankTab />
          )}

          {/* Rounds Management */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
              {config.rounds.map((round) => (
                <SimpleCard key={round.id}>
                  <SimpleCardHeader>
                    <div className="flex justify-between items-center">
                      <SimpleCardTitle className="flex items-center">
                        {round.title}
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          round.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {round.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </SimpleCardTitle>
                      <div className="flex items-center space-x-2">
                        {!round.isActive ? (
                          <SimpleButton
                            size="sm"
                            onClick={() => handleRoundAction(round.id, 'start')}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </SimpleButton>
                        ) : (
                          <SimpleButton
                            size="sm"
                            onClick={() => handleRoundAction(round.id, 'stop')}
                            disabled={saving}
                            variant="destructive"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                          </SimpleButton>
                        )}
                        <SimpleButton
                          size="sm"
                          onClick={() => handleRoundAction(round.id, 'reset')}
                          disabled={saving}
                          variant="outline"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset
                        </SimpleButton>
                      </div>
                    </div>
                  </SimpleCardHeader>
                  <SimpleCardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label>Round Name</Label>
                        <Input
                          value={round.name}
                          onChange={(e) => updateRound(round.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={round.duration}
                          onChange={(e) => updateRound(round.id, 'duration', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Max Teams</Label>
                        <Input
                          type="number"
                          value={round.maxTeams}
                          onChange={(e) => updateRound(round.id, 'maxTeams', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <select
                          value={round.type}
                          onChange={(e) => updateRound(round.id, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="quiz">Quiz</option>
                          <option value="voting">Voting</option>
                          <option value="presentation">Presentation</option>
                          <option value="final">Final</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={round.description}
                        onChange={(e) => updateRound(round.id, 'description', e.target.value)}
                      />
                    </div>
                    {round.startTime && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Started: {new Date(round.startTime).toLocaleString()}
                      </div>
                    )}
                    {round.endTime && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Ended: {new Date(round.endTime).toLocaleString()}
                      </div>
                    )}
                  </SimpleCardContent>
                </SimpleCard>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Question Bank Tab Component
function QuestionBankTab() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  const [formData, setFormData] = useState<QuizQuestion>({
    question: '',
    is_active: true,
    options: [
      { option_text: '', points: 0, is_correct: false, option_order: 1, category: 'Capital' },
      { option_text: '', points: 0, is_correct: false, option_order: 2, category: 'Capital' },
      { option_text: '', points: 0, is_correct: false, option_order: 3, category: 'Capital' },
      { option_text: '', points: 0, is_correct: false, option_order: 4, category: 'Capital' }
    ]
  });

  const categories = [
    'Capital', 'Marketing', 'Strategy', 'Team Building'
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/questions');
      if (!response.ok) throw new Error('Failed to load questions');
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(`Failed to load questions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      is_active: true,
      options: [
        { option_text: '', points: 0, is_correct: false, option_order: 1, category: 'Capital' },
        { option_text: '', points: 0, is_correct: false, option_order: 2, category: 'Capital' },
        { option_text: '', points: 0, is_correct: false, option_order: 3, category: 'Capital' },
        { option_text: '', points: 0, is_correct: false, option_order: 4, category: 'Capital' }
      ]
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  const handleEdit = (question: QuizQuestion) => {
    setFormData({ ...question });
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.question.trim()) {
        setError('Question is required');
        return;
      }

      const hasCorrectAnswer = formData.options.some(opt => opt.is_correct && opt.option_text.trim());
      if (!hasCorrectAnswer) {
        setError('At least one option must be marked as correct and have text');
        return;
      }

      // Validate that all options have different categories
      const usedCategories = formData.options
        .filter(opt => opt.option_text.trim())
        .map(opt => opt.category);
      const uniqueCategories = new Set(usedCategories);
      
      if (usedCategories.length !== uniqueCategories.size) {
        setError('Each option must have a different category. Please select unique categories for all options.');
        return;
      }

      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion 
        ? `/api/admin/questions?id=${editingQuestion.id}`
        : '/api/admin/questions';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      setSuccess(editingQuestion ? 'Question updated successfully!' : 'Question added successfully!');
      resetForm();
      loadQuestions();
    } catch (err) {
      setError(`Failed to save question: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete question');

      setSuccess('Question deleted successfully!');
      loadQuestions();
    } catch (err) {
      setError(`Failed to delete question: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const toggleQuestionStatus = async (questionId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update question status');

      setSuccess(`Question ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadQuestions();
    } catch (err) {
      setError(`Failed to update question status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateOption = (index: number, field: keyof QuizOption, value: string | number | boolean) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...formData.options];
    newOptions.push({
      option_text: '',
      points: 0,
      is_correct: false,
      option_order: newOptions.length + 1,
      category: 'Capital'
    });
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      setError('At least 2 options are required');
      return;
    }
    
    const newOptions = formData.options.filter((_, i) => i !== index);
    // Reorder remaining options
    newOptions.forEach((option, i) => {
      option.option_order = i + 1;
    });
    setFormData({ ...formData, options: newOptions });
  };

  // Helper function to get already used categories for current question
  const getUsedCategories = (currentIndex: number): string[] => {
    return formData.options
      .map((option, index) => index !== currentIndex ? option.category : null)
      .filter(category => category !== null) as string[];
  };

  // Helper function to check if a category is available for selection
  const isCategoryAvailable = (category: string, currentIndex: number): boolean => {
    const usedCategories = getUsedCategories(currentIndex);
    return !usedCategories.includes(category);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <SimpleAlert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">&times;</button>
          </div>
        </SimpleAlert>
      )}
      {success && (
        <SimpleAlert className="mb-4 border-green-500/50 text-green-600 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <div className="flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">&times;</button>
          </div>
        </SimpleAlert>
      )}

      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <SimpleCardTitle>Question Bank Management</SimpleCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {questions.length}/15 questions added (Each question = 1 minute)
              </p>
            </div>
            <SimpleButton
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={questions.length >= 15 && !showForm}
            >
              {showForm ? 'Cancel' : questions.length >= 15 ? 'Maximum Questions Reached' : 'Add New Question'}
            </SimpleButton>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          {showForm && (
            <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Question *</Label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-24 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium">Active in Quiz</Label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <Label className="block text-sm font-medium">Answer Options *</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Categories used: {new Set(formData.options.filter(opt => opt.option_text.trim()).map(opt => opt.category)).size}/4
                        {formData.options.filter(opt => opt.option_text.trim()).length > new Set(formData.options.filter(opt => opt.option_text.trim()).map(opt => opt.category)).size && 
                          <span className="text-red-500 ml-1">(Duplicates detected)</span>
                        }
                      </p>
                    </div>
                    <SimpleButton
                      type="button"
                      onClick={addOption}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </SimpleButton>
                  </div>
                  
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={option.option_text}
                          onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          value={option.points}
                          onChange={(e) => updateOption(index, 'points', parseInt(e.target.value) || 0)}
                          placeholder="Points"
                        />
                      </div>
                      <div className="w-32">
                        <select
                          value={option.category}
                          onChange={(e) => updateOption(index, 'category', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {categories.map(cat => (
                            <option 
                              key={cat} 
                              value={cat}
                              disabled={!isCategoryAvailable(cat, index) && option.category !== cat}
                              style={{
                                color: !isCategoryAvailable(cat, index) && option.category !== cat ? '#9CA3AF' : 'inherit',
                                backgroundColor: !isCategoryAvailable(cat, index) && option.category !== cat ? '#F3F4F6' : 'inherit'
                              }}
                            >
                              {cat} {!isCategoryAvailable(cat, index) && option.category !== cat ? '(Used)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                          className="mr-1"
                        />
                        <span className="text-xs">Correct</span>
                      </div>
                      {formData.options.length > 2 && (
                        <SimpleButton
                          type="button"
                          onClick={() => removeOption(index)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </SimpleButton>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <SimpleButton
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!formData.question.trim() || !formData.options.some(opt => opt.is_correct && opt.option_text.trim())}
                  >
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </SimpleButton>
                  <SimpleButton
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                  >
                    Cancel
                  </SimpleButton>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
            
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions found. Add your first question!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg text-gray-900 dark:text-white">{question.question}</h4>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className={question.is_active ? 'text-green-600' : 'text-red-600'}>
                            {question.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <SimpleButton
                          onClick={() => handleEdit(question)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </SimpleButton>
                        <SimpleButton
                          onClick={() => toggleQuestionStatus(question.id!, question.is_active)}
                          size="sm"
                          className={question.is_active ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                        >
                          {question.is_active ? 'Deactivate' : 'Activate'}
                        </SimpleButton>
                        <SimpleButton
                          onClick={() => handleDelete(question.id!)}
                          size="sm"
                          variant="destructive"
                        >
                          Delete
                        </SimpleButton>
                      </div>
                    </div>
                    
                    <div className="ml-4 space-y-1">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            option.is_correct ? 'bg-green-500' : 'bg-gray-300'
                          }`}></span>
                          <span className="flex-1">{option.option_text}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">({option.points} pts)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
}
