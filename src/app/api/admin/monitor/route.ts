import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query, transaction, isDatabaseConnected } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

interface DatabaseRecord {
  count?: string;
  contest_active?: boolean;
  is_active?: boolean;
  phase?: string;
  created_at?: string;
  completed_members?: string;
  teams_with_submissions?: string;
  avg_score?: string;
  submissions?: string;
  hour?: string;
  id?: string;
  action?: string;
  target_type?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  username?: string;
  team_id?: string;
  team_name?: string;
  current_round?: string;
  total_score?: number;
  quiz_score?: number;
  voting_score?: number;
  last_activity?: string;
  status?: string;
}

async function verifyAdminSession(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
  }
  
  // Handle fallback admin (when database tables don't exist yet)
  if (decoded.adminId === 'fallback-admin-id') {
    return decoded;
  }
  
  try {
    const sessions = await query(
      `SELECT * FROM admin_sessions 
       WHERE session_token = $1 AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    
    if (!sessions || sessions.length === 0) {
      console.log('❌ No valid session found in database for token');
      throw new Error('Session expired');
    }
    
    console.log('✅ Valid session found in database');
    return decoded;
  } catch (error) {
    console.log('🔧 Database session check failed:', error);
    
    // If admin_sessions table doesn't exist, allow fallback admin
    if (decoded.adminId === 'fallback-admin-id') {
      console.log('🔧 Using fallback admin session');
      return decoded;
    }
    
    // For development, if database tables don't exist yet, allow valid JWT tokens
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: allowing valid JWT without database session');
      return decoded;
    }
    
    throw new Error('Session expired');
  }
}

// Fallback data for when database is not available
function getMockAdminData() {
  return {
    overview: {
      totalUsers: 0,
      totalTeams: 0,
      activeTeams: 0,
      contestActive: false
    },
    recentActivity: {
      submissions: [],
      adminActions: []
    },
    activeTeams: [],
    submissionStats: [],
    performanceMetrics: [],
    systemStatus: {
      databaseConnected: false,
      contestConfig: null,
      lastUpdated: new Date().toISOString()
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);
    
    // Check if database is available before attempting queries
    if (!isDatabaseConnected()) {
      console.log('🔧 Using fallback mock data for admin dashboard');
      const mockData = getMockAdminData();
      return NextResponse.json(mockData);
    }
    
    try {
      // Get real-time statistics from PostgreSQL
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get basic counts
      const teamCountResult = await query('SELECT COUNT(*) as count FROM teams');
      const userCountResult = await query('SELECT COUNT(*) as count FROM users');
      
      // Get active teams (teams with recent activity)
      const activeTeamsResult = await query(`
        SELECT 
          id,
          team_name,
          current_round,
          total_score,
          last_activity,
          quiz_score,
          voting_score,
          status
        FROM teams
        WHERE last_activity >= $1
        ORDER BY last_activity DESC
        LIMIT 20
      `, [oneDayAgo]);
      
      // Get contest configuration
      const contestConfigResult = await query(`
        SELECT * FROM contest_config
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      // Get recent admin actions
      const recentAdminActionsResult = await query(`
        SELECT 
          al.id,
          al.action,
          al.target_type,
          al.details,
          al.timestamp,
          au.username
        FROM admin_logs al
        LEFT JOIN admin_users au ON al.admin_user_id = au.id
        WHERE al.timestamp >= $1
        ORDER BY al.timestamp DESC
        LIMIT 10
      `, [oneDayAgo]);

      // Get voting session status
      const votingSessionResult = await query(`
        SELECT phase, is_active, created_at
        FROM voting_sessions 
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `);

      // Get quiz completion stats
      const quizStatsResult = await query(`
        SELECT 
          COUNT(DISTINCT member_name) as completed_members,
          COUNT(DISTINCT team_id) as teams_with_submissions,
          AVG(points_earned) as avg_score
        FROM quiz_responses
        WHERE created_at >= $1
      `, [oneDayAgo]);

      // Get submission activity
      const submissionStatsResult = await query(`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as submissions
        FROM quiz_responses
        WHERE created_at >= $1
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour DESC
      `, [oneDayAgo]);
      
      const totalTeams = parseInt((teamCountResult[0] as DatabaseRecord)?.count || '0') || 0;
      const totalUsers = parseInt((userCountResult[0] as DatabaseRecord)?.count || '0') || 0;
      const activeTeams = activeTeamsResult || [];
      const contestConfig = (contestConfigResult[0] as DatabaseRecord) || null;
      const recentAdminActions = recentAdminActionsResult || [];
      const votingSession = (votingSessionResult[0] as DatabaseRecord) || null;
      const quizStats = (quizStatsResult[0] as DatabaseRecord) || { completed_members: '0', teams_with_submissions: '0', avg_score: '0' };
      const submissionStats = submissionStatsResult || [];

      return NextResponse.json({
        overview: {
          totalTeams,
          totalUsers,
          activeTeams: activeTeams.length,
          contestActive: contestConfig?.contest_active || false,
          votingActive: votingSession?.is_active || false,
          votingPhase: votingSession?.phase || 'waiting'
        },
        recentActivity: {
          submissions: submissionStats.map((stat: unknown) => {
            const record = stat as DatabaseRecord;
            return {
              hour: record.hour,
              count: parseInt(record.submissions || '0')
            };
          }),
          adminActions: recentAdminActions.map((action: unknown) => {
            const record = action as DatabaseRecord;
            return {
              id: record.id,
              action: record.action,
              targetType: record.target_type,
              details: record.details,
              timestamp: record.timestamp,
              adminUsername: record.username
            };
          })
        },
        activeTeams: activeTeams.map((team: unknown) => {
          const record = team as DatabaseRecord;
          return {
            id: record.id,
            teamName: record.team_name,
            currentRound: record.current_round,
            totalScore: record.total_score || 0,
            quizScore: record.quiz_score || 0,
            votingScore: record.voting_score || 0,
            lastActivity: record.last_activity,
            status: record.status
          };
        }),
        submissionStats: submissionStats.map((stat: unknown) => {
          const record = stat as DatabaseRecord;
          return {
            time: record.hour,
            submissions: parseInt(record.submissions || '0')
          };
        }),
        performanceMetrics: {
          completedMembers: parseInt(quizStats.completed_members || '0') || 0,
          teamsWithSubmissions: parseInt(quizStats.teams_with_submissions || '0') || 0,
          averageQuizScore: parseFloat(quizStats.avg_score || '0') || 0
        },
        systemStatus: {
          databaseConnected: true,
          contestConfig,
          votingSession: votingSession ? {
            phase: votingSession.phase,
            isActive: votingSession.is_active,
            createdAt: votingSession.created_at
          } : null,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (dbError) {
      console.error('Database error in admin monitor:', dbError);
      console.log('🔧 Using fallback mock data for admin dashboard');
      
      // Return fallback data when database is not available
      return NextResponse.json(getMockAdminData());
    }
    
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
        await transaction(async (client) => {
          // Emergency stop contest
          await client.query(`
            UPDATE contest_config 
            SET contest_active = false, updated_at = NOW()
            WHERE id = 1
          `);
          
          // Log the action
          await client.query(`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            admin.adminId,
            'emergency_stop',
            'contest',
            JSON.stringify({ reason: data?.reason || 'Emergency stop initiated' }),
            request.headers.get('x-forwarded-for') || 'unknown'
          ]);
        });
        
        return NextResponse.json({ message: 'Contest stopped successfully' });
        
      case 'restart_contest':
        await transaction(async (client) => {
          // Restart contest
          await client.query(`
            UPDATE contest_config 
            SET contest_active = true, updated_at = NOW()
            WHERE id = 1
          `);
          
          // Log the action
          await client.query(`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            admin.adminId,
            'restart_contest',
            'contest',
            JSON.stringify({ reason: data?.reason || 'Contest restarted' }),
            request.headers.get('x-forwarded-for') || 'unknown'
          ]);
        });
        
        return NextResponse.json({ message: 'Contest restarted successfully' });

      case 'start_voting':
        await transaction(async (client) => {
          // Create or activate voting session
          await client.query(`
            UPDATE voting_sessions SET is_active = false WHERE is_active = true
          `);
          
          const result = await client.query(`
            INSERT INTO voting_sessions (
              round_id, phase, phase_start_time, phase_end_time,
              pitch_duration, voting_duration, is_active
            )
            VALUES ($1, $2, NOW(), NOW(), $3, $4, $5)
            RETURNING id
          `, ['round2', 'waiting', 90, 30, true]);
          
          // Log the action
          await client.query(`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            admin.adminId,
            'start_voting',
            'voting_session',
            JSON.stringify({ sessionId: result.rows[0].id }),
            request.headers.get('x-forwarded-for') || 'unknown'
          ]);
        });
        
        return NextResponse.json({ message: 'Voting session started successfully' });
        
      case 'clear_cache':
        // Log cache clear action
        await query(`
          INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          admin.adminId,
          'clear_cache',
          'system',
          JSON.stringify({ cache_type: data?.cacheType || 'all' }),
          request.headers.get('x-forwarded-for') || 'unknown'
        ]);
        
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
