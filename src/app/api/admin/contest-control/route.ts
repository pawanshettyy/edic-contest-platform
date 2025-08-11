import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

// GET - Get current contest state
export async function GET() {
  try {
    const sql = getSql();
    
    const configResult = await sql`
      SELECT 
        contest_active,
        quiz_active,
        voting_active,
        quiz_time_limit_minutes,
        current_round
      FROM contest_config 
      LIMIT 1
    `;

    if (!configResult || (configResult as unknown[]).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Contest configuration not found'
      }, { status: 404 });
    }

    const config = (configResult as unknown[])[0] as {
      contest_active: boolean;
      quiz_active: boolean;
      voting_active: boolean;
      quiz_time_limit_minutes: number;
      current_round: number;
    };

    return NextResponse.json({
      success: true,
      contestActive: config.contest_active,
      quizActive: config.quiz_active,
      votingActive: config.voting_active,
      quizTimeLimit: config.quiz_time_limit_minutes,
      currentRound: config.current_round
    });

  } catch (error) {
    console.error('Error fetching contest state:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch contest state'
    }, { status: 500 });
  }
}

// POST - Update contest state (quiz/voting control)
export async function POST(request: NextRequest) {
  try {
    const { action, value } = await request.json();
    const sql = getSql();

    if (action === 'toggle_quiz') {
      if (value === true) {
        // Starting quiz - activate for everyone
        await sql`
          UPDATE contest_config 
          SET quiz_active = true, updated_at = NOW()
        `;

        // Broadcast to all active teams that quiz is starting
        // TODO: Implement WebSocket/SSE for real-time updates
        
        return NextResponse.json({
          success: true,
          message: 'Quiz activated for all teams',
          quizActive: true
        });
      } else {
        // Stopping quiz - give 1 minute warning then auto-submit
        await sql`
          UPDATE contest_config 
          SET quiz_active = false, updated_at = NOW()
        `;

        // Auto-submit all active quiz sessions after 1 minute
        setTimeout(async () => {
          try {
            const activeSessions = await sql`
              SELECT id, team_id, member_name 
              FROM quiz_sessions 
              WHERE is_active = true AND submitted_at IS NULL
            `;

            for (const session of activeSessions as { id: string; team_id: string; member_name: string }[]) {
              await sql`
                UPDATE quiz_sessions 
                SET submitted_at = NOW(), 
                    is_active = false, 
                    auto_submitted = true,
                    updated_at = NOW()
                WHERE id = ${session.id}
              `;
            }

            console.log(`Auto-submitted ${(activeSessions as unknown[]).length} quiz sessions`);
          } catch (error) {
            console.error('Error auto-submitting quiz sessions:', error);
          }
        }, 60000); // 1 minute delay

        return NextResponse.json({
          success: true,
          message: 'Quiz will be disabled in 1 minute. All progress will be auto-saved.',
          quizActive: false,
          autoSubmitIn: 60
        });
      }
    }

    if (action === 'toggle_voting') {
      await sql`
        UPDATE contest_config 
        SET voting_active = ${value}, updated_at = NOW()
      `;

      return NextResponse.json({
        success: true,
        message: value ? 'Voting started for all teams' : 'Voting stopped for all teams',
        votingActive: value
      });
    }

    if (action === 'set_quiz_time_limit') {
      const timeLimit = parseInt(value);
      if (isNaN(timeLimit) || timeLimit < 5 || timeLimit > 180) {
        return NextResponse.json({
          success: false,
          message: 'Time limit must be between 5 and 180 minutes'
        }, { status: 400 });
      }

      await sql`
        UPDATE contest_config 
        SET quiz_time_limit_minutes = ${timeLimit}, updated_at = NOW()
      `;

      return NextResponse.json({
        success: true,
        message: `Quiz time limit updated to ${timeLimit} minutes`,
        quizTimeLimit: timeLimit
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating contest state:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update contest state'
    }, { status: 500 });
  }
}
