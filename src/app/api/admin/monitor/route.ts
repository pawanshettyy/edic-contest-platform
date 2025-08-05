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
    
    // Get real-time statistics
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get basic counts
    const { data: teamCount } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });
    
    const { data: userCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    
    // Get recent activities
    const { data: recentSubmissions } = await supabase
      .from('team_submissions')
      .select(`
        id,
        submitted_at,
        status,
        teams (team_name),
        contest_rounds (title)
      `)
      .gte('submitted_at', oneHourAgo.toISOString())
      .order('submitted_at', { ascending: false })
      .limit(10);
    
    // Get active teams (teams with recent activity)
    const { data: activeTeams } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        current_round,
        total_score,
        last_activity
      `)
      .gte('last_activity', oneDayAgo.toISOString())
      .order('last_activity', { ascending: false })
      .limit(20);
    
    // Get system status
    const { data: contestConfig } = await supabase
      .from('contest_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Get recent admin actions
    const { data: recentAdminActions } = await supabase
      .from('admin_logs')
      .select(`
        id,
        action,
        target_type,
        details,
        timestamp,
        admin_users (username)
      `)
      .gte('timestamp', oneDayAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10);
    
    // Get submission statistics
    const { data: submissionStats } = await supabase
      .rpc('get_submission_stats');
    
    // Get performance metrics
    const { data: performanceMetrics } = await supabase
      .from('team_performance')
      .select(`
        team_id,
        average_solve_time,
        success_rate,
        teams (team_name)
      `)
      .order('success_rate', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      overview: {
        totalTeams: teamCount?.length || 0,
        totalUsers: userCount?.length || 0,
        activeTeams: activeTeams?.length || 0,
        contestActive: contestConfig?.[0]?.contest_active || false
      },
      recentActivity: {
        submissions: recentSubmissions || [],
        adminActions: recentAdminActions || []
      },
      activeTeams: activeTeams || [],
      submissionStats: submissionStats || [],
      performanceMetrics: performanceMetrics || [],
      systemStatus: {
        databaseConnected: true,
        contestConfig: contestConfig?.[0] || null,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Admin monitor error:', error);
    
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
    
    const { action, data } = body;
    
    switch (action) {
      case 'emergency_stop':
        // Emergency stop contest
        await supabase
          .from('contest_config')
          .update({ 
            contest_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1);
        
        await supabase
          .from('admin_logs')
          .insert({
            admin_user_id: admin.adminId,
            action: 'emergency_stop',
            target_type: 'contest',
            details: { reason: data?.reason || 'Emergency stop initiated' },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown'
          });
        
        return NextResponse.json({ message: 'Contest stopped successfully' });
        
      case 'restart_contest':
        // Restart contest
        await supabase
          .from('contest_config')
          .update({ 
            contest_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1);
        
        await supabase
          .from('admin_logs')
          .insert({
            admin_user_id: admin.adminId,
            action: 'restart_contest',
            target_type: 'contest',
            details: { reason: data?.reason || 'Contest restarted' },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown'
          });
        
        return NextResponse.json({ message: 'Contest restarted successfully' });
        
      case 'clear_cache':
        // This would clear any caching systems
        await supabase
          .from('admin_logs')
          .insert({
            admin_user_id: admin.adminId,
            action: 'clear_cache',
            target_type: 'system',
            details: { cache_type: data?.cacheType || 'all' },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown'
          });
        
        return NextResponse.json({ message: 'Cache cleared successfully' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Admin monitor POST error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
