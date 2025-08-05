// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip pre-rendering for auth pages
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const response = NextResponse.next()
    response.headers.set('x-middleware-skip', 'true')
    return response
  }
}

export const config = {
  matcher: '/auth/:path*'
}
