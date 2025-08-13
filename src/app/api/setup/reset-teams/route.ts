import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
import { executeWithRetry } from '@/lib/database-retry';

export async function POST() {
  try {
    return await executeWithRetry(async () => {
      const sql = getSql();
      
      console.log('🗑️  Clearing existing teams...');
      
      // Clear existing teams
      await sql`DELETE FROM teams`;
      console.log('✅ Existing teams cleared');
      
      // Now call the teams setup API logic here
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/setup/teams`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to recreate teams');
      }
      
      const result = await response.json();
      
      return NextResponse.json({
        success: true,
        message: 'Teams reset and recreated successfully',
        ...result
      });
    });

  } catch (error) {
    console.error('❌ Reset teams failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
