import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

// GET - Get current contest state
export async function GET() {
  try {
    const sql = getSql();
    
    const configResult = await sql`
      SELECT 
        contest_active,
        current_round,
        CASE 
          WHEN current_round >= 3 THEN true 
          ELSE false 
        END as results_active
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
      current_round: number;
      results_active: boolean;
    };

    return NextResponse.json({
      success: true,
      contestActive: config.contest_active,
      quizActive: false, // Default for now
      votingActive: false, // Default for now
      resultsActive: config.results_active,
      quizTimeLimit: 30, // Default
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
      return NextResponse.json({
        success: true,
        message: value ? 'Quiz feature will be activated' : 'Quiz feature will be deactivated',
        quizActive: value
      });
    }

    if (action === 'toggle_voting') {
      return NextResponse.json({
        success: true,
        message: value ? 'Voting feature will be activated' : 'Voting feature will be deactivated',
        votingActive: value
      });
    }

    if (action === 'toggle_results') {
      await sql`
        UPDATE contest_config 
        SET current_round = ${value ? 3 : 2}, updated_at = NOW()
      `;

      return NextResponse.json({
        success: true,
        message: value ? 'Results published for all teams' : 'Results hidden from teams',
        resultsActive: value
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

      return NextResponse.json({
        success: true,
        message: `Quiz time limit will be set to ${timeLimit} minutes`,
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
