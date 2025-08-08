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
  Edit3,
  Trash2,
  HelpCircle,
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
  id: string;
  text: string;
  points: number; // can be negative
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'multiple-select' | 'true-false';
  options: QuizOption[];
  timeLimit: number; // seconds, 0 for no limit
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string;
  isActive: boolean;
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
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const { admin, loading: contextLoading } = useAdmin();
  const router = useRouter();

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
            type: 'mcq',
            options: [
              { id: 'q1_a', text: 'To make maximum profit', points: 5, isCorrect: false },
              { id: 'q1_b', text: 'To create value and solve problems', points: 10, isCorrect: true },
              { id: 'q1_c', text: 'To become famous', points: -2, isCorrect: false },
              { id: 'q1_d', text: 'To work independently', points: 3, isCorrect: false }
            ],
            timeLimit: 45,
            difficulty: 'easy',
            category: 'Entrepreneurship Basics',
            explanation: 'Entrepreneurship is fundamentally about creating value and solving real-world problems.',
            isActive: true
          },
          {
            id: 'q2',
            question: 'Which of the following are key components of a business model canvas?',
            type: 'multiple-select',
            options: [
              { id: 'q2_a', text: 'Value Propositions', points: 8, isCorrect: true },
              { id: 'q2_b', text: 'Customer Segments', points: 8, isCorrect: true },
              { id: 'q2_c', text: 'Personal Hobbies', points: -5, isCorrect: false },
              { id: 'q2_d', text: 'Revenue Streams', points: 8, isCorrect: true },
              { id: 'q2_e', text: 'Key Partnerships', points: 8, isCorrect: true }
            ],
            timeLimit: 60,
            difficulty: 'medium',
            category: 'Business Planning',
            explanation: 'The Business Model Canvas includes 9 key building blocks including Value Propositions, Customer Segments, Revenue Streams, and Key Partnerships.',
            isActive: true
          },
          {
            id: 'q3',
            question: 'Lean startup methodology emphasizes building a minimum viable product (MVP) first.',
            type: 'true-false',
            options: [
              { id: 'q3_a', text: 'True', points: 10, isCorrect: true },
              { id: 'q3_b', text: 'False', points: -3, isCorrect: false }
            ],
            timeLimit: 30,
            difficulty: 'easy',
            category: 'Startup Methodology',
            explanation: 'The Lean Startup methodology advocates for building an MVP to test hypotheses quickly and cost-effectively.',
            isActive: true
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

  const createNewQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      question: '',
      type: 'mcq',
      options: [
        { id: `opt${Date.now()}_1`, text: '', points: 10, isCorrect: true },
        { id: `opt${Date.now()}_2`, text: '', points: -2, isCorrect: false },
        { id: `opt${Date.now()}_3`, text: '', points: -2, isCorrect: false },
        { id: `opt${Date.now()}_4`, text: '', points: -2, isCorrect: false }
      ],
      timeLimit: 45,
      difficulty: 'medium',
      category: 'General',
      explanation: '',
      isActive: true
    };
    setEditingQuestion(newQuestion);
    setShowQuestionModal(true);
  };

  const saveQuestion = () => {
    if (!config || !editingQuestion) return;
    
    const updatedQuestions = editingQuestion.id.startsWith('q' + Date.now()) 
      ? [...config.questions, editingQuestion]
      : config.questions.map(q => q.id === editingQuestion.id ? editingQuestion : q);
    
    setConfig({ ...config, questions: updatedQuestions });
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setSuccess('Question saved successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const deleteQuestion = (questionId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      questions: config.questions.filter(q => q.id !== questionId)
    });
    setSuccess('Question deleted successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateQuestionOption = (optionIndex: number, field: keyof QuizOption, value: string | number | boolean) => {
    if (!editingQuestion) return;
    const updatedOptions = editingQuestion.options.map((option, index) => 
      index === optionIndex ? { ...option, [field]: value } : option
    );
    setEditingQuestion({ ...editingQuestion, options: updatedOptions });
  };

  const addQuestionOption = () => {
    if (!editingQuestion) return;
    const newOption: QuizOption = {
      id: `opt${Date.now()}_${editingQuestion.options.length + 1}`,
      text: '',
      points: -2,
      isCorrect: false
    };
    setEditingQuestion({
      ...editingQuestion,
      options: [...editingQuestion.options, newOption]
    });
  };

  const removeQuestionOption = (optionIndex: number) => {
    if (!editingQuestion || editingQuestion.options.length <= 2) return;
    const updatedOptions = editingQuestion.options.filter((_, index) => index !== optionIndex);
    setEditingQuestion({ ...editingQuestion, options: updatedOptions });
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
            <div className="space-y-6">
              <SimpleCard>
                <SimpleCardHeader>
                  <div className="flex justify-between items-center">
                    <SimpleCardTitle>Questions Bank</SimpleCardTitle>
                    <SimpleButton
                      onClick={createNewQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </SimpleButton>
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-4">
                    {config.questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              Q{index + 1}: {question.question || 'Untitled Question'}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="capitalize">{question.type.replace('-', ' ')}</span>
                              <span className="capitalize">{question.difficulty}</span>
                              <span>{question.category}</span>
                              <span>{question.timeLimit}s</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                question.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {question.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingQuestion(question);
                                setShowQuestionModal(true);
                              }}
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </SimpleButton>
                            <SimpleButton
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </SimpleButton>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Options ({question.options.length}):</strong>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, optIndex) => (
                              <div key={option.id} className={`p-2 rounded text-sm border ${
                                option.isCorrect 
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : option.points < 0
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span> {option.text || 'Empty option'}
                                <span className={`ml-2 px-1 py-0.5 text-xs rounded ${
                                  option.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {option.points > 0 ? '+' : ''}{option.points} pts
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <HelpCircle className="h-3 w-3 inline mr-1" />
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {config.questions.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No questions added yet. Click &quot;Add Question&quot; to get started.</p>
                      </div>
                    )}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
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

      {/* Question Modal */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingQuestion.id.startsWith('q' + Date.now()) ? 'Add New Question' : 'Edit Question'}
                </h2>
                <SimpleButton
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </SimpleButton>
              </div>
              
              <div className="space-y-6">
                {/* Question Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="questionText">Question Text</Label>
                    <Input
                      id="questionText"
                      value={editingQuestion.question}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                      placeholder="Enter your question here..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="questionType">Question Type</Label>
                    <select
                      id="questionType"
                      value={editingQuestion.type}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as 'mcq' | 'multiple-select' | 'true-false' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="mcq">Multiple Choice (Single Answer)</option>
                      <option value="multiple-select">Multiple Choice (Multiple Answers)</option>
                      <option value="true-false">True/False</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={editingQuestion.difficulty}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={editingQuestion.category}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                      placeholder="e.g., Entrepreneurship, Business Planning"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={editingQuestion.timeLimit}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, timeLimit: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Answer Options</Label>
                    <SimpleButton
                      onClick={addQuestionOption}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </SimpleButton>
                  </div>
                  
                  <div className="space-y-3">
                    {editingQuestion.options.map((option, index) => (
                      <div key={option.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Option {String.fromCharCode(65 + index)}
                          </h4>
                          {editingQuestion.options.length > 2 && (
                            <SimpleButton
                              onClick={() => removeQuestionOption(index)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </SimpleButton>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <Label>Option Text</Label>
                            <Input
                              value={option.text}
                              onChange={(e) => updateQuestionOption(index, 'text', e.target.value)}
                              placeholder="Enter option text..."
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={option.points}
                              onChange={(e) => updateQuestionOption(index, 'points', parseInt(e.target.value) || 0)}
                              placeholder="Points"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label>Correct Answer</Label>
                            <div className="mt-2">
                              <input
                                type={editingQuestion.type === 'multiple-select' ? 'checkbox' : 'radio'}
                                name="correctAnswer"
                                checked={option.isCorrect}
                                onChange={(e) => {
                                  if (editingQuestion.type === 'multiple-select') {
                                    updateQuestionOption(index, 'isCorrect', e.target.checked);
                                  } else {
                                    // For single-select, uncheck all others
                                    editingQuestion.options.forEach((_, optIndex) => {
                                      updateQuestionOption(optIndex, 'isCorrect', optIndex === index);
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600"
                              />
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <div className={`mt-7 px-2 py-1 text-xs rounded text-center ${
                              option.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {option.points > 0 ? '+' : ''}{option.points} pts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Input
                    id="explanation"
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    placeholder="Provide an explanation for the correct answer..."
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingQuestion.isActive}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, isActive: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor="isActive">Question is active and can be used in quizzes</Label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <SimpleButton
                    onClick={() => {
                      setShowQuestionModal(false);
                      setEditingQuestion(null);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </SimpleButton>
                  <SimpleButton
                    onClick={saveQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!editingQuestion.question.trim() || editingQuestion.options.some(opt => !opt.text.trim())}
                  >
                    Save Question
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
