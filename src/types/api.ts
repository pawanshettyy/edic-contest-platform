import { ApiResponse } from '@/lib/api';

// Generic API types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: string | number | boolean | string[] | number[];
}

export interface SearchParams {
  page?: number;
  pageSize?: number;
  sort?: SortOptions;
  filters?: FilterOptions;
  search?: string;
}

// API Error types
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: ValidationError[];
}

// API Request types
export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadOptions {
  onProgress?: (event: UploadProgressEvent) => void;
  onComplete?: (response: ApiResponse) => void;
  onError?: (error: Error) => void;
  allowedTypes?: string[];
  maxSize?: number;
}

// WebSocket types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  id: string;
}

export interface WebSocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  messageId?: string;
}

// Real-time event types
export interface RealTimeEvent {
  type: RealTimeEventType;
  payload: unknown;
  timestamp: Date;
  source: string;
}

export type RealTimeEventType = 
  | 'contest_started'
  | 'contest_ended'
  | 'round_started'
  | 'round_ended'
  | 'team_registered'
  | 'quiz_submitted'
  | 'vote_submitted'
  | 'leaderboard_updated'
  | 'announcement'
  | 'system_message';

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // time to live in milliseconds
  skipCache?: boolean;
  forceRefresh?: boolean;
}

// Background job types
export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type JobType = 
  | 'export_results'
  | 'send_notifications'
  | 'calculate_rankings'
  | 'generate_certificates'
  | 'cleanup_files';

export type JobStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'contest_update'
  | 'team_update'
  | 'system';

// Analytics types
export interface AnalyticsEvent {
  eventType: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  teamId?: string;
  contestId?: string;
}

export interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  contestParticipation: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
  userActions: Array<{ action: string; count: number }>;
}

// Export all API response types
export type { ApiResponse };
