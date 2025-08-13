import { NextResponse } from 'next/server';
import { getSql, healthCheck } from '@/lib/database';

export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test database connection
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      // Test a simple query to verify database is accessible
      const sql = getSql();
      await sql`SELECT 1`;
      
      return NextResponse.json({
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        databaseUrl: process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, '//***:***@') // Hide credentials
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.toString() : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
