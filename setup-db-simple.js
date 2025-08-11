// Simple database setup for Neon
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Get current directory
const currentDir = process.cwd();

function loadEnvFile() {
  try {
    const envPath = path.join(currentDir, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...values] = trimmedLine.split('=');
          if (key && values.length > 0) {
            const value = values.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value.trim();
          }
        }
      });
      
      console.log('✅ Environment variables loaded from .env.local');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Could not load .env.local file:', error.message);
    return false;
  }
}

async function setupTables() {
  console.log('🚀 Setting up essential database tables...');
  
  // Load environment variables
  loadEnvFile();
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const sql = neon(process.env.DATABASE_URL);
  console.log('🔗 Connected to Neon database');
  
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
    
    // Create admin user (password: admin123)
    console.log('🔐 Creating default admin user...');
    await sql`
      INSERT INTO admin_users (username, email, password_hash, role, permissions) VALUES
      ('admin', 'admin@techpreneur3.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', 'super_admin', '{"all": true, "teams": true, "config": true, "users": true, "logs": true, "questions": true}')
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        is_active = true,
        updated_at = NOW()
    `;
    
    // Verify setup
    console.log('🔍 Verifying database setup...');
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
    const adminUsers = await sql`SELECT username, email, role FROM admin_users WHERE username = 'admin'`;
    
    if (adminUsers.length > 0) {
      console.log(`✅ Admin user created: ${adminUsers[0].username} (${adminUsers[0].email})`);
      console.log(`🔑 Default admin credentials:`);
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('🚀 You can now start the development server with: npm run dev');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupTables().catch(console.error);
