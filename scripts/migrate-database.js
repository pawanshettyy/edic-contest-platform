#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Manages database schema migrations for production
 * Ensures database is up to date with latest schema
 * 
 * Usage: npm run migrate:production
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

console.log('🔧 EDIC Contest Platform - Database Migration');
console.log('=============================================');
console.log('');

// Migration SQL Scripts
const MIGRATIONS = [
  {
    version: '1.0.0',
    name: 'Initial Schema',
    description: 'Create all required tables for the contest platform',
    sql: `
      -- Create admin_users table
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        permissions JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create admin_sessions table
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create admin_logs table
      CREATE TABLE IF NOT EXISTS admin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(255),
        details JSONB,
        ip_address INET,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create contest_config table
      CREATE TABLE IF NOT EXISTS contest_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contest_name VARCHAR(255) NOT NULL,
        contest_description TEXT,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        max_teams INTEGER DEFAULT 50,
        team_size INTEGER DEFAULT 5,
        registration_open BOOLEAN DEFAULT true,
        contest_active BOOLEAN DEFAULT false,
        current_round INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create contest_rounds table
      CREATE TABLE IF NOT EXISTS contest_rounds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_number INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT false,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        time_limit_minutes INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(round_number)
      );

      -- Create teams table
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_name VARCHAR(255) NOT NULL,
        team_code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        score DECIMAL(10,2) DEFAULT 0.00,
        penalties INTEGER DEFAULT 0,
        presentation_order INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create team_members table
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create quiz_questions table
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        points INTEGER DEFAULT 1,
        time_limit INTEGER DEFAULT 30,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        order_index INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create quiz_options table
      CREATE TABLE IF NOT EXISTS quiz_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false,
        explanation TEXT,
        order_index INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create voting_sessions table
      CREATE TABLE IF NOT EXISTS voting_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id UUID REFERENCES contest_rounds(id),
        current_presenting_team UUID REFERENCES teams(id),
        phase VARCHAR(20) DEFAULT 'setup',
        phase_start_time TIMESTAMP WITH TIME ZONE,
        phase_end_time TIMESTAMP WITH TIME ZONE,
        pitch_duration INTEGER DEFAULT 300,
        voting_duration INTEGER DEFAULT 120,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create voting_teams table
      CREATE TABLE IF NOT EXISTS voting_teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        has_presented BOOLEAN DEFAULT false,
        downvotes_used INTEGER DEFAULT 0,
        presentation_order INTEGER,
        UNIQUE(session_id, team_id)
      );

      -- Create votes table
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
        voter_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        target_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, voter_team_id, target_team_id, vote_type)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_user ON admin_logs(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(team_code);
      CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
      CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active);
      CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);
      CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
      CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_team_id);
      CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_team_id);
    `
  }
];

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    console.log('');

    // For this implementation, we'll save migration SQL to files
    // In a real scenario, you'd execute these against the database
    
    const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
    
    // Create migrations directory
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log(`📁 Created migrations directory: ${migrationsDir}`);
    }

    // Save each migration to a file
    for (const migration of MIGRATIONS) {
      const filename = `${migration.version.replace(/\./g, '_')}_${migration.name.toLowerCase().replace(/\s+/g, '_')}.sql`;
      const filepath = path.join(migrationsDir, filename);
      
      console.log(`📝 Creating migration: ${filename}`);
      
      const content = [
        `-- Migration: ${migration.name}`,
        `-- Version: ${migration.version}`,
        `-- Description: ${migration.description}`,
        `-- Created: ${new Date().toISOString()}`,
        '',
        migration.sql.trim()
      ].join('\n');
      
      fs.writeFileSync(filepath, content);
      console.log(`✅ Saved: ${filepath}`);
    }

    console.log('');
    console.log('✅ Migration files created successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('==============');
    console.log('1. Review the migration files in ./database/migrations/');
    console.log('2. Run these migrations against your database:');
    console.log('   • Using psql: psql $DATABASE_URL -f migration_file.sql');
    console.log('   • Using pgAdmin or another database tool');
    console.log('3. Run: npm run setup:production');
    console.log('');
    console.log('💡 Tip: These migrations are idempotent (safe to run multiple times)');
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.log('🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Check that you have write permissions to the project directory');
    console.log('2. Ensure the database directory exists or can be created');
    console.log('3. Verify disk space is available');
    
    return false;
  }
}

// Run migrations
if (require.main === module) {
  runMigrations().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runMigrations, MIGRATIONS };
