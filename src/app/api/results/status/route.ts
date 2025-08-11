import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

export async function GET() {
  try {
    const sql = getSql();
    
    // Check contest configuration for results availability
    const config = await sql`
      SELECT 
        contest_active,
        quiz_active,
        voting_active,
        current_round,
        CASE 
          WHEN current_round >= 3 THEN true 
          ELSE false 
        END as results_available
      FROM contest_config 
      ORDER BY created_at DESC 
      LIMIT 1
    ` as unknown[];

    if (config.length === 0) {
      return NextResponse.json({
        success: true,
        resultsAvailable: false,
        message: 'Contest not configured yet'
      });
    }

    const contestConfig = config[0] as {
      contest_active: boolean;
      quiz_active: boolean;
      voting_active: boolean;
      current_round: number;
      results_available: boolean;
    };

    return NextResponse.json({
      success: true,
      resultsAvailable: contestConfig.results_available,
      contestActive: contestConfig.contest_active,
      currentRound: contestConfig.current_round,
      message: contestConfig.results_available 
        ? 'Results are available' 
        : 'Results will be available after all rounds are completed'
    });

  } catch (error) {
    console.error('Error checking results status:', error);
    return NextResponse.json({
      success: true,
      resultsAvailable: false,
      message: 'Results not yet available'
    });
  }
}
