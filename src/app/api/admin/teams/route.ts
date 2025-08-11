import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
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

// Verify admin token
async function verifyAdminToken(request: NextRequest): Promise<AdminUser> {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      throw new Error('No admin token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AdminTokenPayload;
    
    // For development, if we have a valid JWT token, allow access
    if (process.env.NODE_ENV === 'development') {
      return {
        id: decoded.adminId,
        username: decoded.username,
        role: decoded.role || 'admin',
        is_active: true
      };
    }
    
    // Verify admin exists in database
    const sql = getSql();
    const adminResult = await sql`
      SELECT id, username, role, is_active 
      FROM admin_users 
      WHERE id = ${decoded.adminId} AND is_active = true
    ` as AdminUser[];

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

    try {
      // Get teams with detailed information
      const sql = getSql();
      const teamsResult = await sql`
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
      `;

      // Get team statistics
      const statsResult = await sql`
        SELECT 
          COUNT(*) as total_teams,
          COUNT(*) FILTER (WHERE status = 'active') as active_teams,
          COUNT(*) FILTER (WHERE is_disqualified = true) as disqualified_teams,
        ROUND(AVG(total_score), 2) as average_score,
        MAX(total_score) as highest_score
      FROM teams
    `;

      const stats = (statsResult as TeamStats[])[0] || {
        total_teams: '0',
        active_teams: '0',
        disqualified_teams: '0',
        average_score: '0',
        highest_score: '0'
      };

      // Log admin action
      await sql`
        INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
        VALUES (
          ${admin.id},
          ${'VIEW_TEAMS'},
          ${JSON.stringify({ teams_count: (teamsResult as unknown[]).length })},
          ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}
        )
      `;      const statsData = stats as TeamStats;
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

    } catch (dbError) {
      console.log('Database error, returning fallback data:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          teams: [],
          stats: {
            totalTeams: 0,
            activeTeams: 0,
            disqualifiedTeams: 0,
            averageScore: 0,
            highestScore: 0
          }
        }
      });
    }

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
          
          const sql = getSql();
          await sql`
            UPDATE teams SET total_score = ${value}, updated_at = NOW() WHERE id = ${teamId}
          `;
          break;
          
        case 'add_penalty':
          if (typeof value !== 'number') {
            return NextResponse.json({ error: 'Penalty value required' }, { status: 400 });
          }
          
          try {
            const sql = getSql();
            // Add penalty record
            await sql`
              INSERT INTO team_penalties (team_id, penalty_points, reason, applied_by) 
              VALUES (${teamId}, ${value}, ${reason || 'Admin penalty'}, ${admin.id})
            `;
            
            // Update team score
            await sql`
              UPDATE teams SET offline_score = offline_score - ${value}, updated_at = NOW() WHERE id = ${teamId}
            `;
          } catch (error) {
            console.error('Error applying penalty:', error);
            return NextResponse.json({ error: 'Failed to apply penalty' }, { status: 500 });
          }
          break;
          
        case 'reset_progress':
          {
            const sql = getSql();
            await sql`
              UPDATE teams SET current_round = 1, total_score = 0, quiz_score = 0, voting_score = 0, offline_score = 0, updated_at = NOW() WHERE id = ${teamId}
            `;
          }
          break;
          
        case 'disqualify':
          {
            const sql = getSql();
            await sql`
              UPDATE teams SET is_disqualified = true, status = 'disqualified', updated_at = NOW() WHERE id = ${teamId}
            `;
          }
          break;
          
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      
      // Log admin action
      const sql = getSql();
      await sql`
        INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
        VALUES (${admin.id}, ${'TEAM_' + action.toUpperCase()}, 'team', ${teamId}, ${JSON.stringify({ action, value, reason })}, ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'})
      `;
      
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
      const sql = getSql();
      const existingTeam = await sql`
        SELECT id FROM teams WHERE team_name = ${teamName} OR team_code = ${teamCode}
      `;

      if ((existingTeam as unknown[]).length > 0) {
        return NextResponse.json(
          { success: false, error: 'Team name or code already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create team (converted from transaction for Neon serverless)
      try {
        // Insert team
        const teamResult = await sql`
          INSERT INTO teams (team_name, team_code, password_hash, status)
          VALUES (${teamName}, ${teamCode}, ${passwordHash}, 'active')
          RETURNING id, team_name, team_code, created_at
        `;

        const newTeam = (teamResult as unknown[])[0];

        // Add members if provided
        if (members.length > 0) {
          for (const member of members) {
            if (member.username && member.email) {
              // Check if user exists
              const userResult = await sql`
                SELECT id FROM users WHERE email = ${member.email}
              `;

              let userId;
              if ((userResult as unknown[]).length === 0) {
                // Create new user
                const newUserResult = await sql`
                  INSERT INTO users (username, email, password_hash, is_active)
                  VALUES (${member.username}, ${member.email}, ${passwordHash}, true)
                  RETURNING id
                `;
                userId = ((newUserResult as unknown[])[0] as { id: string }).id;
              } else {
                userId = ((userResult as unknown[])[0] as { id: string }).id;
              }

              // Add to team
              await sql`
                INSERT INTO team_members (team_id, user_id, is_leader)
                VALUES (${(newTeam as { id: string }).id}, ${userId}, ${member.isLeader || false})
                ON CONFLICT (team_id, user_id) DO NOTHING
              `;
            }
          }
        }

        // Log admin action
        await sql`
          INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
          VALUES (${admin.id}, 'TEAM_CREATE', 'team', ${(newTeam as { id: string }).id}, ${JSON.stringify({ teamName, teamCode, memberCount: members.length })}, ${request.headers.get('x-forwarded-for') || 'unknown'})
        `;

        return NextResponse.json({
          success: true,
          data: {
            team: newTeam,
            message: 'Team created successfully'
          }
        }, { status: 201 });

      } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create team' },
          { status: 500 }
        );
      }
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
    const sql = getSql();
    const teamInfo = await sql`
      SELECT team_name, team_code FROM teams WHERE id = ${teamId}
    `;

    if ((teamInfo as unknown[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Delete team (cascade will remove related records)
    await sql`DELETE FROM teams WHERE id = ${teamId}`;

    // Log admin action
    const teamData = (teamInfo as unknown[])[0] as { team_name: string; team_code: string };
    await sql`
      INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
      VALUES (${admin.id}, 'DELETE_TEAM', 'team', ${teamId}, ${JSON.stringify({ team_name: teamData.team_name, team_code: teamData.team_code })}, ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'})
    `;

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