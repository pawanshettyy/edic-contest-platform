import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/database';

export async function GET() {
  try {
    const dbHealthy = await healthCheck();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        api: 'healthy',
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
    };

    const status = dbHealthy ? 200 : 503;

    return NextResponse.json(health, { status });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        services: {
          database: 'unhealthy',
          api: 'unhealthy',
        },
      },
      { status: 503 }
    );
  }
}
