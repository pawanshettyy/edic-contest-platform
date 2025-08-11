// Check database table contents
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

async function checkDatabaseContents() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking database table contents...\n');
    
    // Check teams table
    console.log('👥 TEAMS TABLE:');
    const teams = await sql`SELECT * FROM teams ORDER BY created_at DESC LIMIT 10`;
    if (teams.length === 0) {
      console.log('   ❌ No teams found');
    } else {
      teams.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.team_name} (${team.team_code})`);
        console.log(`      ID: ${team.id}`);
        console.log(`      Status: ${team.status}`);
        console.log(`      Created: ${team.created_at}`);
        console.log('');
      });
    }
    
    // Check admin_users table
    console.log('\n👤 ADMIN USERS TABLE:');
    const adminUsers = await sql`SELECT username, email, role, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC`;
    if (adminUsers.length === 0) {
      console.log('   ❌ No admin users found');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.username} (${admin.email})`);
        console.log(`      Role: ${admin.role}`);
        console.log(`      Active: ${admin.is_active}`);
        console.log(`      Last Login: ${admin.last_login || 'Never'}`);
        console.log(`      Created: ${admin.created_at}`);
        console.log('');
      });
    }
    
    // Check admin_sessions table
    console.log('\n🔐 ADMIN SESSIONS TABLE:');
    const sessions = await sql`SELECT * FROM admin_sessions WHERE is_active = true ORDER BY created_at DESC LIMIT 5`;
    if (sessions.length === 0) {
      console.log('   ❌ No active admin sessions found');
    } else {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Session ID: ${session.id}`);
        console.log(`      Admin User ID: ${session.admin_user_id}`);
        console.log(`      Expires: ${session.expires_at}`);
        console.log(`      Created: ${session.created_at}`);
        console.log('');
      });
    }
    
    // Check quiz_questions table
    console.log('\n❓ QUIZ QUESTIONS TABLE:');
    const questions = await sql`SELECT * FROM quiz_questions ORDER BY created_at DESC LIMIT 5`;
    if (questions.length === 0) {
      console.log('   ❌ No quiz questions found');
    } else {
      console.log(`   ✅ Found ${questions.length} questions`);
    }
    
    // Check voting_sessions table
    console.log('\n🗳️ VOTING SESSIONS TABLE:');
    const votingSessions = await sql`SELECT * FROM voting_sessions ORDER BY created_at DESC LIMIT 5`;
    if (votingSessions.length === 0) {
      console.log('   ❌ No voting sessions found');
    } else {
      console.log(`   ✅ Found ${votingSessions.length} voting sessions`);
    }
    
    // Check admin_logs for recent errors
    console.log('\n📊 RECENT ADMIN LOGS (Last 10):');
    const logs = await sql`SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT 10`;
    if (logs.length === 0) {
      console.log('   ❌ No admin logs found');
    } else {
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - ${log.timestamp}`);
        if (log.details) {
          console.log(`      Details: ${JSON.stringify(log.details)}`);
        }
      });
    }
    
  } catch (error) {
    console.error('💥 Failed to check database contents:', error.message);
    console.error('Full error:', error);
  }
}

checkDatabaseContents();
