// Production database setup for Vercel deployment
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

// Load environment variables from .env.production file
const envFile = readFileSync('.env.production', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && key.trim() && !key.trim().startsWith('#')) {
    const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
    envVars[key.trim()] = value.trim();
  }
});

// Set environment variables
Object.assign(process.env, envVars);

async function setupProductionDatabase() {
  console.log('🚀 Setting up production database for Vercel...');
  
  // Use environment variables (set in Vercel dashboard)
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required for production setup');
    console.log('Please set this in your Vercel project environment variables');
    process.exit(1);
  }
  
  const sql = neon(databaseUrl);
  console.log('🔗 Connected to production Neon database');
  
  try {
    // Create extension
    console.log('📦 Creating UUID extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // Create admin_users table
    console.log('👤 Creating admin_users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        permissions JSONB DEFAULT '{"teams": true, "config": true, "monitor": true}',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create teams table
    console.log('🏆 Creating teams table...');
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_name VARCHAR(255) UNIQUE NOT NULL,
        team_code VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        current_round INTEGER DEFAULT 1,
        total_score INTEGER DEFAULT 0,
        quiz_score INTEGER DEFAULT 0,
        voting_score INTEGER DEFAULT 0,
        offline_score INTEGER DEFAULT 0,
        is_disqualified BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'active',
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create quiz tables
    console.log('❓ Creating quiz_questions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question TEXT NOT NULL,
        question_type VARCHAR(50) DEFAULT 'mcq',
        category VARCHAR(255) DEFAULT 'General',
        explanation TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('📝 Creating quiz_options table...');
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_options (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        is_correct BOOLEAN DEFAULT FALSE,
        option_order INTEGER DEFAULT 1,
        category VARCHAR(255) DEFAULT 'General',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create voting tables
    console.log('🗳️ Creating voting_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS voting_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        round_id VARCHAR(100) NOT NULL,
        current_presenting_team UUID,
        phase VARCHAR(50) DEFAULT 'waiting',
        phase_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        phase_end_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        pitch_duration INTEGER DEFAULT 90,
        voting_duration INTEGER DEFAULT 30,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('🗳️ Creating voting_teams table...');
    await sql`
      CREATE TABLE IF NOT EXISTS voting_teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        presentation_order INTEGER DEFAULT 1,
        voting_score INTEGER DEFAULT 0,
        downvotes_used INTEGER DEFAULT 0,
        has_presented BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, team_id)
      )
    `;
    
    console.log('🗳️ Creating team_votes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS team_votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        from_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        to_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
        vote_type VARCHAR(20) NOT NULL,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(from_team_id, to_team_id, session_id)
      )
    `;
    
    // Create admin sessions table
    console.log('🔐 Creating admin_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
        session_token VARCHAR(512) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create admin logs table
    console.log('📊 Creating admin_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create default admin user (only if it doesn't exist)
    console.log('🔐 Creating default admin user...');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@techpreneur3.com';
    
    await sql`
      INSERT INTO admin_users (username, email, password_hash, role, permissions) VALUES
      (${adminUsername}, ${adminEmail}, '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', 'super_admin', '{"all": true, "teams": true, "config": true, "users": true, "logs": true, "questions": true}')
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        is_active = true,
        updated_at = NOW()
    `;
    
    // Verify setup
    console.log('🔍 Verifying production database setup...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    // Check admin user
    const adminUsers = await sql`SELECT username, email, role FROM admin_users WHERE username = ${adminUsername}`;
    
    if (adminUsers.length > 0) {
      console.log(`✅ Admin user created: ${adminUsers[0].username} (${adminUsers[0].email})`);
      console.log(`🔑 Default admin credentials:`);
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: admin123`);
      console.log(`⚠️  Please change the default password after first login!`);
    }
    
    console.log('🎉 Production database setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Production database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup function
setupProductionDatabase().catch(console.error);

export { setupProductionDatabase };
