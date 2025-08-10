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
    const adminUsers = await sql`SELECT username, email, role, is_active, last_login, created_at, password_hash FROM admin_users ORDER BY created_at DESC`;
    if (adminUsers.length === 0) {
      console.log('   ❌ No admin users found');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.username} (${admin.email})`);
        console.log(`      Role: ${admin.role}`);
        console.log(`      Active: ${admin.is_active}`);
        console.log(`      Last Login: ${admin.last_login || 'Never'}`);
        console.log(`      Password Hash: ${admin.password_hash.substring(0, 20)}...`);
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
    
    // Check all table counts
    console.log('\n📊 TABLE COUNTS:');
    const teamCount = await sql`SELECT COUNT(*) as count FROM teams`;
    console.log(`   teams: ${teamCount[0].count} records`);
    
    const adminCount = await sql`SELECT COUNT(*) as count FROM admin_users`;
    console.log(`   admin_users: ${adminCount[0].count} records`);
    
    const sessionCount = await sql`SELECT COUNT(*) as count FROM admin_sessions`;
    console.log(`   admin_sessions: ${sessionCount[0].count} records`);
    
    const questionCount = await sql`SELECT COUNT(*) as count FROM quiz_questions`;
    console.log(`   quiz_questions: ${questionCount[0].count} records`);
    
    const optionCount = await sql`SELECT COUNT(*) as count FROM quiz_options`;
    console.log(`   quiz_options: ${optionCount[0].count} records`);
    
    const votingSessionCount = await sql`SELECT COUNT(*) as count FROM voting_sessions`;
    console.log(`   voting_sessions: ${votingSessionCount[0].count} records`);
    
    const votingTeamCount = await sql`SELECT COUNT(*) as count FROM voting_teams`;
    console.log(`   voting_teams: ${votingTeamCount[0].count} records`);
    
    const teamVoteCount = await sql`SELECT COUNT(*) as count FROM team_votes`;
    console.log(`   team_votes: ${teamVoteCount[0].count} records`);
    
    const logCount = await sql`SELECT COUNT(*) as count FROM admin_logs`;
    console.log(`   admin_logs: ${logCount[0].count} records`);
    
    // Test basic database functions
    console.log('\n🧪 TESTING DATABASE FUNCTIONS:');
    
    // Test bcrypt verification with the known admin password
    console.log('   Testing password verification...');
    const testAdmin = await sql`SELECT password_hash FROM admin_users WHERE username = 'admin' LIMIT 1`;
    if (testAdmin.length > 0) {
      // Import bcrypt to test password verification
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare('admin123', testAdmin[0].password_hash);
      console.log(`   Password 'admin123' verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
  } catch (error) {
    console.error('💥 Failed to check database contents:', error.message);
    console.error('Full error:', error);
  }
}

checkDatabaseContents();