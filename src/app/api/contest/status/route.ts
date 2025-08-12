import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

export async function GET() {
  try {
    const sql = getSql();
    
    // Get current contest state
    const configResult = await sql`
      SELECT 
        contest_active,
        current_phase,
        quiz_duration,
        voting_duration,
        updated_at
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
      current_phase: string;
      quiz_duration: number;
      voting_duration: number;
      updated_at: string;
    };

    // Determine quiz and voting status based on current phase
    const quizActive = config.contest_active && config.current_phase === 'quiz';
    const votingActive = config.contest_active && config.current_phase === 'voting';

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
      quizActive: quizActive,
      votingActive: votingActive,
      quizTimeLimit: config.quiz_duration,
      currentPhase: config.current_phase,
      votingDuration: config.voting_duration,
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
