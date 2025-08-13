// Input validation and sanitization utilities
import { z } from 'zod';

// Common validation schemas
export const commonValidationSchemas = {
  // Team validation
  teamName: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Team name contains invalid characters'),
  
  memberName: z.string()
    .min(1, 'Member name is required')
    .max(100, 'Member name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Member name contains invalid characters'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(200, 'Password too long'),
  
  // Admin validation
  adminUsername: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  // Content validation
  presentationTitle: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  
  voteComment: z.string()
    .max(500, 'Comment too long')
    .optional(),
  
  // Numeric validation
  score: z.number()
    .min(1, 'Score must be at least 1')
    .max(10, 'Score cannot exceed 10')
    .int('Score must be a whole number'),
  
  // UUID validation
  uuid: z.string().uuid('Invalid ID format'),
  
  // General text validation (for descriptions, etc.)
  text: z.string()
    .max(1000, 'Text too long'),
  
  // Session timeout validation
  sessionTimeout: z.number()
    .min(1, 'Session timeout must be at least 1 hour')
    .max(168, 'Session timeout cannot exceed 168 hours (1 week)')
};

// Team signup validation schema
export const teamSignUpSchema = z.object({
  teamName: commonValidationSchemas.teamName,
  teamPassword: commonValidationSchemas.password,
  leaderName: commonValidationSchemas.memberName,
  leaderEmail: commonValidationSchemas.email,
  members: z.array(
    z.object({
      name: commonValidationSchemas.memberName,
      email: commonValidationSchemas.email.optional()
    })
  ).min(1, 'At least one member is required')
    .max(10, 'Maximum 10 members allowed')
});

// Team signin validation schema
export const teamSignInSchema = z.object({
  teamName: commonValidationSchemas.teamName,
  memberName: commonValidationSchemas.memberName,
  teamPassword: z.string().min(1, 'Password is required').max(200, 'Password too long')
});

// Admin signin validation schema
export const adminSignInSchema = z.object({
  username: commonValidationSchemas.adminUsername,
  password: z.string().min(1, 'Password is required').max(200, 'Password too long')
});

// Voting validation schemas
export const voteSubmissionSchema = z.object({
  presentationId: commonValidationSchemas.uuid,
  scores: z.object({
    innovation: commonValidationSchemas.score,
    presentation: commonValidationSchemas.score,
    technical: commonValidationSchemas.score,
    impact: commonValidationSchemas.score
  }),
  comment: commonValidationSchemas.voteComment
});

export const presentationSchema = z.object({
  title: commonValidationSchemas.presentationTitle,
  teamId: commonValidationSchemas.uuid,
  description: commonValidationSchemas.text.optional()
});

// Configuration validation schemas
export const configUpdateSchema = z.object({
  votingEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
  maxTeams: z.number().min(1).max(1000).optional(),
  sessionTimeout: commonValidationSchemas.sessionTimeout.optional()
});

// Security validation functions
export class InputValidator {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize user input with detailed error messages
   */
  static validateAndSanitize<T>(
    data: unknown, 
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      // Pre-sanitize string fields if data is an object
      if (typeof data === 'object' && data !== null) {
        const sanitizedData = this.sanitizeObject(data);
        const validatedData = schema.parse(sanitizedData);
        return { success: true, data: validatedData };
      } else {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(issue => {
          const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
          return `${path}${issue.message}`;
        });
        return { success: false, errors };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Validate request body size
   */
  static validateRequestSize(body: string, maxSizeKB: number = 100): boolean {
    const sizeInKB = Buffer.byteLength(body, 'utf8') / 1024;
    return sizeInKB <= maxSizeKB;
  }

  /**
   * Check for common injection patterns
   */
  static checkForInjectionPatterns(input: string): { safe: boolean; pattern?: string } {
    const patterns = [
      { name: 'SQL Injection', regex: /('|;|--|\/\*|\*\/|xp_|sp_|exec|execute|union|select|insert|delete|update|drop|create|alter)/i },
      { name: 'XSS', regex: /(script|javascript|onload|onerror|onclick|onmouseover|alert|eval|expression)/i },
      { name: 'Path Traversal', regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i },
      { name: 'Command Injection', regex: /(\||&|;|`|\$\(|\${|<|>)/i }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(input)) {
        return { safe: false, pattern: pattern.name };
      }
    }

    return { safe: true };
  }
}

export default InputValidator;
