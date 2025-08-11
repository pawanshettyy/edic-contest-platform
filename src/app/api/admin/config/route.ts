import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getSql, isDatabaseConnected } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

// Validation schemas
const configUpdateSchema = z.object({
  contest_name: z.string().optional(),
  contest_description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_teams: z.number().optional(),
  team_size: z.number().optional(),
  registration_open: z.boolean().optional(),
  contest_active: z.boolean().optional(),
  current_round: z.number().optional()
});

const roundConfigSchema = z.object({
  round_number: z.number().min(1),
  title: z.string().min(1),
  description: z.string(),
  is_active: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  time_limit_minutes: z.number().optional()
});

async function verifyAdminSession(token: string) {
  const sql = getSql();
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
  }
  
  // If database not available, allow fallback admin
  if (!isDatabaseConnected()) {
    if (decoded.adminId === 'fallback-admin-id') {
      return decoded;
    }
    throw new Error('Database not configured');
  }
  
  try {
    const sessions = await sql`
      SELECT * FROM admin_sessions 
      WHERE admin_user_id = ${decoded.adminId} AND is_active = true
    ` as unknown[];
    
    if (!sessions || sessions.length === 0) {
      throw new Error('No active admin session found');
    }
    
    return decoded;
  } catch (error) {
    // If admin_sessions table doesn't exist, allow fallback
    if (decoded.adminId === 'fallback-admin-id') {
      return decoded;
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const sql = getSql();
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);
    
    // If no database connection, return mock config for development
    if (!isDatabaseConnected()) {
      return NextResponse.json({
        config: {
          id: 'mock-config',
          contest_name: 'EDIC Business Challenge',
          contest_description: 'Innovation Challenge for emerging entrepreneurs',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_teams: 50,
          team_size: 5,
          registration_open: true,
          contest_active: false,
          current_round: 1
        },
        rounds: [
          { id: '1', round_number: 1, title: 'Quiz Round', description: 'MCQ Quiz', is_active: false },
          { id: '2', round_number: 2, title: 'Voting Round', description: 'Team Voting', is_active: false },
          { id: '3', round_number: 3, title: 'Final Round', description: 'Final Presentations', is_active: false }
        ]
      });
    }
    
    try {
      // Get contest configuration
      const config = await sql`
        SELECT * FROM contest_config ORDER BY created_at DESC LIMIT 1
      ` as unknown[];
      
      // Get contest rounds
      const rounds = await sql`
        SELECT * FROM contest_rounds ORDER BY round_number ASC
      ` as unknown[];
      
      return NextResponse.json({
        config: config?.[0] || null,
        rounds: rounds || []
      });
      
    } catch (dbError) {
      console.error('Database error in admin config:', dbError);
      
      // Return mock data if database error
      return NextResponse.json({
        config: {
          id: 'fallback-config',
          contest_name: 'EDIC Business Challenge',
          contest_description: 'Database connection issue - showing fallback data',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_teams: 50,
          team_size: 5,
          registration_open: true,
          contest_active: false,
          current_round: 1
        },
        rounds: []
      });
    }
    
  } catch (error) {
    console.error('Admin config GET error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sql = getSql();
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    const admin = await verifyAdminSession(token);
    const body = await request.json();
    
    // If no database connection, return success for development mode
    if (!isDatabaseConnected()) {
      return NextResponse.json({ 
        message: 'Configuration updated (development mode)',
        config: body
      });
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'update_config';
    
    try {
      if (action === 'update_config') {
        const validatedData = configUpdateSchema.parse(body);
        
        // Try to update existing config first
        const existingConfig = await sql`
          SELECT id FROM contest_config ORDER BY created_at DESC LIMIT 1
        ` as unknown[];
        
        let result;
        
        if (existingConfig && existingConfig.length > 0) {
          // Update existing config
          const configId = (existingConfig[0] as { id: string }).id;
          
          // Build update query with individual fields
          const updateFields = Object.keys(validatedData);
          
          if (updateFields.includes('contest_name')) {
            await sql`UPDATE contest_config SET contest_name = ${validatedData.contest_name} WHERE id = ${configId}`;
          }
          if (updateFields.includes('contest_description')) {
            await sql`UPDATE contest_config SET contest_description = ${validatedData.contest_description} WHERE id = ${configId}`;
          }
          if (updateFields.includes('start_date')) {
            await sql`UPDATE contest_config SET start_date = ${validatedData.start_date} WHERE id = ${configId}`;
          }
          if (updateFields.includes('end_date')) {
            await sql`UPDATE contest_config SET end_date = ${validatedData.end_date} WHERE id = ${configId}`;
          }
          if (updateFields.includes('max_teams')) {
            await sql`UPDATE contest_config SET max_teams = ${validatedData.max_teams} WHERE id = ${configId}`;
          }
          if (updateFields.includes('team_size')) {
            await sql`UPDATE contest_config SET team_size = ${validatedData.team_size} WHERE id = ${configId}`;
          }
          if (updateFields.includes('registration_open')) {
            await sql`UPDATE contest_config SET registration_open = ${validatedData.registration_open} WHERE id = ${configId}`;
          }
          if (updateFields.includes('contest_active')) {
            await sql`UPDATE contest_config SET contest_active = ${validatedData.contest_active} WHERE id = ${configId}`;
          }
          if (updateFields.includes('current_round')) {
            await sql`UPDATE contest_config SET current_round = ${validatedData.current_round} WHERE id = ${configId}`;
          }
          
          // Update timestamp and get result
          result = await sql`
            UPDATE contest_config SET updated_at = NOW() 
            WHERE id = ${configId} 
            RETURNING *
          ` as unknown[];
        } else {
          // Insert new config
          result = await sql`
            INSERT INTO contest_config (
              contest_name, contest_description, start_date, end_date, 
              max_teams, team_size, registration_open, contest_active, 
              current_round, created_at, updated_at
            ) VALUES (
              ${validatedData.contest_name || 'New Contest'}, 
              ${validatedData.contest_description || 'Contest description'}, 
              ${validatedData.start_date || new Date().toISOString()}, 
              ${validatedData.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}, 
              ${validatedData.max_teams || 50}, 
              ${validatedData.team_size || 5}, 
              ${validatedData.registration_open !== undefined ? validatedData.registration_open : true}, 
              ${validatedData.contest_active !== undefined ? validatedData.contest_active : false}, 
              ${validatedData.current_round || 1}, 
              NOW(), NOW()
            ) RETURNING *
          ` as unknown[];
        }
        
        // Log admin action
        try {
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address, timestamp) 
            VALUES (${admin.adminId}, ${'config_update'}, ${'config'}, ${JSON.stringify(validatedData)}, ${request.headers.get('x-forwarded-for') || 'unknown'}, NOW())
          `;
        } catch (logError) {
          console.warn('Could not log admin action:', logError);
        }
        
        return NextResponse.json({ 
          message: 'Configuration updated successfully', 
          data: result?.[0] || validatedData 
        });
        
      } else if (action === 'update_round') {
        const validatedData = roundConfigSchema.parse(body);
        
        // Try to update existing round first
        const existingRound = await sql`
          SELECT id FROM contest_rounds WHERE round_number = ${validatedData.round_number}
        ` as unknown[];
        
        let result;
        if (existingRound && existingRound.length > 0) {
          // Update existing round
          const updateFields = Object.keys(validatedData).filter(f => f !== 'round_number');
          const updateValues = updateFields.map(f => validatedData[f as keyof typeof validatedData]);
          const updatePairs = updateFields.map((field, index) => `${field} = ${updateValues[index]}`);
          const setClause = updatePairs.join(', ');
          
          result = await sql`
            UPDATE contest_rounds 
            SET ${sql.unsafe(setClause)}, updated_at = NOW() 
            WHERE round_number = ${validatedData.round_number} 
            RETURNING *
          ` as unknown[];
        } else {
          // Insert new round
          const insertFields = Object.keys(validatedData);
          const insertValues = Object.values(validatedData);
          const fieldsClause = insertFields.join(', ');
          const valuesPlaceholders = insertValues.map((value) => `${value}`).join(', ');
          
          result = await sql`
            INSERT INTO contest_rounds (${sql.unsafe(fieldsClause)}, created_at, updated_at) 
            VALUES (${sql.unsafe(valuesPlaceholders)}, NOW(), NOW()) 
            RETURNING *
          ` as unknown[];
        }
        
        // Log admin action
        try {
          await sql`
            INSERT INTO admin_logs (admin_user_id, action, target_type, details, ip_address, timestamp) 
            VALUES (${admin.adminId}, ${'round_update'}, ${'round'}, ${JSON.stringify(validatedData)}, ${request.headers.get('x-forwarded-for') || 'unknown'}, NOW())
          `;
        } catch (logError) {
          console.warn('Could not log admin action:', logError);
        }
        
        return NextResponse.json({ 
          message: 'Contest round updated successfully', 
          data: result?.[0] || validatedData 
        });
        
      } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      
    } catch (dbError) {
      console.error('Database error in admin config POST:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: action === 'update_config' ? 'Could not update configuration' : 'Could not update round'
      }, { status: 500 });
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
