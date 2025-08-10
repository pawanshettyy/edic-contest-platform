#!/usr/bin/env node

/**
 * Production Database Setup Script
 * 
 * This script sets up the complete database schema and initial data
 * for the EDIC Contest Platform in production environment.
 * 
 * Usage:
 *   node scripts/setup-database.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - JWT_SECRET: Secret for JWT token generation
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.production' });

const sql = neon(process.env.DATABASE_URL);

console.log('🚀 Starting EDIC Contest Platform Database Setup...\n');

async function createSchema() {
  console.log('📋 Creating database schema...');
  
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  // Teams table with all required columns
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_name VARCHAR(255) UNIQUE NOT NULL,
      team_code VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      leader_name VARCHAR(255) NOT NULL,
      leader_email VARCHAR(255) NOT NULL,
      members JSONB DEFAULT '[]',
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

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Admin users table
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

  // Quiz questions table
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question TEXT NOT NULL,
      question_type VARCHAR(50) DEFAULT 'mcq',
      difficulty VARCHAR(50) DEFAULT 'medium',
      category VARCHAR(255) DEFAULT 'General',
      time_limit INTEGER DEFAULT 45,
      explanation TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Quiz options table
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      is_correct BOOLEAN DEFAULT FALSE,
      option_order INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Contest configuration table
  await sql`
    CREATE TABLE IF NOT EXISTS contest_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      contest_name VARCHAR(255) NOT NULL DEFAULT 'EDIC Contest Platform',
      contest_description TEXT DEFAULT 'Innovation Challenge Platform',
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      registration_deadline TIMESTAMP WITH TIME ZONE,
      max_teams INTEGER DEFAULT 50,
      team_size INTEGER DEFAULT 5,
      registration_open BOOLEAN DEFAULT TRUE,
      contest_active BOOLEAN DEFAULT FALSE,
      current_round INTEGER DEFAULT 1,
      quiz_duration INTEGER DEFAULT 30,
      questions_per_quiz INTEGER DEFAULT 15,
      quiz_time_per_question INTEGER DEFAULT 45,
      voting_enabled BOOLEAN DEFAULT TRUE,
      voting_duration INTEGER DEFAULT 120,
      config_data JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  console.log('✅ Database schema created successfully');
}

async function createIndexes() {
  console.log('🔍 Creating database indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name)',
    'CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status)',
    'CREATE INDEX IF NOT EXISTS idx_teams_total_score ON teams(total_score DESC)',
    'CREATE INDEX IF NOT EXISTS idx_teams_leader_email ON teams(leader_email)',
    'CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)',
    'CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)',
    'CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category)',
    'CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_active ON quiz_questions(is_active)',
  ];

  for (const indexSQL of indexes) {
    await sql([indexSQL]);
  }

  console.log('✅ Database indexes created successfully');
}

async function createAdminUsers() {
  console.log('👥 Creating admin users...');
  
  const adminUsers = [
    {
      username: 'superadmin',
      email: 'superadmin@edic.platform',
      password: 'SuperAdmin@2025',
      role: 'super_admin'
    },
    {
      username: 'admin_contest',
      email: 'contest@edic.platform',
      password: 'ContestAdmin@2025',
      role: 'contest_admin'
    },
    {
      username: 'admin_tech',
      email: 'tech@edic.platform',
      password: 'TechAdmin@2025',
      role: 'tech_admin'
    }
  ];

  for (const admin of adminUsers) {
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    
    await sql`
      INSERT INTO admin_users (username, email, password_hash, role, permissions, is_active)
      VALUES (
        ${admin.username},
        ${admin.email},
        ${hashedPassword},
        ${admin.role},
        '{"all": true, "teams": true, "config": true, "monitor": true, "questions": true}',
        true
      )
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        is_active = true,
        updated_at = NOW()
    `;
    
    console.log(`   ✅ Created admin: ${admin.username} (${admin.role})`);
  }
}

async function createDefaultConfig() {
  console.log('⚙️ Creating default configuration...');
  
  await sql`
    INSERT INTO contest_config (
      contest_name,
      contest_description,
      start_date,
      end_date,
      registration_deadline,
      max_teams,
      team_size,
      registration_open,
      contest_active
    ) VALUES (
      'EDIC Contest Platform',
      'Innovation Challenge Platform for Entrepreneurs',
      NOW() + INTERVAL '1 day',
      NOW() + INTERVAL '7 days',
      NOW() + INTERVAL '12 hours',
      50,
      5,
      true,
      false
    )
    ON CONFLICT DO NOTHING
  `;
  
  console.log('✅ Default configuration created');
}

async function addSampleQuestions() {
  console.log('❓ Adding sample quiz questions...');
  
  // Insert sample question
  const questionResult = await sql`
    INSERT INTO quiz_questions (
      question,
      question_type,
      difficulty,
      category,
      time_limit,
      explanation,
      is_active
    ) VALUES (
      'What is the primary goal of entrepreneurship?',
      'mcq',
      'easy',
      'Entrepreneurship',
      45,
      'Entrepreneurship focuses on creating value and solving real-world problems.',
      true
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  
  if (questionResult.length > 0) {
    const questionId = questionResult[0].id;
    
    // Insert options for the question
    const options = [
      { text: 'To make maximum profit', points: -2, correct: false, order: 1 },
      { text: 'To create value and solve problems', points: 10, correct: true, order: 2 },
      { text: 'To become famous', points: -2, correct: false, order: 3 },
      { text: 'To work independently', points: 3, correct: false, order: 4 }
    ];
    
    for (const option of options) {
      await sql`
        INSERT INTO quiz_options (question_id, option_text, points, is_correct, option_order)
        VALUES (${questionId}, ${option.text}, ${option.points}, ${option.correct}, ${option.order})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  
  console.log('✅ Sample questions added');
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  const tables = ['teams', 'admin_users', 'quiz_questions', 'contest_config'];
  
  for (const table of tables) {
    const count = await sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = ${table}
    `;
    
    if (count[0].count > 0) {
      console.log(`   ✅ Table '${table}' exists`);
    } else {
      console.log(`   ❌ Table '${table}' missing`);
    }
  }
  
  // Check admin users
  const adminCount = await sql`SELECT COUNT(*) as count FROM admin_users WHERE is_active = true`;
  console.log(`   👥 Active admin users: ${adminCount[0].count}`);
  
  // Check configuration
  const configCount = await sql`SELECT COUNT(*) as count FROM contest_config`;
  console.log(`   ⚙️ Configuration entries: ${configCount[0].count}`);
}

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    await createSchema();
    await createIndexes();
    await createAdminUsers();
    await createDefaultConfig();
    await addSampleQuestions();
    await verifySetup();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   superadmin / SuperAdmin@2025');
    console.log('   admin_contest / ContestAdmin@2025');
    console.log('   admin_tech / TechAdmin@2025');
    console.log('\n🚀 Ready for production deployment!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

main();
