import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

interface AdminUser {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
}

interface TeamStats {
  total_teams: string;
  active_teams: string;
  disqualified_teams: string;
  average_score: string;
  highest_score: string;
}

interface TeamInfo {
  team_name: string;
  team_code: string;
}

// Verify admin token
async function verifyAdminToken(request: NextRequest): Promise<AdminUser> {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      throw new Error('No admin token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AdminTokenPayload;
    
    // Verify admin exists in database
    const adminResult = await query(
      'SELECT id, username, role, is_active FROM admin_users WHERE id = $1 AND is_active = true',
      [decoded.adminId]
    );

    if (adminResult.length === 0) {
      throw new Error('Admin not found or inactive');
    }

    return adminResult[0] as AdminUser;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    throw new Error('Invalid admin token');
  }
}

// GET - Fetch all teams with statistics
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);

    // Get teams with detailed information
    const teamsResult = await query(`
      SELECT 
        t.id,
        t.team_name,
        t.team_code,
        t.current_round,
        t.total_score,
        t.quiz_score,
        t.voting_score,
        t.offline_score,
        t.is_disqualified,
        t.status,
        t.last_activity,
        t.created_at,
        COUNT(tm.user_id) as member_count,
        STRING_AGG(u.username, ', ') as member_names
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      GROUP BY t.id, t.team_name, t.team_code, t.current_round, t.total_score, 
               t.quiz_score, t.voting_score, t.offline_score, t.is_disqualified, 
               t.status, t.last_activity, t.created_at
      ORDER BY t.total_score DESC, t.created_at DESC
    `);

    // Get team statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_teams,
        COUNT(*) FILTER (WHERE status = 'active') as active_teams,
        COUNT(*) FILTER (WHERE is_disqualified = true) as disqualified_teams,
        ROUND(AVG(total_score), 2) as average_score,
        MAX(total_score) as highest_score
      FROM teams
    `);

    const stats = statsResult[0] || {
      total_teams: 0,
      active_teams: 0,
      disqualified_teams: 0,
      average_score: 0,
      highest_score: 0
    };

    // Log admin action
    await query(
      `INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        admin.id,
        'VIEW_TEAMS',
        JSON.stringify({ teams_count: teamsResult.length }),
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      ]
    );

    const statsData = stats as TeamStats;
    return NextResponse.json({
      success: true,
      data: {
        teams: teamsResult,
        stats: {
          totalTeams: parseInt(statsData.total_teams),
          activeTeams: parseInt(statsData.active_teams),
          disqualifiedTeams: parseInt(statsData.disqualified_teams),
          averageScore: parseFloat(statsData.average_score),
          highestScore: parseInt(statsData.highest_score)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    
    if (error instanceof Error && error.message.includes('admin token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams data' },
      { status: 500 }
    );
  }
}

// POST - Create new team or admin actions
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);

    const body = await request.json();
    const { action, teamId, teamName, teamCode, password, members = [], value, reason } = body;

    if (action) {
      // Admin actions on existing teams
      switch (action) {
        case 'update_score':
          if (typeof value !== 'number') {
            return NextResponse.json({ error: 'Score value required' }, { status: 400 });
          }
          
          await query(
            'UPDATE teams SET total_score = $1, updated_at = NOW() WHERE id = $2',
            [value, teamId]
          );
          break;
          
        case 'add_penalty':
          if (typeof value !== 'number') {
            return NextResponse.json({ error: 'Penalty value required' }, { status: 400 });
          }
          
          await transaction(async (client) => {
            // Add penalty record
            await client.query(
              'INSERT INTO team_penalties (team_id, penalty_points, reason, applied_by) VALUES ($1, $2, $3, $4)',
              [teamId, value, reason || 'Admin penalty', admin.id]
            );
            
            // Update team score
            await client.query(
              'UPDATE teams SET offline_score = offline_score - $1, updated_at = NOW() WHERE id = $2',
              [value, teamId]
            );
          });
          break;
          
        case 'reset_progress':
          await query(
            'UPDATE teams SET current_round = 1, total_score = 0, quiz_score = 0, voting_score = 0, offline_score = 0, updated_at = NOW() WHERE id = $1',
            [teamId]
          );
          break;
          
        case 'disqualify':
          await query(
            'UPDATE teams SET is_disqualified = true, status = $1, updated_at = NOW() WHERE id = $2',
            ['disqualified', teamId]
          );
          break;
          
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      
      // Log admin action
      await query(
        `INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          admin.id,
          `TEAM_${action.toUpperCase()}`,
          'team',
          teamId,
          JSON.stringify({ action, value, reason }),
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        ]
      );
      
      return NextResponse.json({ 
        success: true,
        message: `Team ${action} completed successfully` 
      });
      
    } else {
      // Create new team
      if (!teamName || !teamCode || !password) {
        return NextResponse.json(
          { success: false, error: 'Team name, code, and password are required' },
          { status: 400 }
        );
      }

      // Check if team name or code already exists
      const existingTeam = await query(
        'SELECT id FROM teams WHERE team_name = $1 OR team_code = $2',
        [teamName, teamCode]
      );

      if (existingTeam.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Team name or code already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create team in transaction
      const result = await transaction(async (client) => {
        // Insert team
        const teamResult = await client.query(
          `INSERT INTO teams (team_name, team_code, password_hash, status)
           VALUES ($1, $2, $3, 'active')
           RETURNING id, team_name, team_code, created_at`,
          [teamName, teamCode, passwordHash]
        );

        const newTeam = teamResult.rows[0];

        // Add members if provided
        if (members.length > 0) {
          for (const member of members) {
            if (member.username && member.email) {
              // Check if user exists
              const userResult = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [member.email]
              );

              let userId;
              if (userResult.rows.length === 0) {
                // Create new user
                const newUserResult = await client.query(
                  `INSERT INTO users (username, email, password_hash, is_active)
                   VALUES ($1, $2, $3, true)
                   RETURNING id`,
                  [member.username, member.email, passwordHash]
                );
                userId = newUserResult.rows[0].id;
              } else {
                userId = userResult.rows[0].id;
              }

              // Add to team
              await client.query(
                `INSERT INTO team_members (team_id, user_id, is_leader)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (team_id, user_id) DO NOTHING`,
                [newTeam.id, userId, member.isLeader || false]
              );
            }
          }
        }

        return newTeam;
      });

      // Log admin action
      await query(
        `INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          admin.id,
          'CREATE_TEAM',
          'team',
          result.id,
          JSON.stringify({ team_name: teamName, team_code: teamCode, members_count: members.length }),
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        ]
      );

      return NextResponse.json({
        success: true,
        data: {
          team: result,
          message: 'Team created successfully'
        }
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error in teams POST:', error);
    
    if (error instanceof Error && error.message.includes('admin token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Remove team
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get team info before deletion
    const teamInfo = await query(
      'SELECT team_name, team_code FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Delete team (cascade will remove related records)
    await query('DELETE FROM teams WHERE id = $1', [teamId]);

    // Log admin action
    const teamData = teamInfo[0] as TeamInfo;
    await query(
      `INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        admin.id,
        'DELETE_TEAM',
        'team',
        teamId,
        JSON.stringify({ team_name: teamData.team_name, team_code: teamData.team_code }),
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting team:', error);
    
    if (error instanceof Error && error.message.includes('admin token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}