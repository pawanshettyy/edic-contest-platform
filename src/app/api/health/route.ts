import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Health check function using Neon's serverless driver
async function healthCheck() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const sql = neon(process.env.DATABASE_URL as string);
    const result = await sql`SELECT 1 as test, NOW() as timestamp`;
    return {
      healthy: result.length > 0,
      timestamp: result[0]?.timestamp,
      error: null
    };
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error);
    console.error('Database health check failed:', errorMessage);
    return {
      healthy: false,
      timestamp: null,
      error: errorMessage
    };
  }
}

export async function GET() {
  let dbHealth: { healthy: boolean; timestamp: string | null; error: string | null } = { healthy: false, timestamp: null, error: 'Unknown error' };
  
  try {
    dbHealth = await healthCheck();
  } catch (error) {
    console.error('Health check error:', error);
    dbHealth = {
      healthy: false,
      timestamp: null,
      error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
    };
  }
  
  const health = {
    status: dbHealth.healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth.healthy ? 'healthy' : 'unhealthy',
      api: 'healthy',
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    deployment: {
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.NEXT_PUBLIC_APP_URL || 'localhost'
    },
    details: {
      database: {
        connected: dbHealth.healthy,
        serverTime: dbHealth.timestamp,
        ...(dbHealth.error && { error: dbHealth.error })
      }
    }
  };

  const status = dbHealth.healthy ? 200 : 503;
  return NextResponse.json(health, { status });
}