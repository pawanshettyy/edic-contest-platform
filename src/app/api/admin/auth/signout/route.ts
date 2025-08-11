import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSql } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No admin session found' },
        { status: 401 }
      );
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret-for-development'
      ) as AdminTokenPayload;
      
      if (decoded.sessionType !== 'admin') {
        return NextResponse.json(
          { error: 'Invalid session type' },
          { status: 401 }
        );
      }
      
      const sql = getSql();
      
      // Remove session from database
      await sql`
        DELETE FROM admin_sessions WHERE session_token = ${token}
      `;
      
      // Log admin logout
      await sql`
        INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
        VALUES (${decoded.adminId}, 'admin_logout', ${JSON.stringify({ username: decoded.username })}, ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'})
      `;
      
    } catch (jwtError) {
      console.error('JWT verification error during logout:', jwtError);
      // Continue with logout even if token is invalid
    }
    
    // Clear admin cookie
    const response = NextResponse.json({
      message: 'Admin signed out successfully'
    });
    
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin'
    });
    
    return response;
    
  } catch (error) {
    console.error('Admin signout error:', error);
    
    // Even if there's an error, clear the cookie
    const response = NextResponse.json({
      message: 'Admin signed out'
    });
    
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin'
    });
    
    return response;
  }
}
