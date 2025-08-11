// Application constants

// Contest settings
export const CONTEST_SETTINGS = {
  MIN_TEAM_SIZE: 1,
  MAX_TEAM_SIZE: 5,
  MIN_TEAMS: 2,
  MAX_TEAMS: 50,
  DEFAULT_QUESTION_TIME: 60, // seconds
  MIN_QUESTION_TIME: 10,
  MAX_QUESTION_TIME: 300,
  DEFAULT_QUIZ_DURATION: 30, // minutes
  DEFAULT_VOTING_DURATION: 15, // minutes
} as const;

// Round types
export const ROUND_TYPES = {
  QUIZ: 'quiz',
  CODING: 'coding',
  VOTING: 'voting',
} as const;

// Contest phases
export const CONTEST_PHASES = {
  REGISTRATION: 'registration',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Scoring system
export const SCORING = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: 0,
  TIME_BONUS_MULTIPLIER: 0.1, // 10% bonus for quick answers
  VOTING_WEIGHT: 0.3,
  QUIZ_WEIGHT: 0.7,
} as const;

// UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 200,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.zip', '.rar'],
} as const;

// Theme settings
export const THEME_SETTINGS = {
  DEFAULT_THEME: 'system',
  STORAGE_KEY: 'axios-theme',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'axios_auth_token',
  USER: 'axios_user',
  TEAM: 'axios_team',
  TEAMS: 'axios_teams',
  THEME: 'axios_theme',
  CONTEST_STATE: 'axios_contest_state',
  DRAFT_ANSWERS: 'axios_draft_answers',
} as const;

// API endpoints base paths
export const API_PATHS = {
  AUTH: '/api/auth',
  TEAMS: '/api/teams',
  CONTESTS: '/api/contests',
  QUIZ: '/api/quiz',
  VOTING: '/api/voting',
  RESULTS: '/api/results',
  UPLOAD: '/api/upload',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SIGN_UP: 'Account created successfully!',
  SIGN_IN: 'Welcome back!',
  SIGN_OUT: 'You have been signed out.',
  TEAM_CREATED: 'Team created successfully!',
  CONTEST_REGISTERED: 'Successfully registered for the contest!',
  QUIZ_SUBMITTED: 'Quiz answers submitted successfully!',
  VOTE_SUBMITTED: 'Vote submitted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// Contest status colors
export const STATUS_COLORS = {
  [CONTEST_PHASES.REGISTRATION]: 'blue',
  [CONTEST_PHASES.ACTIVE]: 'green',
  [CONTEST_PHASES.COMPLETED]: 'gray',
  [CONTEST_PHASES.CANCELLED]: 'red',
} as const;

// File upload settings
export const UPLOAD_SETTINGS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large file uploads
} as const;

// Pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// Time zones
export const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
] as const;

// Default values
export const DEFAULTS = {
  AVATAR_URL: '/images/team-placeholder.png',
  CONTEST_BANNER: '/images/contest-banner.jpg',
  ORGANIZATION_LOGO: '/axios-logo.svg',
} as const;
