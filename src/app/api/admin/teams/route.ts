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
const teamUpdateSchema = z.object({
  teamId: z.string().uuid(),
  action: z.enum(['update_score', 'add_penalty', 'reset_progress', 'disqualify']),
  value: z.number().optional(),
  reason: z.string().optional()
});

async function verifyAdminSession(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
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
    
    // Get teams with their progress and scores
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        team_code,
        current_round,
        total_score,
        is_disqualified,
        last_activity,
        created_at,
        team_members (
          id,
          users (username, email)
        )
      `)
      .order('total_score', { ascending: false });
    
    if (teamsError) {
      console.error('Teams fetch error:', teamsError);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
    
    // Get team progress for each team
    const teamsWithProgress = await Promise.all(
      (teams || []).map(async (team) => {
        const { data: progress } = await supabase
          .from('team_progress')
          .select('*')
          .eq('team_id', team.id);
        
        const { data: penalties } = await supabase
          .from('team_penalties')
          .select('*')
          .eq('team_id', team.id);
        
        const { data: submissions } = await supabase
          .from('team_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', team.id);
        
        return {
          ...team,
          progress: progress || [],
          penalties: penalties || [],
          submissionCount: submissions?.length || 0,
          members: team.team_members?.map((member: any) => ({
            id: member.id,
            username: member.users?.username,
            email: member.users?.email
          })) || []
        };
      })
    );
    
    return NextResponse.json({
      teams: teamsWithProgress,
      totalTeams: teams?.length || 0
    });
    
  } catch (error) {
    console.error('Admin teams GET error:', error);
    
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
    const validatedData = teamUpdateSchema.parse(body);
    
    const { teamId, action, value, reason } = validatedData;
    
    switch (action) {
      case 'update_score':
        if (typeof value !== 'number') {
          return NextResponse.json({ error: 'Score value required' }, { status: 400 });
        }
        
        await supabase
          .from('teams')
          .update({ 
            total_score: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamId);
        
        break;
        
      case 'add_penalty':
        if (typeof value !== 'number') {
          return NextResponse.json({ error: 'Penalty value required' }, { status: 400 });
        }
        
        await supabase
          .from('team_penalties')
          .insert({
            team_id: teamId,
            penalty_points: value,
            reason: reason || 'Admin penalty',
            applied_by: admin.adminId,
            applied_at: new Date().toISOString()
          });
        
        // Update team total score
        const { data: currentTeam } = await supabase
          .from('teams')
          .select('total_score')
          .eq('id', teamId)
          .single();
        
        if (currentTeam) {
          await supabase
            .from('teams')
            .update({ 
              total_score: Math.max(0, currentTeam.total_score - value),
              updated_at: new Date().toISOString()
            })
            .eq('id', teamId);
        }
        
        break;
        
      case 'reset_progress':
        await supabase
          .from('team_progress')
          .delete()
          .eq('team_id', teamId);
        
        await supabase
          .from('teams')
          .update({ 
            current_round: 1,
            total_score: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamId);
        
        break;
        
      case 'disqualify':
        await supabase
          .from('teams')
          .update({ 
            is_disqualified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamId);
        
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: admin.adminId,
        action: `team_${action}`,
        target_type: 'team',
        target_id: teamId,
        details: { action, value, reason },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });
    
    return NextResponse.json({ 
      message: `Team ${action} completed successfully` 
    });
    
  } catch (error) {
    console.error('Admin teams POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}