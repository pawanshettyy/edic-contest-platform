import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

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
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const action = url.searchParams.get('action');
    const targetType = url.searchParams.get('target_type');
    const adminId = url.searchParams.get('admin_id');
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('admin_logs')
      .select(`
        id,
        action,
        target_type,
        target_id,
        details,
        timestamp,
        ip_address,
        admin_users (
          id,
          username,
          role
        )
      `)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (adminId) {
      query = query.eq('admin_user_id', adminId);
    }
    
    const { data: logs, error: logsError } = await query;
    
    if (logsError) {
      console.error('Logs fetch error:', logsError);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
    
    // Get total count for pagination
    let countQuery = supabase
      .from('admin_logs')
      .select('id', { count: 'exact', head: true });
    
    if (action) {
      countQuery = countQuery.eq('action', action);
    }
    if (targetType) {
      countQuery = countQuery.eq('target_type', targetType);
    }
    if (adminId) {
      countQuery = countQuery.eq('admin_user_id', adminId);
    }
    
    const { count } = await countQuery;
    
    // Get activity statistics
    const { data: activityStats } = await supabase
      .rpc('get_admin_activity_stats');
    
    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: activityStats || {}
    });
    
  } catch (error) {
    console.error('Admin logs GET error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
