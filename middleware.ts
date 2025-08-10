// middleware.ts - Production-ready middleware with security
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add security headers for all requests
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // CORS for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Skip pre-rendering for auth pages
  if (pathname.startsWith('/auth/')) {
    response.headers.set('x-middleware-skip', 'true')
    return response
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
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
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Basic expiration check
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Token structure is valid, continue with security headers
      return response;
    } catch {
      // Invalid token, redirect to login
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
