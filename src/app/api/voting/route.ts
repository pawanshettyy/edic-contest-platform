import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
import { executeWithRetry } from '@/lib/database-retry';

// Type definitions for voting system
interface VotingSession {
  id: string;
  phase: 'waiting' | 'pitching' | 'voting' | 'break' | 'completed';
  current_presenting_team?: string;
  time_remaining: number;
  created_at: string;
  updated_at: string;
}

interface TeamVotingData {
  team_id: string;
  team_name: string;
  presentation_order: number;
  has_presented: boolean;
  is_currently_presenting: boolean;
  upvotes: number;
  downvotes: number;
  total_score: number;
  voting_history: VoteRecord[];
  downvotes_used: number;
  can_vote: boolean;
}

interface VoteRecord {
  id: string;
  from_team_id: string;
  to_team_id: string;
  vote_type: 'upvote' | 'downvote';
  session_id: string;
  created_at: string;
}

interface VotingConstraints {
  maxDownvotes: number;
  pitchDuration: number;
  votingDuration: number;
  canVoteForSelf: boolean;
}

// Default voting constraints
const DEFAULT_CONSTRAINTS: VotingConstraints = {
  maxDownvotes: 3,
  pitchDuration: 90,
  votingDuration: 30,
  canVoteForSelf: false
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      return await executeWithRetry(async () => {
        const sql = getSql();
        
        // Get current voting session
        const sessions = await sql`
          SELECT vs.*, 
                 COUNT(t.id) as team_count
          FROM voting_sessions vs
          LEFT JOIN teams t ON t.status = 'active'
          WHERE vs.is_active = true
          GROUP BY vs.id, vs.phase, vs.current_presenting_team, vs.time_remaining, 
                   vs.created_at, vs.updated_at, vs.is_active
          ORDER BY vs.created_at DESC
          LIMIT 1
        ` as Array<VotingSession & {team_count: number}>;

        if (!sessions.length) {
          return NextResponse.json({
            success: true,
            session: {
              id: 'no-session',
              phase: 'waiting',
              teams: [],
              timeRemaining: 0,
              constraints: DEFAULT_CONSTRAINTS
            }
          });
        }

        const session = sessions[0];
        
        // Get all teams with their voting data
        const teams = await sql`
          SELECT 
            t.id as team_id,
            t.team_name,
            COALESCE(tp.presentation_order, 999) as presentation_order,
            COALESCE(tp.has_presented, false) as has_presented,
            ${session.current_presenting_team ? sql`(t.id = ${session.current_presenting_team})` : sql`false`} as is_currently_presenting,
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
          ORDER BY presentation_order, t.team_name
        ` as Array<TeamVotingData>;

        // Get voting history for each team
        const votes = await sql`
          SELECT 
            v.id,
            v.from_team_id,
            v.to_team_id,
            v.vote_type,
            v.session_id,
            v.created_at
          FROM votes v
          WHERE v.session_id = ${session.id}
        ` as Array<VoteRecord>;

        // Process teams data
        const teamsWithVotingData = teams.map(team => {
          const teamVotes = votes.filter(v => v.from_team_id === team.team_id);
          const downvotesUsed = teamVotes.filter(v => v.vote_type === 'downvote').length;
          
          return {
            teamId: team.team_id,
            teamName: team.team_name,
            presentationOrder: team.presentation_order,
            hasPresented: team.has_presented,
            isCurrentlyPresenting: team.is_currently_presenting,
            votesReceived: {
              upvotes: team.upvotes,
              downvotes: team.downvotes,
              totalScore: team.total_score
            },
            votingHistory: teamVotes.map(v => ({
              id: v.id,
              toTeamId: v.to_team_id,
              voteType: v.vote_type,
              sessionId: v.session_id,
              createdAt: v.created_at
            })),
            downvotesUsed,
            canVote: session.phase === 'voting'
          };
        });

        return NextResponse.json({
          success: true,
          session: {
            id: session.id,
            phase: session.phase,
            currentPresentingTeam: session.current_presenting_team,
            timeRemaining: session.time_remaining,
            teams: teamsWithVotingData,
            constraints: DEFAULT_CONSTRAINTS
          }
        });
      });
    }

    if (action === 'results') {
      return await executeWithRetry(async () => {
        const sql = getSql();
        
        // Get final results from the most recent completed session
        const results = await sql`
          SELECT 
            t.id as team_id,
            t.team_name,
            COALESCE(upvotes.count, 0) as upvotes,
            COALESCE(downvotes.count, 0) as downvotes,
            (COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0)) as total_score
          FROM teams t
          LEFT JOIN (
            SELECT to_team_id, COUNT(*) as count 
            FROM votes v
            JOIN voting_sessions vs ON v.session_id = vs.id
            WHERE vs.phase = 'completed' AND vote_type = 'upvote'
            GROUP BY to_team_id
          ) upvotes ON t.id = upvotes.to_team_id
          LEFT JOIN (
            SELECT to_team_id, COUNT(*) as count 
            FROM votes v
            JOIN voting_sessions vs ON v.session_id = vs.id
            WHERE vs.phase = 'completed' AND vote_type = 'downvote'
            GROUP BY to_team_id
          ) downvotes ON t.id = downvotes.to_team_id
          WHERE t.status = 'active'
          ORDER BY total_score DESC, t.team_name
        ` as Array<{
          team_id: string;
          team_name: string;
          upvotes: number;
          downvotes: number;
          total_score: number;
        }>;

        return NextResponse.json({
          success: true,
          results: results.map(r => ({
            teamId: r.team_id,
            teamName: r.team_name,
            upvotes: r.upvotes,
            downvotes: r.downvotes,
            totalScore: r.total_score
          })),
          session: null
        });
      });
    }

    // Default status endpoint
    return NextResponse.json({
      success: true,
      session: {
        id: 'no-session',
        phase: 'waiting',
        teams: [],
        timeRemaining: 0,
        constraints: DEFAULT_CONSTRAINTS
      }
    });

  } catch (error) {
    console.error('Error in GET voting:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch voting data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'vote') {
      return await executeWithRetry(async () => {
        const { fromTeamId, toTeamId, voteType } = body;

        if (!fromTeamId || !toTeamId || !voteType) {
          return NextResponse.json(
            { success: false, error: 'Missing required vote parameters' },
            { status: 400 }
          );
        }

        if (!['upvote', 'downvote'].includes(voteType)) {
          return NextResponse.json(
            { success: false, error: 'Invalid vote type' },
            { status: 400 }
          );
        }

        const sql = getSql();

        // Get current active session
        const sessions = await sql`
          SELECT * FROM voting_sessions 
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT 1
        ` as Array<VotingSession>;

        if (!sessions.length) {
          return NextResponse.json(
            { success: false, error: 'No active voting session' },
            { status: 400 }
          );
        }

        const session = sessions[0];

        // Check if session is completed (voting locked)
        if (session.phase === 'completed') {
          return NextResponse.json(
            { success: false, error: 'Voting session has been completed. Voting is now locked.' },
            { status: 400 }
          );
        }

        // Can only vote during voting phase
        if (session.phase !== 'voting') {
          return NextResponse.json(
            { success: false, error: 'Voting is only allowed during the voting phase' },
            { status: 400 }
          );
        }

        // Validate teams exist
        const teams = await sql`
          SELECT id, team_name FROM teams 
          WHERE id IN (${fromTeamId}, ${toTeamId}) AND status = 'active'
        ` as Array<{id: string, team_name: string}>;

        if (teams.length !== 2) {
          return NextResponse.json(
            { success: false, error: 'Invalid team IDs' },
            { status: 400 }
          );
        }

        // Check if voting for own team
        if (fromTeamId === toTeamId && !DEFAULT_CONSTRAINTS.canVoteForSelf) {
          return NextResponse.json(
            { success: false, error: 'Cannot vote for your own team' },
            { status: 400 }
          );
        }

        // Check if already voted for this team in this session
        const existingVotes = await sql`
          SELECT * FROM votes 
          WHERE from_team_id = ${fromTeamId} 
            AND to_team_id = ${toTeamId} 
            AND session_id = ${session.id}
        ` as Array<VoteRecord>;

        if (existingVotes.length > 0) {
          return NextResponse.json(
            { success: false, error: 'Already voted for this team' },
            { status: 400 }
          );
        }

        // Check downvote limit
        if (voteType === 'downvote') {
          const downvoteCount = await sql`
            SELECT COUNT(*) as count FROM votes 
            WHERE from_team_id = ${fromTeamId} 
              AND session_id = ${session.id} 
              AND vote_type = 'downvote'
          ` as Array<{count: string}>;

          const downvotesUsed = parseInt(downvoteCount[0]?.count || '0');
          if (downvotesUsed >= DEFAULT_CONSTRAINTS.maxDownvotes) {
            return NextResponse.json(
              { success: false, error: `Maximum ${DEFAULT_CONSTRAINTS.maxDownvotes} downvotes allowed` },
              { status: 400 }
            );
          }
        }

        // Cast the vote
        await sql`
          INSERT INTO votes (from_team_id, to_team_id, vote_type, session_id)
          VALUES (${fromTeamId}, ${toTeamId}, ${voteType}, ${session.id})
        `;

        return NextResponse.json({
          success: true,
          message: `${voteType} cast successfully`
        });
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Voting POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process vote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
