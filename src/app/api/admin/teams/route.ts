import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

// Validation schemas
const teamActionSchema = z.object({
  action: z.enum(['update_score', 'change_round', 'add_penalty', 'activate', 'deactivate']),
  teamId: z.string().uuid(),
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
  
  const sessions = await query(
    'SELECT * FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
    [token]
  );
  
  if (sessions.length === 0) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const round = searchParams.get('round');
    const sortBy = searchParams.get('sortBy') || 'total_score';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const whereConditions = ['1=1'];
    const queryParams: (string | number)[] = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereConditions.push(`(t.name ILIKE $${paramCount} OR u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }
    
    if (round) {
      paramCount++;
      whereConditions.push(`t.current_round = $${paramCount}`);
      queryParams.push(parseInt(round));
    }
    
    // Get teams with pagination
    const teamsQuery = `
      SELECT 
        t.*,
        u.full_name as leader_name,
        u.email as leader_email,
        u.university as leader_university,
        (SELECT COUNT(*) FROM user_progress up WHERE up.team_id = t.id) as total_submissions,
        (SELECT COUNT(*) FROM team_penalties tp WHERE tp.team_id = t.id) as penalty_count,
        (SELECT SUM(tp.penalty_minutes) FROM team_penalties tp WHERE tp.team_id = t.id) as total_penalty_minutes
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    
    const teams = await query(teamsQuery, queryParams);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const countResult = await query<{ total: string }>(countQuery, queryParams.slice(0, -2));
    const totalTeams = parseInt(countResult[0].total);
    
    return NextResponse.json({
      teams,
      pagination: {
        page,
        limit,
        total: totalTeams,
        totalPages: Math.ceil(totalTeams / limit)
      }
    });
    
  } catch (error) {
    console.error('Admin teams GET error:', error);
    
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
    
    const adminSession = await verifyAdminSession(token);
    const body = await request.json();
    const validatedData = teamActionSchema.parse(body);
    
    const { action, teamId, data } = validatedData;
    
    let result;
    const logDetails: Record<string, unknown> = { action, teamId };
    
    switch (action) {
      case 'update_score':
        if (!data?.currentScore && !data?.totalScore) {
          return NextResponse.json({ error: 'Score data required' }, { status: 400 });
        }
        
        const updateFields = [];
        const updateParams = [];
        let paramCount = 0;
        
        if (data.currentScore !== undefined) {
          paramCount++;
          updateFields.push(`current_score = $${paramCount}`);
          updateParams.push(parseInt(data.currentScore));
        }
        
        if (data.totalScore !== undefined) {
          paramCount++;
          updateFields.push(`total_score = $${paramCount}`);
          updateParams.push(parseInt(data.totalScore));
        }
        
        paramCount++;
        updateParams.push(teamId);
        
        result = await query(
          `UPDATE teams SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
          updateParams
        );
        
        logDetails.scoreUpdate = { currentScore: data.currentScore, totalScore: data.totalScore };
        break;
        
      case 'change_round':
        if (!data?.round) {
          return NextResponse.json({ error: 'Round number required' }, { status: 400 });
        }
        
        result = await query(
          'UPDATE teams SET current_round = $1, updated_at = NOW() WHERE id = $2',
          [parseInt(data.round), teamId]
        );
        
        logDetails.roundChange = { newRound: data.round };
        break;
        
      case 'add_penalty':
        if (!data?.reason || !data?.minutes) {
          return NextResponse.json({ error: 'Penalty reason and minutes required' }, { status: 400 });
        }
        
        result = await query(
          `INSERT INTO team_penalties (team_id, reason, penalty_minutes, applied_by, applied_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [teamId, data.reason, parseInt(data.minutes), adminSession.adminId]
        );
        
        logDetails.penalty = { reason: data.reason, minutes: data.minutes };
        break;
        
      case 'activate':
        result = await query(
          'UPDATE teams SET is_active = true, updated_at = NOW() WHERE id = $1',
          [teamId]
        );
        break;
        
      case 'deactivate':
        result = await query(
          'UPDATE teams SET is_active = false, updated_at = NOW() WHERE id = $1',
          [teamId]
        );
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Log admin action
    await query(
      `INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
       VALUES ($1, 'team_management', $2, $3)`,
      [
        adminSession.adminId,
        JSON.stringify(logDetails),
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown'
      ]
    );
    
    return NextResponse.json({
      message: `Team ${action} completed successfully`,
      result
    });
    
  } catch (error) {
    console.error('Admin teams POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
