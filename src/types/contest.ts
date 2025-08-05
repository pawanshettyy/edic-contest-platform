export interface Contest {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  organizerId: string;
  organizerName: string;
  startTime: Date;
  endTime: Date;
  registrationDeadline: Date;
  maxTeams: number;
  registeredTeams: number;
  status: ContestStatus;
  rounds: ContestRound[];
  prizes: Prize[];
  rules: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContestRound {
  id: string;
  title: string;
  description: string;
  type: RoundType;
  orderIndex: number;
  duration: number; // in minutes
  startTime?: Date;
  endTime?: Date;
  status: RoundStatus;
  config: RoundConfig;
  createdAt: Date;
}

export interface Prize {
  position: number;
  title: string;
  description: string;
  value?: string;
}

export interface RoundConfig {
  // Quiz specific
  questionCount?: number;
  timePerQuestion?: number;
  allowReview?: boolean;
  shuffleQuestions?: boolean;
  
  // Coding specific
  problemStatement?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in MB
  
  // Voting specific
  submissionDeadline?: Date;
  votingCriteria?: VotingCriteria[];
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export interface VotingCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage
  maxPoints: number;
}

export interface ContestRegistration {
  id: string;
  contestId: string;
  teamId: string;
  registeredAt: Date;
  status: RegistrationStatus;
}

export interface ContestResult {
  id: string;
  contestId: string;
  teamId: string;
  teamName: string;
  totalScore: number;
  rank: number;
  roundResults: RoundResult[];
  createdAt: Date;
}

export interface RoundResult {
  roundId: string;
  roundTitle: string;
  score: number;
  maxScore: number;
  details: Record<string, unknown>;
  completedAt?: Date;
}

export type ContestStatus = 
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'active'
  | 'completed'
  | 'cancelled';

export type RoundType = 
  | 'quiz'
  | 'coding'
  | 'voting';

export type RoundStatus = 
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled';

export type RegistrationStatus = 
  | 'registered'
  | 'cancelled'
  | 'disqualified';

// Contest creation and management
export interface CreateContestData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  registrationDeadline: Date;
  maxTeams: number;
  rounds: CreateRoundData[];
  prizes: Prize[];
  rules: string[];
}

export interface CreateRoundData {
  title: string;
  description: string;
  type: RoundType;
  duration: number;
  config: RoundConfig;
}

export interface UpdateContestData extends Partial<CreateContestData> {
  id: string;
}

// Contest leaderboard
export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  totalScore: number;
  roundScores: Record<string, number>;
  lastUpdated: Date;
}

export interface Leaderboard {
  contestId: string;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
}
