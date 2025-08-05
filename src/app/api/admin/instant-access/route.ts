import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Create a hardcoded admin session
    const hardcodedAdmin = {
      id: 'instant-admin-id',
      username: 'instant-admin',
      email: 'instant@admin.com',
      role: 'super_admin',
      permissions: { all: true },
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    // Create session token
    const sessionToken = jwt.sign(
      {
        adminId: hardcodedAdmin.id,
        username: hardcodedAdmin.username,
        role: hardcodedAdmin.role,
        sessionType: 'admin'
      },
      process.env.JWT_SECRET || 'fallback-secret-for-development',
      { expiresIn: '8h' }
    );
    
    // Get client IP for logging
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Log instant access
    console.log(`⚡ INSTANT ADMIN ACCESS: ${clientIp} at ${new Date().toISOString()}`);
    
    // Create response with redirect to admin dashboard
    const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    
    // Set admin cookie
    response.cookies.set('admin-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/admin'
    });
    
    return response;
    
  } catch (error) {
    console.error('Instant admin access error:', error);
    
    // Redirect to login on error
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}
