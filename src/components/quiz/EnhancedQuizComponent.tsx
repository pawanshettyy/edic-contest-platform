'use client';

import { useState, useEffect, useCallback } from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Trophy, Users, Maximize, Minimize, Home, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface QuizOption {
  id: string;
  text: string;
  category?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: QuizOption[];
  timeLimit: number;
  orderIndex: number;
}

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  timeSpent: number;
}

interface QuestionStatus {
  questionId: string;
  status: 'not-visited' | 'not-answered' | 'answered' | 'marked-for-review';
  selectedOptionId?: string;
  visitTime?: number;
}

interface QuizResult {
  success: boolean;
  memberScore: number;
  teamTotalScore: number;
  membersCompleted: number;
  maxPossibleScore: number;
  questionsAnswered: number;
  message: string;
  memberApproachScores: {
    capital: number;
    marketing: number;
    strategy: number;
    team: number;
  };
  teamApproachScores: {
    capital: number;
    marketing: number;
    strategy: number;
    team: number;
  };
}

interface QuizComponentProps {
  onComplete?: (answers: QuizAnswer[], score: number) => void;
}

export default function QuizComponent({ onComplete }: QuizComponentProps) {
  const { user, team } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map()); // questionId -> selectedOptionId
  const [questionStatuses, setQuestionStatuses] = useState<Map<string, QuestionStatus>>(new Map());
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(15 * 60); // 15 minutes total
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFinalSubmit, setShowFinalSubmit] = useState(false);

  // Fullscreen functions
  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Could not enter fullscreen:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Could not exit fullscreen:', err);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen]);

  // Exit fullscreen when quiz completes
  useEffect(() => {
    if (quizCompleted && isFullscreen) {
      exitFullscreen();
    }
  }, [quizCompleted, isFullscreen, exitFullscreen]);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (user?.name && team?.name) {
        params.append('memberName', user.name);
        params.append('teamName', team.name);
      }
      
      const response = await fetch(`/api/quiz?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.hasSubmitted) {
          // User has already submitted - show completion message
          setQuizCompleted(true);
          setQuizResult({
            success: true,
            memberScore: data.existingSubmission.score,
            teamTotalScore: data.existingSubmission.score, // Will be updated by team submissions
            membersCompleted: 1,
            maxPossibleScore: data.totalQuestions * 4, // Assuming max 4 points per question
            questionsAnswered: data.totalQuestions,
            memberApproachScores: data.existingSubmission.approachScores,
            teamApproachScores: data.existingSubmission.approachScores, // Simplified for now
            message: `You have already completed this quiz! Your score: ${data.existingSubmission.score}`
          });
        } else {
          setQuestions(data.questions);
        }
      } else {
        setError('Failed to fetch questions: ' + data.error);
      }
    } catch (error) {
      setError('Error fetching questions. Please try again.');
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.name, team?.name]);

  const completeQuiz = useCallback(async () => {
    if (!user || !team) {
      setError('User authentication required');
      return;
    }

    setSubmitting(true);
    
    try {
      // Save current answer if selected
      const currentAnswers = new Map(answers);
      if (selectedOption) {
        currentAnswers.set(questions[currentQuestionIndex].id, selectedOption);
      }

      // Convert map to array format for API
      const finalAnswers: QuizAnswer[] = Array.from(currentAnswers.entries()).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
        timeSpent: Math.floor((Date.now() - quizStartTime) / 1000)
      }));

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: finalAnswers,
          memberName: user.name,
          teamName: team.name
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setQuizResult(result);
        setQuizCompleted(true);
        onComplete?.(finalAnswers, result.memberScore);
      } else {
        setError('Failed to submit quiz: ' + result.error);
      }
    } catch (error) {
      setError('Error submitting quiz. Please try again.');
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  }, [user, team, answers, selectedOption, questions, currentQuestionIndex, quizStartTime, onComplete]);

  // Navigation functions
  const navigateToQuestion = useCallback((questionIndex: number) => {
    // Save current answer before navigating
    if (selectedOption) {
      setAnswers(prev => {
        const newAnswers = new Map(prev);
        newAnswers.set(questions[currentQuestionIndex].id, selectedOption);
        return newAnswers;
      });
      setQuestionStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(questions[currentQuestionIndex].id, {
          questionId: questions[currentQuestionIndex].id,
          status: 'answered',
          selectedOptionId: selectedOption,
          visitTime: Date.now()
        });
        return newStatuses;
      });
    } else if (questionStatuses.get(questions[currentQuestionIndex]?.id)?.status === 'not-visited') {
      // Mark as visited but not answered
      setQuestionStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(questions[currentQuestionIndex].id, {
          questionId: questions[currentQuestionIndex].id,
          status: 'not-answered',
          visitTime: Date.now()
        });
        return newStatuses;
      });
    }

    // Navigate to new question
    setCurrentQuestionIndex(questionIndex);
    
    // Load saved answer for the new question
    const savedAnswer = answers.get(questions[questionIndex]?.id);
    setSelectedOption(savedAnswer || '');

    // Update status to visited if it's the first time
    if (!questionStatuses.has(questions[questionIndex]?.id)) {
      setQuestionStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(questions[questionIndex].id, {
          questionId: questions[questionIndex].id,
          status: 'not-answered',
          visitTime: Date.now()
        });
        return newStatuses;
      });
    }
  }, [selectedOption, questions, currentQuestionIndex, answers, questionStatuses]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, navigateToQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    } else {
      // For the last question, show final submit confirmation instead of auto-submitting
      setShowFinalSubmit(true);
    }
  }, [currentQuestionIndex, questions.length, navigateToQuestion]);

  const saveAndNext = useCallback(() => {
    // Save current answer
    if (selectedOption) {
      setAnswers(prev => {
        const newAnswers = new Map(prev);
        newAnswers.set(questions[currentQuestionIndex].id, selectedOption);
        return newAnswers;
      });
      setQuestionStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(questions[currentQuestionIndex].id, {
          questionId: questions[currentQuestionIndex].id,
          status: 'answered',
          selectedOptionId: selectedOption,
          visitTime: Date.now()
        });
        return newStatuses;
      });
    }
    
    // For last question, don't auto-submit, just show final submit state
    if (currentQuestionIndex === questions.length - 1) {
      setShowFinalSubmit(true);
    } else {
      handleNextQuestion();
    }
  }, [selectedOption, questions, currentQuestionIndex, handleNextQuestion]);

  const startQuiz = async () => {
    setQuizStarted(true);
    setQuizStartTime(Date.now());
    setTotalTimeRemaining(15 * 60); // 15 minutes
    
    // Initialize question statuses
    const initialStatuses = new Map<string, QuestionStatus>();
    questions.forEach(q => {
      initialStatuses.set(q.id, {
        questionId: q.id,
        status: 'not-visited'
      });
    });
    setQuestionStatuses(initialStatuses);
    
    // Mark first question as visited
    if (questions.length > 0) {
      initialStatuses.set(questions[0].id, {
        questionId: questions[0].id,
        status: 'not-answered',
        visitTime: Date.now()
      });
      setQuestionStatuses(initialStatuses);
    }
    
    // Enter fullscreen mode
    await enterFullscreen();
  };

  // Central timer for the entire quiz
  useEffect(() => {
    if (quizStarted && !quizCompleted && totalTimeRemaining > 0) {
      const timer = setInterval(() => {
        setTotalTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            completeQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, quizCompleted, totalTimeRemaining, completeQuiz]);

  // Helper functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (totalTimeRemaining > 300) return 'text-green-600'; // >5 minutes
    if (totalTimeRemaining > 120) return 'text-yellow-600'; // >2 minutes
    return 'text-red-600';
  };

  const getQuestionStatus = (questionId: string) => {
    const status = questionStatuses.get(questionId);
    if (answers.has(questionId)) return 'answered';
    if (status?.status === 'not-visited') return 'not-visited';
    return 'not-answered';
  };

  // Initialize questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  if (!user || !team) {
    return (
      <SimpleCard className="w-full max-w-2xl mx-auto">
        <SimpleCardHeader>
          <SimpleCardTitle>Authentication Required</SimpleCardTitle>
          <SimpleCardDescription>
            Please sign in to your team account to access the quiz.
          </SimpleCardDescription>
        </SimpleCardHeader>
      </SimpleCard>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SimpleCard className="w-full max-w-2xl mx-auto">
        <SimpleCardHeader>
          <SimpleCardTitle className="text-red-600">Error</SimpleCardTitle>
          <SimpleCardDescription className="text-red-600">
            {error}
          </SimpleCardDescription>
        </SimpleCardHeader>
        <SimpleCardContent>
          <button 
            onClick={fetchQuestions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  if (quizCompleted && quizResult) {
    return (
      <SimpleCard className="w-full max-w-4xl mx-auto">
        <SimpleCardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <SimpleCardTitle className="text-2xl">Quiz Completed!</SimpleCardTitle>
          <SimpleCardDescription>{quizResult.message}</SimpleCardDescription>
        </SimpleCardHeader>
        <SimpleCardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{quizResult.memberScore}</div>
              <div className="text-sm text-gray-600">Your Total Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{quizResult.teamTotalScore}</div>
              <div className="text-sm text-gray-600">Team Total</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{quizResult.membersCompleted}</div>
              <div className="text-sm text-gray-600">Members Completed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{quizResult.maxPossibleScore}</div>
              <div className="text-sm text-gray-600">Max Possible (Per Member)</div>
            </div>
          </div>

          {/* Individual Approach Scores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Approach Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{quizResult.memberApproachScores.capital}</div>
                <div className="text-xs text-gray-600">Capital</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{quizResult.memberApproachScores.marketing}</div>
                <div className="text-xs text-gray-600">Marketing</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{quizResult.memberApproachScores.strategy}</div>
                <div className="text-xs text-gray-600">Strategy</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{quizResult.memberApproachScores.team}</div>
                <div className="text-xs text-gray-600">Team Building</div>
              </div>
            </div>
          </div>

          {/* Team Approach Scores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Team Approach Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-100 rounded-lg border border-green-300">
                <div className="text-2xl font-bold text-green-700">{quizResult.teamApproachScores.capital}</div>
                <div className="text-xs text-gray-600">Capital Total</div>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                <div className="text-2xl font-bold text-blue-700">{quizResult.teamApproachScores.marketing}</div>
                <div className="text-xs text-gray-600">Marketing Total</div>
              </div>
              <div className="text-center p-3 bg-purple-100 rounded-lg border border-purple-300">
                <div className="text-2xl font-bold text-purple-700">{quizResult.teamApproachScores.strategy}</div>
                <div className="text-xs text-gray-600">Strategy Total</div>
              </div>
              <div className="text-center p-3 bg-orange-100 rounded-lg border border-orange-300">
                <div className="text-2xl font-bold text-orange-700">{quizResult.teamApproachScores.team}</div>
                <div className="text-xs text-gray-600">Team Building Total</div>
              </div>
            </div>
          </div>
          
          {/* Team Approach Analysis */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Team Approach Analysis</h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg">
              {(() => {
                const scores = quizResult.teamApproachScores;
                const maxScore = Math.max(scores.capital, scores.marketing, scores.strategy, scores.team);
                const strongestApproaches = Object.entries(scores)
                  .filter(([, score]) => score === maxScore)
                  .map(([approach]) => approach);
                
                const approachLabels = {
                  capital: 'Capital Management',
                  marketing: 'Marketing Focus',
                  strategy: 'Strategic Thinking',
                  team: 'Team Building'
                };
                
                return (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your team&apos;s strongest approach{strongestApproaches.length > 1 ? 'es' : ''}:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {strongestApproaches.map((approach) => (
                        <Badge 
                          key={approach}
                          className={`text-sm font-semibold ${
                            approach === 'capital' ? 'bg-green-200 text-green-800' :
                            approach === 'marketing' ? 'bg-blue-200 text-blue-800' :
                            approach === 'strategy' ? 'bg-purple-200 text-purple-800' :
                            'bg-orange-200 text-orange-800'
                          }`}
                        >
                          {approachLabels[approach as keyof typeof approachLabels]} ({maxScore} points)
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.max(0, (quizResult.memberScore / quizResult.maxPossibleScore) * 100)}%` 
              }}
            ></div>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-gray-700">
              Your individual score: <span className="font-bold text-blue-600">{quizResult.memberScore}</span> out of{' '}
              <span className="font-bold">{quizResult.maxPossibleScore}</span> possible points.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Team scores are accumulated from all members. Your team&apos;s current total is <span className="font-bold">{quizResult.teamTotalScore}</span> points.
            </p>
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <Home className="h-5 w-5" />
              Back to Dashboard
            </button>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  if (!quizStarted) {
    return (
      <SimpleCard className="w-full max-w-2xl mx-auto">
        <SimpleCardHeader className="text-center">
          <SimpleCardTitle className="text-2xl">Techpreneur 3.0 Quiz</SimpleCardTitle>
          <SimpleCardDescription>
            Business Decision Making Challenge - Choose Your Approach
          </SimpleCardDescription>
        </SimpleCardHeader>
        <SimpleCardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Team Member</span>
            </div>
            <p className="text-blue-700">
              <span className="font-semibold">{user.name}</span> from <span className="font-semibold">{team.name}</span>
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Business Approach Categories</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Capital</Badge>
                <span className="text-gray-600">Financial & funding solutions</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">Marketing</Badge>
                <span className="text-gray-600">Customer & market focused</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800">Strategy</Badge>
                <span className="text-gray-600">Long-term planning & systems</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800">Team Building</Badge>
                <span className="text-gray-600">People & culture solutions</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">15 min</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• The quiz will automatically enter fullscreen mode when started</li>
              <li>• You have 15 minutes total for all questions</li>
              <li>• Navigate between questions using the question panel or navigation buttons</li>
              <li>• You can skip questions and return to them later</li>
              <li>• Each question presents 4 business approaches:</li>
              <li className="ml-4">
                <span className="inline-flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">Capital</Badge>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Marketing</Badge>
                  <Badge className="bg-purple-100 text-purple-800 text-xs">Strategy</Badge>
                  <Badge className="bg-orange-100 text-orange-800 text-xs">Team Building</Badge>
                </span>
              </li>
              <li>• Choose the approach you think is most effective for each scenario</li>
              <li>• <strong>Team scores are accumulated from all members</strong></li>
              <li>• Quiz will auto-submit when time expires</li>
              <li>• Press ESC or click &quot;Exit Fullscreen&quot; to leave fullscreen mode</li>
            </ul>
          </div>
          
          <button 
            onClick={startQuiz} 
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl text-lg flex items-center justify-center gap-3"
          >
            <Maximize className="h-5 w-5" />
            Start Quiz (Fullscreen)
          </button>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 h-screen flex' : 'max-w-6xl mx-auto'}`}>
      {/* Question Navigation Panel */}
      {isFullscreen && (
        <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Timer */}
            <div className="text-center">
              <div className={`text-2xl font-mono font-bold ${getTimeColor()}`}>
                {formatTime(totalTimeRemaining)}
              </div>
              <div className="text-xs text-gray-500">Time Remaining</div>
            </div>

            {/* Progress */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{Math.round(progress)}% Complete</div>
            </div>

            {/* Question Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Questions</h3>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, index) => {
                  const questionId = questions[index].id;
                  const status = getQuestionStatus(questionId);
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`
                        w-10 h-10 rounded text-sm font-medium border-2 transition-all
                        ${isCurrent 
                          ? 'border-blue-500 bg-blue-500 text-white' 
                          : status === 'answered'
                          ? 'border-green-500 bg-green-500 text-white'
                          : status === 'not-answered'
                          ? 'border-yellow-500 bg-yellow-100 text-yellow-800'
                          : 'border-gray-300 bg-gray-100 text-gray-600'
                        }
                        hover:scale-105
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600">Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span className="text-gray-600">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Current</span>
                </div>
              </div>
            </div>

            {/* Exit Fullscreen */}
            <button
              onClick={exitFullscreen}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Exit Fullscreen (ESC)"
            >
              <Minimize className="h-4 w-4" />
              Exit Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Main Quiz Content */}
      <div className={`flex-1 ${isFullscreen ? 'overflow-y-auto' : ''}`}>
        <SimpleCard className={`w-full ${isFullscreen ? 'h-full rounded-none border-0' : 'max-w-4xl mx-auto'}`}>
          <SimpleCardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                MCQ
              </Badge>
              {!isFullscreen && (
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 font-mono text-lg ${getTimeColor()}`}>
                    <Clock className="h-5 w-5" />
                    {formatTime(totalTimeRemaining)}
                  </div>
                </div>
              )}
            </div>
            
            {!isFullscreen && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </>
            )}
          </SimpleCardHeader>
          
          <SimpleCardContent className={`space-y-6 ${isFullscreen ? 'px-8 py-6 h-full flex flex-col justify-center' : ''}`}>
            <div>
              <SimpleCardTitle className={`mb-4 ${isFullscreen ? 'text-2xl' : 'text-xl'}`}>{currentQuestion.question}</SimpleCardTitle>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const getCategoryInfo = (category?: string) => {
                  switch (category) {
                    case 'capital': return { label: 'Capital', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
                    case 'marketing': return { label: 'Marketing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
                    case 'strategy': return { label: 'Strategy', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
                    case 'team': return { label: 'Team Building', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
                    default: return null;
                  }
                };
                
                const categoryInfo = getCategoryInfo(option.category);
                
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                        selectedOption === option.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {selectedOption === option.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {categoryInfo && (
                            <Badge className={`text-xs ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Option {option.id.slice(-1).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm leading-relaxed">{option.text}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Navigation Controls */}
            <div className="flex justify-between items-center pt-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
              
              {/* Show final submit confirmation when on last question and ready to submit */}
              {showFinalSubmit ? (
                <div className="flex flex-col items-end gap-3">
                  <div className="text-sm text-gray-600 text-right">
                    <p className="font-medium">Ready to submit your quiz?</p>
                    <p>You answered {answers.size} out of {questions.length} questions.</p>
                    <p className="text-amber-600">⚠️ You cannot retake the quiz after submission.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFinalSubmit(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Review Answers
                    </button>
                    <button
                      onClick={completeQuiz}
                      disabled={submitting}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz'}
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {selectedOption && (
                    <button
                      onClick={saveAndNext}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                      <Save className="h-4 w-4" />
                      Save & Next
                    </button>
                  )}
                  
                  <button
                    onClick={handleNextQuestion}
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 
                     currentQuestionIndex === questions.length - 1 ? 'Review & Submit' : (
                       <>
                         {currentQuestionIndex < questions.length - 1 ? 'Skip' : 'Next'}
                         <ArrowRight className="h-4 w-4" />
                       </>
                     )}
                  </button>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
}
