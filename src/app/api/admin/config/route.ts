import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

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
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
  }
  
  // If no supabase client, allow fallback admin
  if (!supabase) {
    if (decoded.adminId === 'fallback-admin-id') {
      return decoded;
    }
    throw new Error('Database not configured');
  }
  
  const { data: sessions, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  
  if (error || !sessions || sessions.length === 0) {
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
    
    // If no supabase client, return mock config for development
    if (!supabase) {
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
    
    // Get contest configuration
    const { data: config, error: configError } = await supabase
      .from('contest_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (configError) {
      console.error('Config fetch error:', configError);
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
    
    // Get contest rounds
    const { data: rounds, error: roundsError } = await supabase
      .from('contest_rounds')
      .select('*')
      .order('round_number', { ascending: true });
    
    if (roundsError) {
      console.error('Rounds fetch error:', roundsError);
    }
    
    return NextResponse.json({
      config: config?.[0] || null,
      rounds: rounds || []
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
    
    const admin = await verifyAdminSession(token);
    const body = await request.json();
    
    // If no supabase client, return success for development mode
    if (!supabase) {
      return NextResponse.json({ 
        message: 'Configuration updated (development mode)',
        config: body
      });
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'update_config';
    
    if (action === 'update_config') {
      const validatedData = configUpdateSchema.parse(body);
      
      // Update or create contest configuration
      const { data, error } = await supabase
        .from('contest_config')
        .upsert({
          ...validatedData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.error('Config update error:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
      }
      
      // Log admin action
      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: admin.adminId,
          action: 'config_update',
          target_type: 'config',
          details: validatedData,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });
      
      return NextResponse.json({ message: 'Configuration updated successfully', data });
      
    } else if (action === 'update_round') {
      const validatedData = roundConfigSchema.parse(body);
      
      // Update or create contest round
      const { data, error } = await supabase
        .from('contest_rounds')
        .upsert({
          ...validatedData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'round_number'
        });
      
      if (error) {
        console.error('Round update error:', error);
        return NextResponse.json({ error: 'Failed to update round' }, { status: 500 });
      }
      
      // Log admin action
      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: admin.adminId,
          action: 'round_update',
          target_type: 'round',
          details: validatedData,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });
      
      return NextResponse.json({ message: 'Contest round updated successfully', data });
      
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
