#!/usr/bin/env node

/**
 * Development Database Setup Script
 * 
 * This script sets up the database for local development
 * with test data and simplified configuration.
 * 
 * Usage:
 *   node scripts/setup-development.js
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

console.log('🛠️ Setting up development database...\n');

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('👥 Creating development admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await sql`
      INSERT INTO admin_users (username, email, password_hash, role, permissions, is_active)
      VALUES (
        'admin',
        'admin@localhost',
        ${hashedPassword},
        'super_admin',
        '{"all": true, "teams": true, "config": true, "monitor": true, "questions": true}',
        true
      )
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        is_active = true,
        updated_at = NOW()
    `;
    
    console.log('✅ Development admin created: admin / admin123');
    console.log('🎉 Development setup completed!');
    
  } catch (error) {
    console.error('❌ Development setup failed:', error);
    process.exit(1);
  }
}

main();
