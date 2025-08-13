import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSql } from '@/lib/database';
import { executeWithRetry } from '@/lib/database-retry';
import { votingTimer } from '@/lib/voting-timer';

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
  
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);

    return await executeWithRetry(async () => {
      const sql = getSql();
      
      // Get current voting session
      const sessions = await sql`
        SELECT vs.*,
               COUNT(DISTINCT t.id) as registered_teams,
               COUNT(DISTINCT tp.team_id) as teams_with_order
        FROM voting_sessions vs
        LEFT JOIN teams t ON t.status = 'active'
        LEFT JOIN team_presentations tp ON tp.session_id = vs.id
        WHERE vs.is_active = true
        GROUP BY vs.id, vs.phase, vs.current_presenting_team, vs.time_remaining, 
                 vs.created_at, vs.updated_at, vs.is_active
        ORDER BY vs.created_at DESC
        LIMIT 1
      ` as Array<{
        id: string;
        phase: string;
        current_presenting_team?: string;
        time_remaining: number;
        created_at: string;
        updated_at: string;
        is_active: boolean;
        registered_teams: number;
        teams_with_order: number;
      }>;

      let currentSession = null;
      let teams: Array<{
        id: string;
        team_name: string;
        presentation_order?: number;
        has_presented: boolean;
        upvotes: number;
        downvotes: number;
        total_score: number;
      }> = [];

      if (sessions.length > 0) {
        const session = sessions[0];
        currentSession = {
          id: session.id,
          phase: session.phase,
          currentPresentingTeam: session.current_presenting_team,
          timeRemaining: session.time_remaining,
          isActive: session.is_active,
          registeredTeams: session.registered_teams,
          teamsWithOrder: session.teams_with_order
        };

        // Get teams with voting data
        teams = await sql`
          SELECT 
            t.id,
            t.team_name,
            tp.presentation_order,
            COALESCE(tp.has_presented, false) as has_presented,
            COALESCE(upvotes.count, 0) as upvotes,
            COALESCE(downvotes.count, 0) as downvotes,
            (COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0)) as total_score
          FROM teams t
          LEFT JOIN team_presentations tp ON t.id = tp.team_id AND tp.session_id = ${session.id}
          LEFT JOIN (
            SELECT to_team_id, COUNT(*) as count 
            FROM votes 
            WHERE session_id = ${session.id} AND vote_type = 'upvote'
            GROUP BY to_team_id
          ) upvotes ON t.id = upvotes.to_team_id
          LEFT JOIN (
            SELECT to_team_id, COUNT(*) as count 
            FROM votes 
            WHERE session_id = ${session.id} AND vote_type = 'downvote'
            GROUP BY to_team_id
          ) downvotes ON t.id = downvotes.to_team_id
          WHERE t.status = 'active'
          ORDER BY COALESCE(tp.presentation_order, 999), t.team_name
        ` as Array<{
          id: string;
          team_name: string;
          presentation_order?: number;
          has_presented: boolean;
          upvotes: number;
          downvotes: number;
          total_score: number;
        }>;
      } else {
        // Get all active teams for session creation
        teams = await sql`
          SELECT id, team_name, 0 as upvotes, 0 as downvotes, 0 as total_score, 
                 false as has_presented
          FROM teams 
          WHERE status = 'active'
          ORDER BY team_name
        ` as Array<{
          id: string;
          team_name: string;
          presentation_order?: number;
          has_presented: boolean;
          upvotes: number;
          downvotes: number;
          total_score: number;
        }>;
      }

      // Get voting statistics
      const voteStats = currentSession ? await sql`
        SELECT 
          vote_type,
          COUNT(*) as count
        FROM votes 
        WHERE session_id = ${currentSession.id}
        GROUP BY vote_type
      ` as Array<{vote_type: string, count: number}> : [];

      const stats = {
        totalVotes: voteStats.reduce((sum, stat) => sum + stat.count, 0),
        upvotes: voteStats.find(s => s.vote_type === 'upvote')?.count || 0,
        downvotes: voteStats.find(s => s.vote_type === 'downvote')?.count || 0
      };

      return NextResponse.json({
        success: true,
        currentSession,
        teams,
        stats
      });
    });

  } catch (error) {
    console.error('Admin voting GET error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch voting data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    return await executeWithRetry(async () => {
      const sql = getSql();

      switch (action) {
        case 'create_session': {
          // Check if there's already an active session
          const existingSessions = await sql`
            SELECT id FROM voting_sessions WHERE is_active = true
          ` as Array<{id: string}>;

          if (existingSessions.length > 0) {
            return NextResponse.json(
              { success: false, error: 'There is already an active voting session' },
              { status: 400 }
            );
          }

          // Create new voting session
          const sessionResult = await sql`
            INSERT INTO voting_sessions (phase, time_remaining, is_active)
            VALUES ('waiting', 0, true)
            RETURNING id
          ` as Array<{id: string}>;

          const sessionId = sessionResult[0].id;

          // Get all active teams and assign presentation order
          const teams = await sql`
            SELECT id FROM teams WHERE status = 'active' ORDER BY RANDOM()
          ` as Array<{id: string}>;

          // Create team presentations with random order
          for (let i = 0; i < teams.length; i++) {
            await sql`
              INSERT INTO team_presentations (team_id, session_id, presentation_order)
              VALUES (${teams[i].id}, ${sessionId}, ${i + 1})
            `;
          }

          // Log the action
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'create_voting_session'},
              ${'voting_session'},
              ${JSON.stringify({ sessionId, teamsCount: teams.length })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;

          return NextResponse.json({
            success: true,
            message: 'Voting session created successfully',
            sessionId,
            teamsCount: teams.length
          });
        }

        case 'start_session': {
          const { sessionId } = data;

          // Update session to pitching phase and set first team
          const firstTeam = await sql`
            SELECT team_id FROM team_presentations 
            WHERE session_id = ${sessionId} AND presentation_order = 1
            LIMIT 1
          ` as Array<{team_id: string}>;

          if (!firstTeam.length) {
            return NextResponse.json(
              { success: false, error: 'No teams found for this session' },
              { status: 400 }
            );
          }

          const pitchDuration = data.pitchDuration || 90;

          await sql`
            UPDATE voting_sessions 
            SET phase = 'pitching', 
                current_presenting_team = ${firstTeam[0].team_id},
                time_remaining = ${pitchDuration},
                updated_at = NOW()
            WHERE id = ${sessionId}
          `;

          // Start the server-side timer
          votingTimer.startTimer(sessionId, pitchDuration);

          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'start_voting_session'},
              ${'voting_session'},
              ${JSON.stringify({ sessionId, firstTeam: firstTeam[0].team_id, pitchDuration })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;

          return NextResponse.json({
            success: true,
            message: 'Voting session started'
          });
        }

        case 'next_phase': {
          const { sessionId } = data;

          // Get current session
          const sessions = await sql`
            SELECT * FROM voting_sessions WHERE id = ${sessionId}
          ` as Array<{
            id: string;
            phase: string;
            current_presenting_team?: string;
            time_remaining: number;
          }>;

          if (!sessions.length) {
            return NextResponse.json(
              { success: false, error: 'Session not found' },
              { status: 404 }
            );
          }

          const session = sessions[0];
          let newPhase = session.phase;
          let timeRemaining = 0;
          let currentTeam = session.current_presenting_team;

          switch (session.phase) {
            case 'pitching':
              newPhase = 'voting';
              timeRemaining = data.votingDuration || 30;
              break;

            case 'voting':
              // Mark current team as presented
              if (currentTeam) {
                await sql`
                  UPDATE team_presentations 
                  SET has_presented = true 
                  WHERE team_id = ${currentTeam} AND session_id = ${sessionId}
                `;
              }

              // Get next team
              const nextTeam = await sql`
                SELECT team_id FROM team_presentations 
                WHERE session_id = ${sessionId} 
                  AND has_presented = false 
                  AND presentation_order > (
                    SELECT presentation_order FROM team_presentations 
                    WHERE team_id = ${currentTeam} AND session_id = ${sessionId}
                  )
                ORDER BY presentation_order ASC
                LIMIT 1
              ` as Array<{team_id: string}>;

              if (nextTeam.length > 0) {
                newPhase = 'pitching';
                timeRemaining = data.pitchDuration || 90;
                currentTeam = nextTeam[0].team_id;
              } else {
                newPhase = 'completed';
                timeRemaining = 0;
                currentTeam = undefined;
              }
              break;

            default:
              return NextResponse.json(
                { success: false, error: 'Cannot advance from current phase' },
                { status: 400 }
              );
          }

          await sql`
            UPDATE voting_sessions 
            SET phase = ${newPhase}, 
                current_presenting_team = ${currentTeam},
                time_remaining = ${timeRemaining},
                updated_at = NOW()
            WHERE id = ${sessionId}
          `;

          return NextResponse.json({
            success: true,
            message: `Advanced to ${newPhase} phase`,
            newPhase,
            currentTeam
          });
        }

        case 'end_session': {
          const { sessionId } = data;

          await sql`
            UPDATE voting_sessions 
            SET phase = 'completed', 
                is_active = false,
                time_remaining = 0,
                updated_at = NOW()
            WHERE id = ${sessionId}
          `;

          // Stop the timer
          votingTimer.stopTimer(sessionId);

          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'end_voting_session'},
              ${'voting_session'},
              ${JSON.stringify({ sessionId })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;

          return NextResponse.json({
            success: true,
            message: 'Voting session ended'
          });
        }

        case 'reset_votes': {
          const { sessionId, teamId } = data;

          if (teamId) {
            // Reset votes for specific team
            await sql`
              DELETE FROM votes 
              WHERE session_id = ${sessionId} AND to_team_id = ${teamId}
            `;
          } else {
            // Reset all votes for session
            await sql`
              DELETE FROM votes WHERE session_id = ${sessionId}
            `;
          }

          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address)
            VALUES (
              ${admin.adminId},
              ${'reset_votes'},
              ${'voting_session'},
              ${JSON.stringify({ sessionId, teamId: teamId || 'all' })},
              ${request.headers.get('x-forwarded-for') || 'unknown'}
            )
          `;

          return NextResponse.json({
            success: true,
            message: teamId ? 'Team votes reset' : 'All votes reset'
          });
        }

        case 'update_timer': {
          const { sessionId, timeRemaining } = data;

          await sql`
            UPDATE voting_sessions 
            SET time_remaining = ${timeRemaining}, updated_at = NOW()
            WHERE id = ${sessionId}
          `;

          // Update the timer system
          await votingTimer.updateTimer(sessionId, timeRemaining);

          return NextResponse.json({
            success: true,
            message: 'Timer updated'
          });
        }

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    });

  } catch (error) {
    console.error('Admin voting POST error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process admin action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
