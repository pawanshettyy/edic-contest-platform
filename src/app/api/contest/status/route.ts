import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

export async function GET() {
  try {
    const sql = getSql();
    
    // Get current contest state
    const configResult = await sql`
      SELECT 
        contest_active,
        quiz_active,
        voting_active,
        quiz_time_limit_minutes
      FROM contest_config 
      LIMIT 1
    `;

    if (!configResult || (configResult as unknown[]).length === 0) {
      return NextResponse.json({
        success: true,
        contestActive: false,
        quizActive: false,
        votingActive: false,
        quizTimeLimit: 30,
        message: 'Contest not configured'
      });
    }

    const config = (configResult as unknown[])[0] as {
      contest_active: boolean;
      quiz_active: boolean;
      voting_active: boolean;
      quiz_time_limit_minutes: number;
    };

    // Check if quiz was just disabled (for the 1-minute warning)
    const recentQuizDisable = await sql`
      SELECT updated_at 
      FROM contest_config 
      WHERE quiz_active = false 
        AND updated_at > NOW() - INTERVAL '2 minutes'
      LIMIT 1
    `;

    const quizDisabledRecently = (recentQuizDisable as unknown[]).length > 0;
    const timeToAutoSubmit = quizDisabledRecently ? 
      Math.max(0, 60 - Math.floor((Date.now() - new Date((recentQuizDisable as {updated_at: string}[])[0]?.updated_at || 0).getTime()) / 1000)) : 
      null;

    return NextResponse.json({
      success: true,
      contestActive: config.contest_active,
      quizActive: config.quiz_active,
      votingActive: config.voting_active,
      quizTimeLimit: config.quiz_time_limit_minutes,
      quizAutoSubmitIn: timeToAutoSubmit,
      message: timeToAutoSubmit ? `Quiz will auto-submit in ${timeToAutoSubmit} seconds` : null
    });

  } catch (error) {
    console.error('Error fetching live status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch status'
    }, { status: 500 });
  }
}
