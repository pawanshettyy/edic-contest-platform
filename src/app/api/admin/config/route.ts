import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

// Validation schemas
const configUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional()
});

const roundConfigSchema = z.object({
  roundNumber: z.number().min(1),
  title: z.string().min(1),
  description: z.string(),
  isActive: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeLimit: z.number().optional()
});

async function verifyAdminSession(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
  }
  
  const sessions = await query(
    'SELECT * FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
    [token]
  );
  
  if (sessions.length === 0) {
    throw new Error('Session expired');
  }
  
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);
    
    // Get all configuration
    const [contestConfig, contestRounds] = await Promise.all([
      query<{
        key: string;
        value: string;
        description: string;
        is_active: boolean;
        updated_at: string;
      }>(`
        SELECT key, value, description, is_active, updated_at
        FROM contest_config
        ORDER BY key
      `),
      query(`
        SELECT round_number, title, description, is_active, 
               start_time, end_time, time_limit_minutes,
               created_at, updated_at
        FROM contest_rounds
        ORDER BY round_number
      `)
    ]);
    
    return NextResponse.json({
      config: contestConfig.reduce((acc: Record<string, unknown>, config) => ({
        ...acc,
        [config.key]: {
          value: config.value,
          description: config.description,
          isActive: config.is_active,
          updatedAt: config.updated_at
        }
      }), {}),
      rounds: contestRounds
    });
    
  } catch (error) {
    console.error('Admin config GET error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    const adminSession = await verifyAdminSession(token);
    const body = await request.json();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'update_config';
    
    if (action === 'update_config') {
      const validatedData = configUpdateSchema.parse(body);
      
      // Update or insert configuration
      await query(`
        INSERT INTO contest_config (key, value, description, updated_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key)
        DO UPDATE SET 
          value = EXCLUDED.value,
          description = COALESCE(EXCLUDED.description, contest_config.description),
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `, [validatedData.key, validatedData.value, validatedData.description || '', adminSession.adminId]);
      
      // Log the configuration change
      await query(
        `INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
         VALUES ($1, 'config_update', $2, $3)`,
        [
          adminSession.adminId,
          JSON.stringify({
            key: validatedData.key,
            value: validatedData.value,
            description: validatedData.description
          }),
          request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
        ]
      );
      
      return NextResponse.json({
        message: 'Configuration updated successfully'
      });
      
    } else if (action === 'update_round') {
      const validatedData = roundConfigSchema.parse(body);
      
      // Update or insert contest round
      await query(`
        INSERT INTO contest_rounds (
          round_number, title, description, is_active, 
          start_time, end_time, time_limit_minutes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (round_number)
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          time_limit_minutes = EXCLUDED.time_limit_minutes,
          updated_at = NOW()
      `, [
        validatedData.roundNumber,
        validatedData.title,
        validatedData.description,
        validatedData.isActive,
        validatedData.startTime || null,
        validatedData.endTime || null,
        validatedData.timeLimit || null
      ]);
      
      // Log the round update
      await query(
        `INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
         VALUES ($1, 'round_update', $2, $3)`,
        [
          adminSession.adminId,
          JSON.stringify(validatedData),
          request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
        ]
      );
      
      return NextResponse.json({
        message: 'Contest round updated successfully'
      });
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Admin config POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
