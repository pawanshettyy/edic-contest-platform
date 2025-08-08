import { z } from 'zod';

// Auth validations
export const signUpSchema = z.object({
  leaderName: z.string().min(2, 'Leader name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
  member1Name: z.string().min(2, 'Member name must be at least 2 characters'),
  member2Name: z.string().min(2, 'Member name must be at least 2 characters'),
  member3Name: z.string().min(2, 'Member name must be at least 2 characters'),
  teamPassword: z.string().min(4, 'Team password must be at least 4 characters'),
  confirmTeamPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
).refine(
  (data) => data.teamPassword === data.confirmTeamPassword,
  {
    message: "Team passwords don't match",
    path: ["confirmTeamPassword"],
  }
);

export const signInSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  memberName: z.string().min(1, 'Member name is required'),
  teamPassword: z.string().min(1, 'Team password is required'),
});

// Contest validations
export const contestSchema = z.object({
  title: z.string().min(5, 'Contest title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startTime: z.date(),
  endTime: z.date(),
  maxTeams: z.number().min(1, 'At least 1 team must be allowed'),
  rounds: z.array(z.object({
    title: z.string().min(1, 'Round title is required'),
    type: z.enum(['quiz', 'coding', 'voting']),
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
  })).min(1, 'At least one round is required'),
});

// Quiz validations
export const questionSchema = z.object({
  id: z.string(),
  question: z.string().min(5, 'Question must be at least 5 characters'),
  options: z.array(z.string()).min(2, 'At least 2 options required').max(4, 'Maximum 4 options allowed'),
  correctAnswer: z.number().min(0).max(3),
  points: z.number().min(1, 'Points must be at least 1'),
  timeLimit: z.number().min(10, 'Time limit must be at least 10 seconds'),
});

export const quizSubmissionSchema = z.object({
  questionId: z.string(),
  selectedAnswer: z.number().min(0).max(3),
  timeSpent: z.number().min(0),
});

// Voting validations
export const submissionSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  title: z.string().min(5, 'Submission title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  fileUrl: z.string().url('Invalid file URL'),
  submittedAt: z.date(),
});

export const voteSchema = z.object({
  submissionId: z.string(),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().optional(),
});

// Team validations
export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional(),
});

export const teamSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  leader: teamMemberSchema,
  members: z.array(teamMemberSchema).min(1, 'At least one member required').max(5, 'Maximum 5 members allowed'),
  teamPassword: z.string().min(4, 'Team password must be at least 4 characters'),
  createdAt: z.date(),
});

// Utility validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateTeamName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (name.length < 2) {
    return { isValid: false, error: 'Team name must be at least 2 characters' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Team name cannot exceed 50 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { isValid: false, error: 'Team name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { isValid: true };
}

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type ContestData = z.infer<typeof contestSchema>;
export type QuestionData = z.infer<typeof questionSchema>;
export type QuizSubmissionData = z.infer<typeof quizSubmissionSchema>;
export type SubmissionData = z.infer<typeof submissionSchema>;
export type VoteData = z.infer<typeof voteSchema>;
export type TeamData = z.infer<typeof teamSchema>;
