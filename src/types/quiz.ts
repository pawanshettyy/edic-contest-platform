export interface QuizQuestion {
  id: string;
  roundId: string;
  question: string;
  type: QuestionType;
  options: QuizQuestionOption[];
  explanation?: string;
  timeLimit: number; // in seconds
  difficulty: QuestionDifficulty;
  tags: string[];
  orderIndex: number;
  createdAt: Date;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
  points: number; // Can be +4, -2, 0, etc.
  isCorrect?: boolean; // Optional for admin reference
}

export interface QuizAttempt {
  id: string;
  teamId: string;
  roundId: string;
  contestId: string;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number; // in seconds
  status: AttemptStatus;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  isCompleted: boolean;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  points: number; // Points earned from this answer
  timeSpent: number; // in seconds
  answeredAt: Date;
}

export interface QuizSession {
  id: string;
  attemptId: string;
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  timeRemaining: number; // in seconds
  answers: Record<string, QuizAnswer>;
  isSubmitted: boolean;
  startedAt: Date;
}

export interface QuizResult {
  attemptId: string;
  teamId: string;
  teamName: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
  rank: number;
  details: QuizResultDetail[];
  completedAt: Date;
}

export interface QuizResultDetail {
  questionId: string;
  question: string;
  selectedAnswer: number | string;
  correctAnswer: number | string;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

export interface QuizStatistics {
  roundId: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averageTime: number;
  questionStats: QuestionStatistics[];
}

export interface QuestionStatistics {
  questionId: string;
  question: string;
  totalAttempts: number;
  correctAttempts: number;
  averageTime: number;
  difficultyRating: number;
  optionStats: OptionStatistics[];
}

export interface OptionStatistics {
  optionIndex: number;
  optionText: string;
  selectionCount: number;
  percentage: number;
}

export type QuestionType = 
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'multiple_select';

export type QuestionDifficulty = 
  | 'easy'
  | 'medium'
  | 'hard';

export type AttemptStatus = 
  | 'in_progress'
  | 'completed'
  | 'abandoned'
  | 'time_expired';

// Quiz creation and management
export interface CreateQuizData {
  roundId: string;
  questions: CreateQuestionData[];
  settings: QuizSettings;
}

export interface CreateQuestionData {
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: QuestionDifficulty;
  tags: string[];
}

export interface QuizSettings {
  timeLimit: number; // total time in minutes
  questionsPerPage: number;
  allowReview: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showProgressBar: boolean;
  autoSubmit: boolean;
  preventCheating: boolean;
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {
  id: string;
}

// Real-time quiz data
export interface QuizRoomData {
  roundId: string;
  activeTeams: QuizTeamStatus[];
  startTime: Date;
  endTime: Date;
  currentStatus: 'waiting' | 'active' | 'completed';
}

export interface QuizTeamStatus {
  teamId: string;
  teamName: string;
  currentQuestion: number;
  questionsAnswered: number;
  timeRemaining: number;
  status: AttemptStatus;
  lastActivity: Date;
}
