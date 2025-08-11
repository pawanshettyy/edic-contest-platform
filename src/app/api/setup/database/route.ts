import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

async function setupDatabaseTables() {
  const sql = getSql();
  
  // Create all missing tables based on the schema
  console.log('🚀 Setting up database tables...');

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('✅ Users table created');

  // Admin sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
      session_token VARCHAR(500) NOT NULL,
      ip_address INET,
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('✅ Admin sessions table created');

  // Admin logs table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id UUID,
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('✅ Admin logs table created');

  // Contest config table
  await sql`
    CREATE TABLE IF NOT EXISTS contest_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contest_active BOOLEAN DEFAULT FALSE,
      current_phase VARCHAR(50) DEFAULT 'setup',
      start_time TIMESTAMP WITH TIME ZONE,
      end_time TIMESTAMP WITH TIME ZONE,
      quiz_duration INTEGER DEFAULT 30,
      voting_duration INTEGER DEFAULT 15,
      max_teams INTEGER DEFAULT 50,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('✅ Contest config table created');

  // Insert default contest config if none exists
  await sql`
    INSERT INTO contest_config (contest_active, current_phase, settings)
    SELECT FALSE, 'setup', '{}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM contest_config)
  `;
  console.log('✅ Default contest config inserted');

  // Quiz responses table
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      member_name VARCHAR(255) NOT NULL,
      question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
      selected_option_id UUID REFERENCES quiz_options(id) ON DELETE CASCADE,
      option_ids UUID[] DEFAULT '{}',
      is_correct BOOLEAN DEFAULT FALSE,
      points_earned INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('✅ Quiz responses table created');

  // Team members table
  await sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      is_leader BOOLEAN DEFAULT FALSE,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(team_id, user_id)
    )
  `;
  console.log('✅ Team members table created');

  // Check if teams table has enough data, create a test team if empty
  const teamCount = await sql`SELECT COUNT(*) as count FROM teams`;
  const teamCountValue = (teamCount as Array<{count: string}>)[0]?.count || '0';
  if (parseInt(teamCountValue) === 0) {
    await sql`
      INSERT INTO teams (team_name, team_code, password_hash, leader_name, leader_email, members)
      VALUES (
        'Test Team Alpha',
        'TEAM001',
        '$2b$10$example.hash.for.testing.purposes.only',
        'Test Leader',
        'test@example.com',
        '["Test Member 1", "Test Member 2", "Test Member 3"]'::jsonb
      )
    `;
    console.log('✅ Test team created');
  }

  return {
    success: true,
    message: 'Database setup completed successfully',
    tablesCreated: [
      'users',
      'admin_sessions', 
      'admin_logs',
      'contest_config',
      'quiz_responses',
      'team_members'
    ]
  };
}

export async function GET() {
  try {
    console.log('🔧 Database setup requested via GET');
    const result = await setupDatabaseTables();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Simple authorization check - in development mode only
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer dev-setup-key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await setupDatabaseTables();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
