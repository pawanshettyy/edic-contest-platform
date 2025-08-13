// Security utilities for production
import { createHash, randomBytes } from 'crypto';

export interface RateLimitAttempt {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // hours
  jwtSecret: string;
}

// In-memory rate limiting (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitAttempt>();

export class SecurityUtils {
  private static config: SecurityConfig = {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24'),
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development'
  };

  /**
   * Rate limiting for login attempts
   */
  static checkRateLimit(identifier: string): { allowed: boolean; lockedUntil?: Date; attemptsLeft?: number } {
    const now = Date.now();
    const key = `login:${identifier}`;
    const attempt = rateLimitStore.get(key);

    if (!attempt) {
      // First attempt
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + (15 * 60 * 1000) // Reset after 15 minutes
      });
      return { allowed: true, attemptsLeft: this.config.maxLoginAttempts - 1 };
    }

    // Check if locked
    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      return { 
        allowed: false, 
        lockedUntil: new Date(attempt.lockedUntil) 
      };
    }

    // Check if reset time passed
    if (now > attempt.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + (15 * 60 * 1000)
      });
      return { allowed: true, attemptsLeft: this.config.maxLoginAttempts - 1 };
    }

    // Increment attempt count
    const newCount = attempt.count + 1;
    
    if (newCount >= this.config.maxLoginAttempts) {
      // Lock the account
      const lockoutEnd = now + (this.config.lockoutDuration * 60 * 1000);
      rateLimitStore.set(key, {
        count: newCount,
        resetTime: attempt.resetTime,
        lockedUntil: lockoutEnd
      });
      return { 
        allowed: false, 
        lockedUntil: new Date(lockoutEnd) 
      };
    }

    // Still within limits
    rateLimitStore.set(key, {
      ...attempt,
      count: newCount
    });

    return { 
      allowed: true, 
      attemptsLeft: this.config.maxLoginAttempts - newCount 
    };
  }

  /**
   * Reset rate limit for successful login
   */
  static resetRateLimit(identifier: string): void {
    const key = `login:${identifier}`;
    rateLimitStore.delete(key);
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data (for logging, caching keys, etc.)
   */
  static hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate JWT secret strength
   */
  static validateJWTSecret(): boolean {
    const secret = this.config.jwtSecret;
    return secret.length >= 64 && secret !== 'fallback-secret-for-development';
  }

  /**
   * Generate Content Security Policy nonce
   */
  static generateCSPNonce(): string {
    return randomBytes(16).toString('base64');
  }

  /**
   * Sanitize user input for logging
   */
  static sanitizeForLog(input: string): string {
    // Remove potentially sensitive patterns
    return input
      .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s&]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=***');
  }

  /**
   * Validate input against common injection patterns
   */
  static validateInput(input: string): { valid: boolean; reason?: string } {
    // Check for SQL injection patterns
    const sqlPatterns = [
      /('|\\';|;|\\|\/\*|UNION|SELECT|INSERT|DELETE|UPDATE|DROP|CREATE|ALTER|EXEC|EXECUTE)/i,
      /(script[^>]*>|javascript:|onload=|onerror=|onclick=)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return { valid: false, reason: 'Potentially malicious input detected' };
      }
    }

    // Check length limits
    if (input.length > 1000) {
      return { valid: false, reason: 'Input too long' };
    }

    return { valid: true };
  }

  /**
   * Get client IP from request headers
   */
  static getClientIP(headers: Headers): string {
    // Check various headers for real IP
    const xForwardedFor = headers.get('x-forwarded-for');
    const xRealIP = headers.get('x-real-ip');
    const cfConnectingIP = headers.get('cf-connecting-ip');
    
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    if (xRealIP) {
      return xRealIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    return 'unknown';
  }

  /**
   * Create audit log entry
   */
  static createAuditLog(action: string, details: Record<string, unknown>, userInfo: Record<string, unknown>, request: Request): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      action: action,
      user: {
        id: userInfo?.id || 'anonymous',
        name: userInfo?.name || 'unknown',
        isAdmin: userInfo?.isAdmin || false
      },
      details: details,
      request: {
        ip: this.getClientIP(request.headers),
        userAgent: request.headers.get('user-agent') || 'unknown',
        method: request.method,
        path: new URL(request.url).pathname
      }
    };
  }
}

export default SecurityUtils;
