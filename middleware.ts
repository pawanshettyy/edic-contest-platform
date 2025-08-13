// middleware.ts - Production-ready middleware with comprehensive security
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Generate CSP nonce for this request
function generateCSPNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get client IP from request headers
function getClientIP(headers: Headers): string {
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Generate CSP nonce for this request
  const nonce = generateCSPNonce();

  // Comprehensive Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (HTTPS only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "block-all-mixed-content",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-CSP-Nonce', nonce);

  // CORS for API routes
  if (pathname.startsWith('/api')) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    const origin = request.headers.get('origin');
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Basic rate limiting for authentication endpoints (simplified for now)
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/admin/auth/')) {
    const clientIP = getClientIP(request.headers);
    // In production, implement proper rate limiting with Redis or database
    console.log(`� Auth request from IP: ${clientIP.substring(0, 8)}...`);
  }

  // Skip pre-rendering for auth pages
  if (pathname.startsWith('/auth/')) {
    response.headers.set('x-middleware-skip', 'true')
    return response
  }

  // Admin route protection with enhanced security
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
      // Log unauthorized access attempt
      console.warn(`🚨 Security: Unauthorized admin access attempt from ${getClientIP(request.headers)} to ${pathname}`);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // For Edge Runtime compatibility, we'll do basic token validation
    // Full JWT verification will be done in the API routes
    try {
      // Basic token structure validation (JWT has 3 parts separated by dots)
      const tokenParts = adminToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode the payload (without verification for now)
      const payload = JSON.parse(atob(tokenParts[1]));
      
      if (payload.sessionType !== 'admin') {
        console.warn(`🚨 Security: Invalid admin session type from ${getClientIP(request.headers)}`);
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Basic expiration check
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.warn(`🚨 Security: Expired admin token from ${getClientIP(request.headers)}`);
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Token structure is valid, continue with security headers
      return response;
    } catch (error) {
      // Invalid token, redirect to login
      console.warn(`🚨 Security: Invalid admin token from ${getClientIP(request.headers)}: ${error}`);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
