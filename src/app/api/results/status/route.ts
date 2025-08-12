import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

export async function GET() {
  try {
    const sql = getSql();
    
    // Check contest configuration for results availability
    const config = await sql`
      SELECT 
        contest_active,
        current_phase,
        quiz_duration,
        voting_duration,
        CASE 
          WHEN current_phase = 'results' THEN true 
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
      current_phase: string;
      quiz_duration: number;
      voting_duration: number;
      results_available: boolean;
    };

    return NextResponse.json({
      success: true,
      resultsAvailable: contestConfig.results_available,
      contestActive: contestConfig.contest_active,
      currentPhase: contestConfig.current_phase,
      message: contestConfig.results_available 
        ? 'Results are available' 
        : 'Results will be available when contest enters results phase'
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
