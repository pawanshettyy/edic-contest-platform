"use server";

import { neon } from "@neondatabase/serverless";

// Server action to get data as suggested by Neon
export async function getData() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    // Get basic team data
    const teams = await sql`
      SELECT 
        id,
        team_name,
        quiz_score,
        voting_score,
        total_score,
        status,
        current_round
      FROM teams 
      ORDER BY total_score DESC 
      LIMIT 10
    `;
    
    return { success: true, data: teams };
  } catch (error) {
    console.error('Server action error:', error);
    return { success: false, error: 'Failed to fetch data' };
  }
}

// Server action to get team count
export async function getTeamCount() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM teams 
      WHERE status != 'disqualified'
    `;
    
    return { success: true, count: result[0]?.count || 0 };
  } catch (error) {
    console.error('Server action error:', error);
    return { success: false, error: 'Failed to get team count' };
  }
}

// Server action to test database connection
export async function testConnection() {
  if (!process.env.DATABASE_URL) {
    return { success: false, error: 'DATABASE_URL not configured' };
  }
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const result = await sql`SELECT 1 as test, NOW() as timestamp`;
    return { 
      success: true, 
      message: 'Database connection successful', 
      data: result[0] 
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
