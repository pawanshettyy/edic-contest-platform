import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
import { executeWithRetry } from '@/lib/database-retry';

export async function POST() {
  try {
    return await executeWithRetry(async () => {
      const sql = getSql();
      
      console.log('🗳️  Setting up voting system database tables...');
      
      // Voting Sessions Table
      await sql`
        CREATE TABLE IF NOT EXISTS voting_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phase VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (phase IN ('waiting', 'pitching', 'voting', 'break', 'completed')),
          current_presenting_team UUID,
          time_remaining INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('✅ Created voting_sessions table');

      // Team Presentations Table
      await sql`
        CREATE TABLE IF NOT EXISTS team_presentations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL,
          session_id UUID NOT NULL,
          presentation_order INTEGER NOT NULL,
          has_presented BOOLEAN NOT NULL DEFAULT false,
          presentation_start_time TIMESTAMP WITH TIME ZONE,
          presentation_end_time TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(team_id, session_id),
          UNIQUE(session_id, presentation_order)
        )
      `;
      console.log('✅ Created team_presentations table');

      // Votes Table
      await sql`
        CREATE TABLE IF NOT EXISTS votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          from_team_id UUID NOT NULL,
          to_team_id UUID NOT NULL,
          vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
          session_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(from_team_id, to_team_id, session_id),
          CHECK (from_team_id != to_team_id)
        )
      `;
      console.log('✅ Created votes table');

      // Voting Session Logs Table
      await sql`
        CREATE TABLE IF NOT EXISTS voting_session_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID,
          action VARCHAR(50) NOT NULL,
          details JSONB,
          admin_user_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('✅ Created voting_session_logs table');

      // Create indexes for performance
      try {
        await sql`CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active, created_at)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_voting_sessions_phase ON voting_sessions(phase)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_team_presentations_session ON team_presentations(session_id, presentation_order)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_team_presentations_team ON team_presentations(team_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_votes_from_team ON votes(from_team_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_votes_to_team ON votes(to_team_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_voting_session_logs_session ON voting_session_logs(session_id)`;
        console.log('✅ Created performance indexes');
      } catch (indexError) {
        console.log('⚠️  Some indexes may already exist:', indexError);
      }

      // Create views for easier querying
      try {
        await sql`
          CREATE OR REPLACE VIEW current_voting_session AS
          SELECT 
            vs.*,
            COUNT(DISTINCT tp.team_id) as teams_count,
            COUNT(DISTINCT v.id) as total_votes,
            COUNT(DISTINCT CASE WHEN v.vote_type = 'upvote' THEN v.id END) as total_upvotes,
            COUNT(DISTINCT CASE WHEN v.vote_type = 'downvote' THEN v.id END) as total_downvotes
          FROM voting_sessions vs
          LEFT JOIN team_presentations tp ON vs.id = tp.session_id
          LEFT JOIN votes v ON vs.id = v.session_id
          WHERE vs.is_active = true
          GROUP BY vs.id, vs.phase, vs.current_presenting_team, vs.time_remaining, 
                   vs.is_active, vs.created_at, vs.updated_at
        `;
        console.log('✅ Created current_voting_session view');

        await sql`
          CREATE OR REPLACE VIEW team_voting_summary AS
          SELECT 
            t.id as team_id,
            t.team_name,
            tp.session_id,
            tp.presentation_order,
            tp.has_presented,
            COALESCE(upvotes.count, 0) as upvotes_received,
            COALESCE(downvotes.count, 0) as downvotes_received,
            COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0) as total_score,
            COALESCE(votes_cast.upvotes, 0) as upvotes_cast,
            COALESCE(votes_cast.downvotes, 0) as downvotes_cast,
            COALESCE(votes_cast.total, 0) as total_votes_cast
          FROM teams t
          LEFT JOIN team_presentations tp ON t.id = tp.team_id
          LEFT JOIN (
            SELECT to_team_id, COUNT(*) as count
            FROM votes
            WHERE vote_type = 'upvote'
            GROUP BY to_team_id
          ) upvotes ON t.id = upvotes.to_team_id
          LEFT JOIN (
            SELECT to_team_id, COUNT(*) as count
            FROM votes
            WHERE vote_type = 'downvote'
            GROUP BY to_team_id
          ) downvotes ON t.id = downvotes.to_team_id
          LEFT JOIN (
            SELECT 
              from_team_id,
              COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
              COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
              COUNT(*) as total
            FROM votes
            GROUP BY from_team_id
          ) votes_cast ON t.id = votes_cast.from_team_id
          WHERE t.status = 'active'
        `;
        console.log('✅ Created team_voting_summary view');
      } catch (viewError) {
        console.log('⚠️  Views may already exist:', viewError);
      }

      // Create or update functions and triggers
      try {
        await sql`
          CREATE OR REPLACE FUNCTION update_voting_session_timestamp()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql
        `;

        await sql`DROP TRIGGER IF EXISTS voting_session_update_timestamp ON voting_sessions`;
        await sql`
          CREATE TRIGGER voting_session_update_timestamp
            BEFORE UPDATE ON voting_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_voting_session_timestamp()
        `;
        console.log('✅ Created timestamp update trigger');

        await sql`
          CREATE OR REPLACE FUNCTION validate_vote_constraints()
          RETURNS TRIGGER AS $$
          DECLARE
            downvote_count INTEGER;
            max_downvotes INTEGER := 3;
          BEGIN
            IF NEW.vote_type = 'downvote' THEN
              SELECT COUNT(*) INTO downvote_count
              FROM votes
              WHERE from_team_id = NEW.from_team_id
                AND session_id = NEW.session_id
                AND vote_type = 'downvote';
                
              IF downvote_count >= max_downvotes THEN
                RAISE EXCEPTION 'Maximum % downvotes per team exceeded', max_downvotes;
              END IF;
            END IF;
            
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql
        `;

        await sql`DROP TRIGGER IF EXISTS validate_vote_constraints_trigger ON votes`;
        await sql`
          CREATE TRIGGER validate_vote_constraints_trigger
            BEFORE INSERT ON votes
            FOR EACH ROW
            EXECUTE FUNCTION validate_vote_constraints()
        `;
        console.log('✅ Created vote validation trigger');
      } catch (triggerError) {
        console.log('⚠️  Triggers may already exist:', triggerError);
      }

      // Verify tables exist and get counts
      const tables = ['voting_sessions', 'team_presentations', 'votes', 'voting_session_logs'];
      const verification = [];

      for (const table of tables) {
        try {
          let result;
          if (table === 'voting_sessions') {
            result = await sql`SELECT COUNT(*) as count FROM voting_sessions`;
          } else if (table === 'team_presentations') {
            result = await sql`SELECT COUNT(*) as count FROM team_presentations`;
          } else if (table === 'votes') {
            result = await sql`SELECT COUNT(*) as count FROM votes`;
          } else if (table === 'voting_session_logs') {
            result = await sql`SELECT COUNT(*) as count FROM voting_session_logs`;
          } else {
            throw new Error('Unknown table');
          }
          
          const typedResult = result as Array<{count: string}>;
          verification.push({
            table,
            exists: true,
            count: parseInt(typedResult[0]?.count || '0')
          });
        } catch (error) {
          verification.push({
            table,
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log('🗳️  Voting system setup completed successfully!');

      return NextResponse.json({
        success: true,
        message: 'Voting system database setup completed successfully',
        verification,
        features: [
          'Real-time voting sessions with phase management',
          'Team presentation order randomization',
          'Vote validation and constraints (max 3 downvotes)',
          'Admin controls for session management',
          'Audit logging for all voting activities',
          'Performance optimized with indexes and views',
          'Self-voting prevention',
          'Duplicate vote prevention'
        ],
        nextSteps: [
          '1. Create sample teams using /api/setup/teams',
          '2. Access admin voting controls at /admin/voting',
          '3. Teams can access voting at /voting (after quiz completion)',
          '4. Real-time updates every 5 seconds during active sessions'
        ]
      });
    });

  } catch (error) {
    console.error('❌ Voting system setup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup voting system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return await executeWithRetry(async () => {
      const sql = getSql();
      
      // Check if voting tables exist and get status
      const tables = ['voting_sessions', 'team_presentations', 'votes', 'voting_session_logs'];
      const status = [];

      for (const table of tables) {
        try {
          let result;
          if (table === 'voting_sessions') {
            result = await sql`SELECT COUNT(*) as count FROM voting_sessions`;
          } else if (table === 'team_presentations') {
            result = await sql`SELECT COUNT(*) as count FROM team_presentations`;
          } else if (table === 'votes') {
            result = await sql`SELECT COUNT(*) as count FROM votes`;
          } else if (table === 'voting_session_logs') {
            result = await sql`SELECT COUNT(*) as count FROM voting_session_logs`;
          } else {
            throw new Error('Unknown table');
          }
          
          const typedResult = result as Array<{count: string}>;
          status.push({
            table,
            exists: true,
            count: parseInt(typedResult[0]?.count || '0')
          });
        } catch (error) {
          status.push({
            table,
            exists: false,
            error: error instanceof Error ? error.message : 'Table does not exist'
          });
        }
      }

      // Get current active sessions
      let activeSessions: Array<{
        id: string;
        phase: string;
        created_at: string;
        is_active: boolean;
      }> = [];
      try {
        activeSessions = await sql`
          SELECT id, phase, created_at, is_active
          FROM voting_sessions
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT 5
        ` as Array<{
          id: string;
          phase: string;
          created_at: string;
          is_active: boolean;
        }>;
      } catch (error) {
        console.log('Could not fetch active sessions:', error);
      }

      // Get total vote count
      let totalVotes = 0;
      try {
        const voteCount = await sql`SELECT COUNT(*) as count FROM votes` as Array<{count: string}>;
        totalVotes = parseInt(voteCount[0]?.count || '0');
      } catch (error) {
        console.log('Could not fetch vote count:', error);
      }

      const allTablesExist = status.every(s => s.exists);

      return NextResponse.json({
        success: true,
        systemReady: allTablesExist,
        tables: status,
        activeSessions,
        totalVotes,
        summary: {
          tablesCreated: status.filter(s => s.exists).length,
          totalTables: tables.length,
          activeSessionsCount: activeSessions.length,
          totalVotesCount: totalVotes
        }
      });
    });

  } catch (error) {
    console.error('Error checking voting system status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check voting system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
