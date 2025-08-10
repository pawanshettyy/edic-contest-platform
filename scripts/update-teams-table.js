// Update teams table structure for proper team registration
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

async function updateTeamsTable() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Updating teams table structure...');
    
    // Add missing columns to teams table
    console.log('📝 Adding leader_name column...');
    try {
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255)`;
    } catch (e) { console.log('   Column already exists or other error:', e.message); }
    
    console.log('📝 Adding leader_email column...');
    try {
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_email VARCHAR(255)`;
    } catch (e) { console.log('   Column already exists or other error:', e.message); }
    
    console.log('📝 Adding members column...');
    try {
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'`;
    } catch (e) { console.log('   Column already exists or other error:', e.message); }
    
    // Check the current table structure
    console.log('\n🔍 Current teams table structure:');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `;
    
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n✅ Teams table structure updated successfully!');
    
  } catch (error) {
    console.error('💥 Failed to update teams table:', error.message);
    console.error('Full error:', error);
  }
}

updateTeamsTable();
