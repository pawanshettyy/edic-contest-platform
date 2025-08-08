export interface VotingSession {
  id: string;
  roundId: string;
  currentPresentingTeam: string;
  phase: VotingPhase;
  phaseStartTime: Date;
  phaseEndTime: Date;
  pitchDuration: number; // 90 seconds
  votingDuration: number; // 30 seconds
  teams: VotingTeamStatus[];
  createdAt: Date;
}

export interface VotingTeamStatus {
  teamId: string;
  teamName: string;
  hasPresented: boolean;
  presentationOrder: number;
  votesReceived: TeamVoteCount;
  votingHistory: VoteRecord[];
  downvotesUsed: number; // Track downvotes used (max 3)
  isCurrentlyPresenting: boolean;
  canVote: boolean; // false when they're presenting
}

export interface TeamVoteCount {
  upvotes: number;
  downvotes: number;
  totalScore: number; // upvotes - downvotes
}

export interface VoteRecord {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  voteType: VoteType;
  timestamp: Date;
  sessionId: string;
}

export interface VotingConstraints {
  maxDownvotes: number; // 3 per team
  pitchDuration: number; // 90 seconds
  votingDuration: number; // 30 seconds
  canVoteForSelf: boolean; // false
}

export interface CombinedScore {
  teamId: string;
  teamName: string;
  quizScore: number;
  votingScore: number;
  totalScore: number;
  rank: number;
  qualifiedForFinal: boolean;
}

export interface FinalEvaluation {
  teamId: string;
  teamName: string;
  onlineScore: number; // quiz + voting
  offlineScore: number; // manual evaluation
  finalScore: number;
  finalRank: number;
  comments?: string;
  evaluatedBy: string;
  evaluatedAt: Date;
}

export interface ScoreboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  quizScore: number;
  votingScore: number;
  onlineTotal: number;
  offlineScore?: number;
  finalScore?: number;
  status: 'qualified' | 'eliminated' | 'pending';
}

export type VotingPhase = 
  | 'waiting' // Before any presentation starts
  | 'pitching' // 90 seconds pitch time
  | 'voting' // 30 seconds voting time
  | 'break' // Between presentations
  | 'completed'; // All presentations done

export type VoteType = 'upvote' | 'downvote';

// Configuration for the combined evaluation system
export interface EvaluationConfig {
  quizWeight: number; // e.g., 0.4 (40%)
  votingWeight: number; // e.g., 0.3 (30%)
  offlineWeight: number; // e.g., 0.3 (30%)
  minScoreToQualify: number;
  maxTeamsForFinal: number;
}

// Real-time updates for voting phase
export interface VotingRoomUpdate {
  type: 'phase_change' | 'vote_cast' | 'team_update' | 'timer_update';
  payload: VotingPhaseChangePayload | VoteCastPayload | TeamUpdatePayload | TimerUpdatePayload;
  timestamp: Date;
}

export interface VotingPhaseChangePayload {
  newPhase: VotingPhase;
  currentTeam?: string;
  timeRemaining: number;
}

export interface VoteCastPayload {
  fromTeamId: string;
  toTeamId: string;
  voteType: VoteType;
  newVoteCount: TeamVoteCount;
}

export interface TeamUpdatePayload {
  teamId: string;
  updates: Partial<VotingTeamStatus>;
}

export interface TimerUpdatePayload {
  timeRemaining: number;
  phase: VotingPhase;
}

export interface PresentationSchedule {
  teamId: string;
  teamName: string;
  presentationOrder: number;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'presenting' | 'voting' | 'completed';
}
