'use client';

import { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Trophy, AlertTriangle } from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: QuizOption[];
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  orderIndex: number;
}

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  timeSpent: number;
}

interface QuizResult {
  success: boolean;
  totalScore: number;
  maxPossibleScore: number;
  questionsAnswered: number;
}

interface QuizComponentProps {
  onComplete?: (answers: QuizAnswer[], score: number) => void;
}

export default function QuizComponent({ onComplete }: QuizComponentProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/quiz');
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      } else {
        console.error('Failed to fetch questions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeQuiz = async () => {
    setSubmitting(true);
    
    try {
      // Include current answer if selected
      const finalAnswers = [...answers];
      if (selectedOption) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        finalAnswers.push({
          questionId: questions[currentQuestionIndex].id,
          selectedOptionId: selectedOption,
          timeSpent
        });
      }

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      });

      const result = await response.json();
      
      if (result.success) {
        setQuizResult(result);
        setQuizCompleted(true);
        onComplete?.(finalAnswers, result.totalScore);
      } else {
        console.error('Failed to submit quiz:', result.error);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    // Save answer if one was selected
    if (selectedOption) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      const answer: QuizAnswer = {
        questionId: questions[currentQuestionIndex].id,
        selectedOptionId: selectedOption,
        timeSpent
      };
      setAnswers(prev => [...prev, answer]);
    }

    // Move to next question or complete quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption('');
      setTimeRemaining(45);
      setQuestionStartTime(Date.now());
    } else {
      completeQuiz();
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuestionStartTime(Date.now());
    setTimeRemaining(45);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (quizStarted && !quizCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, quizCompleted, timeRemaining]);

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'hard': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTimeColor = () => {
    if (timeRemaining > 30) return 'text-green-600';
    if (timeRemaining > 15) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  if (quizCompleted && quizResult) {
    return (
      <SimpleCard className="w-full max-w-4xl mx-auto">
        <SimpleCardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <SimpleCardTitle className="text-2xl">Quiz Completed!</SimpleCardTitle>
          <SimpleCardDescription>Here are your results</SimpleCardDescription>
        </SimpleCardHeader>
        <SimpleCardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{quizResult.totalScore}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{quizResult.questionsAnswered}</div>
              <div className="text-sm text-gray-600">Questions Answered</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{quizResult.maxPossibleScore}</div>
              <div className="text-sm text-gray-600">Max Possible Score</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.max(0, (quizResult.totalScore / quizResult.maxPossibleScore) * 100)}%` 
              }}
            ></div>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-gray-700">
              You scored <span className="font-bold text-blue-600">{quizResult.totalScore}</span> out of{' '}
              <span className="font-bold">{quizResult.maxPossibleScore}</span> possible points.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your score will be combined with voting results for the final ranking.
            </p>
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
            Test your entrepreneurship and innovation knowledge
          </SimpleCardDescription>
        </SimpleCardHeader>
        <SimpleCardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">45s</div>
              <div className="text-sm text-gray-600">Per Question</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You have 45 seconds per question</li>
              <li>• Each question has different point values (+4, +3, +2, +1, 0, -1, -2)</li>
              <li>• Choose the best answer for maximum points</li>
              <li>• Your final score will be combined with voting results</li>
              <li>• Once started, you cannot pause the quiz</li>
            </ul>
          </div>
          
          <button 
            onClick={startQuiz} 
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl text-lg"
          >
            Start Quiz
          </button>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SimpleCard className="w-full max-w-4xl mx-auto">
      <SimpleCardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="flex items-center gap-2">
            {getDifficultyIcon(currentQuestion.difficulty)}
            {currentQuestion.difficulty.toUpperCase()}
          </Badge>
          <div className={`flex items-center gap-2 font-mono text-lg ${getTimeColor()}`}>
            <Clock className="h-5 w-5" />
            {timeRemaining}s
          </div>
        </div>
        
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
      </SimpleCardHeader>
      
      <SimpleCardContent className="space-y-6">
        <div>
          <SimpleCardTitle className="text-xl mb-4">{currentQuestion.question}</SimpleCardTitle>
        </div>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedOption === option.id && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
                <span>{option.text}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-500">
            Select an answer to continue
          </div>
          <button
            onClick={handleNextQuestion}
            disabled={!selectedOption || submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 
             currentQuestionIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
          </button>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
}
