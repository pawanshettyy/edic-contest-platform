// Check for duplicate admin users
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

async function checkDuplicateAdmins() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const users = await sql`SELECT id, username, email, created_at, updated_at FROM admin_users ORDER BY created_at`;
    
    console.log(`Found ${users.length} admin user(s):`);
    users.forEach((u, index) => {
      console.log(`${index + 1}. ID: ${u.id}`);
      console.log(`   Username: ${u.username}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Created: ${u.created_at}`);
      console.log(`   Updated: ${u.updated_at}`);
      console.log('');
    });
    
    if (users.length > 1) {
      console.log('⚠️  Multiple admin users detected! This might cause login issues.');
      console.log('💡 Recommendation: Keep only one admin user.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDuplicateAdmins();
