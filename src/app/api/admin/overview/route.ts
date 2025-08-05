import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
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
    
    // Verify admin token
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
    
    // Check session validity
    const sessions = await query(
      'SELECT * FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    );
    
    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
    
    // Get overview statistics
    const [
      totalUsers,
      totalTeams,
      activeRounds,
      recentSubmissions,
      systemHealth,
      topTeams
    ] = await Promise.all([
      // Total users
      query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      
      // Total teams
      query<{ count: string }>('SELECT COUNT(*) as count FROM teams'),
      
      // Active contest rounds
      query(`
        SELECT r.*, 
               (SELECT COUNT(*) FROM teams t WHERE t.current_round = r.round_number) as participating_teams
        FROM contest_rounds r 
        WHERE r.is_active = true 
        ORDER BY r.round_number
      `),
      
      // Recent submissions (last 24 hours)
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM user_progress 
        WHERE updated_at > NOW() - INTERVAL '24 hours'
      `),
      
      // System health check
      query<{ current_time: string }>('SELECT NOW() as current_time'),
      
      // Top teams by progress
      query(`
        SELECT t.name, t.current_round, t.total_score, t.current_score, 
               u.full_name as leader_name
        FROM teams t
        LEFT JOIN users u ON t.leader_id = u.id
        ORDER BY t.total_score DESC, t.current_score DESC
        LIMIT 10
      `)
    ]);
    
    // Get contest configuration
    const contestConfig = await query<{
      key: string;
      value: string;
      description: string;
    }>(`
      SELECT key, value, description 
      FROM contest_config 
      WHERE is_active = true
      ORDER BY key
    `);
    
    // Get recent admin activity
    const recentActivity = await query(`
      SELECT al.action, al.details, al.created_at, au.username
      FROM admin_logs al
      JOIN admin_users au ON al.admin_user_id = au.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);
    
    // Log this admin dashboard access
    await query(
      `INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
       VALUES ($1, 'dashboard_access', $2, $3)`,
      [
        decoded.adminId,
        JSON.stringify({ timestamp: new Date().toISOString() }),
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown'
      ]
    );
    
    return NextResponse.json({
      overview: {
        totalUsers: parseInt(totalUsers[0].count),
        totalTeams: parseInt(totalTeams[0].count),
        activeRounds: activeRounds,
        recentSubmissions: parseInt(recentSubmissions[0].count),
        systemStatus: 'healthy',
        lastUpdated: systemHealth[0].current_time
      },
      topTeams,
      contestConfig: contestConfig.reduce((acc: Record<string, unknown>, config) => ({
        ...acc,
        [config.key]: {
          value: config.value,
          description: config.description
        }
      }), {}),
      recentActivity
    });
    
  } catch (error) {
    console.error('Admin overview error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
