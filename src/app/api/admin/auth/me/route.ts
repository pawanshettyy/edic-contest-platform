import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

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
      // Check if session exists in database - only if supabase is configured
      if (!supabase) {
        // If no supabase, fallback to simple token validation for development
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
      
      const { data: sessions, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', token)
        .gt('expires_at', new Date().toISOString())
        .limit(1);
      
      if (sessionError || !sessions || sessions.length === 0) {
        return NextResponse.json(
          { error: 'Session expired or invalid' },
          { status: 401 }
        );
      }
      
      // Get current admin user data
      const { data: adminUsers, error: userError } = await supabase
        .from('admin_users')
        .select('id, username, email, role, permissions, is_active, last_login, created_at')
        .eq('id', decoded.adminId)
        .eq('is_active', true)
        .limit(1);
      
      if (userError || !adminUsers || adminUsers.length === 0) {
        return NextResponse.json(
          { error: 'Admin user not found or inactive' },
          { status: 401 }
        );
      }
      
      const adminUser = adminUsers[0] as AdminUser;
      
      // Update session last activity (optional - you can skip this if you want)
      await supabase
        .from('admin_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_token', token);
      
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
