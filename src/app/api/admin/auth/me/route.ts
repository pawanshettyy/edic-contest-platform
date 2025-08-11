import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSql, isDatabaseConnected } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: Record<string, unknown>;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No admin session found' },
        { status: 401 }
      );
    }
    
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
    
    // Handle fallback admin (when database tables don't exist yet)
    if (decoded.adminId === 'fallback-admin-id') {
      return NextResponse.json({
        admin: {
          id: 'fallback-admin-id',
          username: 'admin',
          email: 'admin@techpreneur.com',
          role: 'super_admin',
          permissions: { all: true },
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
      });
    }
    
    try {
      // Check if session exists in database - only if database is connected
      if (!isDatabaseConnected()) {
        // If no database connection, fallback to simple token validation for development
        if (decoded.adminId === 'fallback-admin-id') {
          return NextResponse.json({
            admin: {
              id: 'fallback-admin-id',
              username: 'admin',
              email: 'admin@techpreneur.com',
              role: 'super_admin',
              permissions: { all: true },
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }
          });
        }
        throw new Error('Database not configured');
      }
      
      // Get SQL instance
      const sql = getSql();
      
      const sessions = await sql`
        SELECT * FROM admin_sessions 
        WHERE session_token = ${token} 
        AND expires_at > NOW() 
        LIMIT 1
      `;
      
      if (!sessions || (sessions as unknown[]).length === 0) {
        return NextResponse.json(
          { error: 'Session expired or invalid' },
          { status: 401 }
        );
      }
      
      // Get current admin user data
      const adminUsers = await sql`
        SELECT id, username, email, role, permissions, is_active, last_login, created_at 
        FROM admin_users 
        WHERE id = ${decoded.adminId} 
        AND is_active = true 
        LIMIT 1
      `;
      
      if (!adminUsers || (adminUsers as AdminUser[]).length === 0) {
        return NextResponse.json(
          { error: 'Admin user not found or inactive' },
          { status: 401 }
        );
      }
      
      const adminUser = (adminUsers as AdminUser[])[0];
      
      // Update session last activity (optional - you can skip this if you want)
      try {
        await sql`
          UPDATE admin_sessions 
          SET last_activity = NOW() 
          WHERE session_token = ${token}
        `;
      } catch (updateError) {
        console.warn('Could not update session activity:', updateError);
      }
      
      return NextResponse.json({
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          permissions: adminUser.permissions,
          lastLogin: adminUser.last_login,
          createdAt: adminUser.created_at,
        }
      });
      
    } catch (dbError) {
      console.log('Database tables not ready, but token is valid for fallback admin');
      // If database error but we have a valid fallback admin, return fallback
      if (decoded.adminId === 'fallback-admin-id') {
        return NextResponse.json({
          admin: {
            id: 'fallback-admin-id',
            username: 'admin',
            email: 'admin@techpreneur.com',
            role: 'super_admin',
            permissions: { all: true },
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
        });
      }
      throw dbError;
    }
    
  } catch (error) {
    console.error('Admin me error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
