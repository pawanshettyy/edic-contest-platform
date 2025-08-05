import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    console.log('🔍 Overview API - Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
    });
    
    if (!token) {
      console.log('❌ No admin token found');
      return NextResponse.json(
        { error: 'No admin session found' },
        { status: 401 }
      );
    }
    
    // Verify admin token
    let decoded: AdminTokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret-for-development'
      ) as AdminTokenPayload;
      console.log('✅ Token decoded successfully:', {
        adminId: decoded.adminId,
        username: decoded.username,
        sessionType: decoded.sessionType
      });
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (decoded.sessionType !== 'admin') {
      console.log('❌ Invalid session type:', decoded.sessionType);
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 401 }
      );
    }
    
    // Check session validity
    console.log('🔍 Checking session validity in database...');
    const { data: sessions, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .limit(1);
    
    console.log('📊 Session check result:', {
      sessionsFound: sessions?.length || 0,
      sessionError: sessionError?.message,
      currentTime: new Date().toISOString()
    });
    
    if (sessionError || !sessions || sessions.length === 0) {
      console.log('❌ Session validation failed');
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
    
    console.log('✅ Session valid, fetching overview data...');
    
    // Get basic statistics using Supabase
    const [
      { count: totalUsers },
      { count: totalTeams },
      { data: activeRounds }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('contest_rounds').select('*').eq('is_active', true)
    ]);
    
    // Log dashboard access
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: decoded.adminId,
        action: 'dashboard_access',
        details: { timestamp: new Date().toISOString() },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      });
    
    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalTeams: totalTeams || 0,
        activeRounds: activeRounds || [],
        recentSubmissions: 0,
        systemStatus: 'healthy',
        lastUpdated: new Date().toISOString()
      },
      topTeams: [],
      contestConfig: {},
      recentActivity: []
    });
    
  } catch (error) {
    console.error('Admin overview error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
