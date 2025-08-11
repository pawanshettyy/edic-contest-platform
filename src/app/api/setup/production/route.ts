import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '../../../../lib/database';
import bcrypt from 'bcryptjs';

/**
 * Production Database Setup API Endpoint
 * Call this endpoint after deployment to initialize production database
 * POST /api/setup/production
 */
export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in production setup phase
    const authHeader = request.headers.get('authorization');
    const setupKey = process.env.SETUP_AUTH_KEY;
    
    if (!setupKey || authHeader !== `Bearer ${setupKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Set SETUP_AUTH_KEY environment variable.' },
        { status: 401 }
      );
    }

    const sql = getSql();
    
    console.log('🚀 Starting production database setup...');

    // 1. Check if admin users already exist
    const existingAdmins = await sql`
      SELECT COUNT(*) as count FROM admin_users
    ` as unknown[];
    
    if ((existingAdmins[0] as { count: number })?.count > 0) {
      return NextResponse.json({
        message: 'Production database already initialized',
        adminCount: (existingAdmins[0] as { count: number }).count
      });
    }

    // 2. Create admin users
    const adminUsers = [
      {
        username: 'admin',
        email: 'admin@edic.platform',
        password: 'Admin@123'
      },
      {
        username: 'superadmin',
        email: 'superadmin@edic.platform', 
        password: 'SuperAdmin@456'
      }
    ];

    const createdAdmins = [];
    
    for (const admin of adminUsers) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      
      const newAdmin = await sql`
        INSERT INTO admin_users (username, email, password_hash, role, permissions)
        VALUES (
          ${admin.username},
          ${admin.email},
          ${hashedPassword},
          'admin',
          ${'{"teams": true, "config": true, "monitor": true, "questions": true}'}
        )
        RETURNING id, username, email, role
      ` as unknown[];
      
      const adminData = newAdmin[0] as { id: string; username: string; email: string; role: string };
      createdAdmins.push({
        id: adminData?.id,
        username: adminData?.username,
        email: adminData?.email,
        role: adminData?.role
      });
    }

    // 3. Initialize contest configuration
    await sql`
      INSERT INTO contest_config (
        contest_name,
        contest_description, 
        max_teams,
        team_size,
        registration_open,
        contest_active,
        quiz_duration,
        questions_per_quiz,
        voting_enabled,
        config_data
      ) VALUES (
        'EDIC Contest Platform',
        'Innovation Challenge Platform for Entrepreneurs',
        50,
        5,
        true,
        false,
        30,
        15,
        true,
        ${'{"environment": "production", "setupDate": "' + new Date().toISOString() + '"}'}
      )
      ON CONFLICT DO NOTHING
    `;

    // 4. Create sample team (optional)
    const sampleTeamPassword = await bcrypt.hash('SampleTeam@123', 12);
    
    await sql`
      INSERT INTO teams (
        team_name,
        team_code,
        password_hash,
        leader_name,
        leader_email,
        members,
        status
      ) VALUES (
        'Sample Team',
        'SAMPLE001',
        ${sampleTeamPassword},
        'Sample Leader',
        'sample@example.com',
        ${'[{"name": "Sample Member 1", "email": "member1@example.com"}, {"name": "Sample Member 2", "email": "member2@example.com"}]'},
        'active'
      )
      ON CONFLICT (team_code) DO NOTHING
    `;

    console.log('✅ Production database setup completed');

    return NextResponse.json({
      success: true,
      message: 'Production database initialized successfully',
      data: {
        adminUsers: createdAdmins,
        timestamp: new Date().toISOString(),
        environment: 'production'
      }
    });

  } catch (error) {
    console.error('❌ Production setup failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Database setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
