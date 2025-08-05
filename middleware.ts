// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip pre-rendering for auth pages
  if (pathname.startsWith('/auth/')) {
    const response = NextResponse.next()
    response.headers.set('x-middleware-skip', 'true')
    return response
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const decoded = jwt.verify(
        adminToken,
        process.env.JWT_SECRET || 'fallback-secret-for-development'
      ) as AdminTokenPayload;

      if (decoded.sessionType !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Token is valid, continue to the requested page
      return NextResponse.next();
    } catch {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*', '/admin/:path*']
}
