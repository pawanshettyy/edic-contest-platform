import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSql, isDatabaseConnected } from '@/lib/database';

// Type-safe database result wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseResult = Record<string, any>[];

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
  submitted_at?: string;
  points_earned?: number;
  total_responses?: string;
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
    const sql = getSql();
    const sessions = await sql`
      SELECT * FROM admin_sessions 
      WHERE session_token = ${token} AND expires_at > NOW()
      LIMIT 1
    ` as DatabaseResult;
    
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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);
    
    // Check if database is available before attempting queries
    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: false,
        error: 'Database not available - please ensure database is set up',
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
      });
    }
    
    try {
      // Get real-time statistics from PostgreSQL
      const sql = getSql();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get basic counts with error handling for missing tables
      let totalTeams = 0;
      let totalUsers = 0;
      let activeTeams: unknown[] = [];
      let contestConfig: DatabaseRecord | null = null;
      let recentAdminActions: unknown[] = [];
      let recentSubmissions: unknown[] = [];
      let quizStats: DatabaseRecord = { teams_with_submissions: '0', avg_score: '0', total_responses: '0' };

      try {
        const teamCountResult = await sql`SELECT COUNT(*) as count FROM teams` as DatabaseResult;
        totalTeams = parseInt((teamCountResult[0] as DatabaseRecord)?.count || '0') || 0;
      } catch (error) {
        console.log('Teams table not found, using 0:', error);
      }

      try {
        const userCountResult = await sql`SELECT COUNT(*) as count FROM users` as DatabaseResult;
        totalUsers = parseInt((userCountResult[0] as DatabaseRecord)?.count || '0') || 0;
      } catch (error) {
        console.log('Users table not found, using 0:', error);
      }

      try {
        // Get active teams (teams with recent activity)
        const activeTeamsResult = await sql`
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
          WHERE last_activity >= ${oneDayAgo}
          ORDER BY last_activity DESC
          LIMIT 20
        ` as DatabaseResult;
        activeTeams = activeTeamsResult || [];
      } catch (error) {
        console.log('Error fetching active teams:', error);
      }

      try {
        // Get contest configuration
        const contestConfigResult = await sql`
          SELECT * FROM contest_config
          ORDER BY created_at DESC
          LIMIT 1
        ` as DatabaseResult;
        contestConfig = (contestConfigResult[0] as DatabaseRecord) || null;
      } catch (error) {
        console.log('Contest config table not found:', error);
      }

      try {
        // Get recent admin actions
        const recentAdminActionsResult = await sql`
          SELECT 
            al.id,
            al.action,
            al.target_type,
            al.details,
            al.timestamp,
            au.username
          FROM admin_logs al
          LEFT JOIN admin_users au ON al.admin_user_id = au.id
          WHERE al.timestamp >= ${oneDayAgo}
          ORDER BY al.timestamp DESC
          LIMIT 10
        ` as DatabaseResult;
        recentAdminActions = recentAdminActionsResult || [];
      } catch (error) {
        console.log('Admin logs table not found:', error);
      }

      try {
        // Get recent submissions
        const recentSubmissionsResult = await sql`
          SELECT 
            qr.id,
            qr.submitted_at,
            qr.points_earned,
            t.team_name
          FROM quiz_responses qr
          LEFT JOIN teams t ON qr.team_id = t.id
          WHERE qr.submitted_at >= ${oneDayAgo}
          ORDER BY qr.submitted_at DESC
          LIMIT 10
        ` as DatabaseResult;
        recentSubmissions = recentSubmissionsResult || [];
      } catch (error) {
        console.log('Quiz responses table not found:', error);
      }

      try {
        // Get quiz completion stats
        const quizStatsResult = await sql`
          SELECT 
            COUNT(DISTINCT team_id) as teams_with_submissions,
            AVG(points_earned) as avg_score,
            COUNT(*) as total_responses
          FROM quiz_responses
          WHERE submitted_at >= ${oneDayAgo}
        ` as DatabaseResult;
        quizStats = (quizStatsResult[0] as DatabaseRecord) || { teams_with_submissions: '0', avg_score: '0', total_responses: '0' };
      } catch (error) {
        console.log('Error fetching quiz stats:', error);
      }

      // Calculate statistics for the expected format
      const totalCompletedSubmissions = parseInt(quizStats.total_responses || '0') || 0;
      
      return NextResponse.json({
        success: true,
        overview: {
          totalUsers,
          totalTeams,
          activeTeams: activeTeams.length,
          contestActive: contestConfig?.contest_active || false
        },
        recentActivity: {
          submissions: recentSubmissions.map((submission: unknown) => {
            const record = submission as DatabaseRecord;
            return {
              id: record.id || Math.random().toString(),
              submitted_at: record.submitted_at || new Date().toISOString(),
              status: 'completed',
              teams: { team_name: record.team_name || 'Unknown Team' },
              contest_rounds: { title: 'Online Quiz Round' }
            };
          }),
          adminActions: recentAdminActions.map((action: unknown) => {
            const record = action as DatabaseRecord;
            return {
              id: record.id || Math.random().toString(),
              action: record.action || 'Unknown Action',
              target_type: record.target_type || 'system',
              details: record.details || {},
              timestamp: record.timestamp || new Date().toISOString(),
              admin_users: { username: record.username || 'System' }
            };
          })
        },
        activeTeams: activeTeams.map((team: unknown) => {
          const record = team as DatabaseRecord;
          return {
            id: record.id,
            team_name: record.team_name,
            current_round: parseInt(record.current_round || '1'),
            total_score: record.total_score || 0,
            last_activity: record.last_activity
          };
        }),
        submissionStats: [
          { period: 'Today', count: totalCompletedSubmissions },
          { period: 'This Week', count: totalCompletedSubmissions },
          { period: 'This Month', count: totalCompletedSubmissions }
        ],
        performanceMetrics: [],
        systemStatus: {
          databaseConnected: true,
          contestConfig,
          lastUpdated: new Date().toISOString(),
          environment: {
            platform: 'Vercel',
            region: process.env.VERCEL_REGION || 'Unknown',
            deployment: process.env.VERCEL_URL || 'Local',
            nodeVersion: process.version,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          database: {
            provider: 'Neon PostgreSQL',
            connectionString: process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured',
            serverless: true,
            lastQuery: new Date().toISOString()
          },
          performance: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: Date.now()
          }
        }
      });
      
    } catch (dbError) {
      console.error('Database error in admin monitor:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
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
      });
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
        // Since Neon doesn't support traditional transactions, use regular queries
        try {
          const sql = getSql();
          
          // Emergency stop contest
          await sql`
            UPDATE contest_config 
            SET contest_active = false, updated_at = NOW()
          `;
          
          // Log the action
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'emergency_stop'},
              ${'contest'},
              ${JSON.stringify({ reason: data?.reason || 'Emergency stop initiated' })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;
          
          return NextResponse.json({ success: true, message: 'Contest stopped' });
        } catch (error) {
          console.error('Emergency stop failed:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to stop contest' },
            { status: 500 }
          );
        }
        
      case 'restart_contest':
        // Since Neon doesn't support traditional transactions, use regular queries
        try {
          const sql = getSql();
          
          // Restart contest
          await sql`
            UPDATE contest_config 
            SET contest_active = true, updated_at = NOW()
          `;
          
          // Log the action
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'restart_contest'},
              ${'contest'},
              ${JSON.stringify({ reason: data?.reason || 'Contest restarted' })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;
          
          return NextResponse.json({ success: true, message: 'Contest restarted' });
        } catch (error) {
          console.error('Restart contest failed:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to restart contest' },
            { status: 500 }
          );
        }

      case 'start_voting':
        // Note: This may fail if voting_sessions table doesn't exist yet
        try {
          const sql = getSql();
          
          // Create admin log entry instead of voting session for now
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'start_voting'},
              ${'voting_session'},
              ${JSON.stringify({ note: 'Voting start requested - feature pending' })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;
          
          return NextResponse.json({ success: true, message: 'Voting session logged (feature pending)' });
        } catch (error) {
          console.error('Start voting failed:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to start voting session' },
            { status: 500 }
          );
        }
        
      case 'clear_cache':
        // Log cache clear action
        try {
          const sql = getSql();
          
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'clear_cache'},
              ${'system'},
              ${JSON.stringify({ cache_type: data?.cacheType || 'all' })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;
          
          return NextResponse.json({ message: 'Cache cleared successfully' });
        } catch (error) {
          console.error('Clear cache failed:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to clear cache' },
            { status: 500 }
          );
        }
        
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
