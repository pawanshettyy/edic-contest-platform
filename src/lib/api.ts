// API configuration and utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session-based auth
      ...options,
    };

    // Session-based authentication using HTTP-only cookies
    // No need for localStorage token management

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data.code
        );
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  SIGN_UP: '/auth/signup',
  SIGN_IN: '/auth/signin',
  SIGN_OUT: '/auth/signout',
  VERIFY_TOKEN: '/auth/verify',
  
  // Teams
  TEAMS: '/teams',
  TEAM_BY_ID: (id: string) => `/teams/${id}`,
  
  // Contests
  CONTESTS: '/contests',
  CONTEST_BY_ID: (id: string) => `/contests/${id}`,
  CONTEST_REGISTER: (id: string) => `/contests/${id}/register`,
  
  // Quiz
  QUIZ_QUESTIONS: (contestId: string) => `/contests/${contestId}/quiz`,
  QUIZ_SUBMIT: (contestId: string) => `/contests/${contestId}/quiz/submit`,
  
  // Voting
  VOTING_SUBMISSIONS: (contestId: string) => `/contests/${contestId}/voting`,
  VOTING_SUBMIT: (contestId: string) => `/contests/${contestId}/voting/submit`,
  
  // Results
  RESULTS: (contestId: string) => `/contests/${contestId}/results`,
  LEADERBOARD: (contestId: string) => `/contests/${contestId}/leaderboard`,
} as const;

// Mock API responses for development
export const mockApiResponses = {
  signUp: (data: unknown) => 
    new Promise<ApiResponse>((resolve) => 
      setTimeout(() => resolve({ success: true, data }), 1000)
    ),
  
  signIn: (data: unknown) => 
    new Promise<ApiResponse>((resolve) => 
      setTimeout(() => resolve({ success: true, data }), 1000)
    ),
  
  getContests: () => 
    new Promise<ApiResponse>((resolve) => 
      setTimeout(() => resolve({ 
        success: true, 
        data: [] 
      }), 500)
    ),
};
