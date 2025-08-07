import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

// Validation schemas
const userActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['activate', 'deactivate', 'reset_password', 'update_role']),
  data: z.record(z.any()).optional()
});

async function verifyAdminSession(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
  }
  
  const { data: sessions, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  
  if (error || !sessions || sessions.length === 0) {
    throw new Error('Session expired');
  }
  
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);
    
    // Get users with their team memberships
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        is_active,
        created_at,
        last_login,
        team_members (
          id,
          role,
          joined_at,
          teams (
            id,
            team_name,
            team_code
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('Users fetch error:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    // Transform data for better frontend consumption
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedUsers = users?.map((user: Record<string, any>) => ({
      ...user,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teamMembership: (user.team_members as any[])?.[0] ? {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamId: (user.team_members as any[])[0].teams?.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamName: (user.team_members as any[])[0].teams?.team_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamCode: (user.team_members as any[])[0].teams?.team_code,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: (user.team_members as any[])[0].role,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        joinedAt: (user.team_members as any[])[0].joined_at
      } : null
    })) || [];
    
    return NextResponse.json({
      users: transformedUsers,
      totalUsers: users?.length || 0,
      stats: {
        activeUsers: users?.filter((u: Record<string, unknown>) => u.is_active as boolean).length || 0,
        usersInTeams: users?.filter((u: Record<string, unknown>) => ((u.team_members as unknown[]) || []).length > 0).length || 0
      }
    });
    
  } catch (error) {
    console.error('Admin users GET error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    const admin = await verifyAdminSession(token);
    const body = await request.json();
    const validatedData = userActionSchema.parse(body);
    
    const { userId, action, data } = validatedData;
    
    switch (action) {
      case 'activate':
        await supabase
          .from('users')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        break;
        
      case 'deactivate':
        await supabase
          .from('users')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        break;
        
      case 'reset_password':
        // In a real app, you'd generate a reset token and send email
        // For now, just log the action
        await supabase
          .from('admin_logs')
          .insert({
            admin_user_id: admin.adminId,
            action: 'password_reset_initiated',
            target_type: 'user',
            target_id: userId,
            details: { reason: data?.reason || 'Admin initiated reset' },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown'
          });
        
        return NextResponse.json({ 
          message: 'Password reset initiated (email would be sent in production)' 
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: admin.adminId,
        action: `user_${action}`,
        target_type: 'user',
        target_id: userId,
        details: { action, data },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });
    
    return NextResponse.json({ 
      message: `User ${action} completed successfully` 
    });
    
  } catch (error) {
    console.error('Admin users POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
