import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
config({ path: '.env.local' });

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }
    
    console.log('📍 Using database:', connectionString.split('@')[1]?.split('/')[0]);
    
    const sql = neon(connectionString);
    
    // List all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📊 Found tables:', tables.map(t => t.table_name));
    
    // Check specific tables we created
    const requiredTables = ['users', 'admin_sessions', 'admin_logs', 'contest_config', 'quiz_responses', 'team_members'];
    
    for (const tableName of requiredTables) {
      try {
        // Create the query string and use it as a template literal
        const count = await sql`SELECT COUNT(*) as count FROM ${sql.unsafe(tableName)}`;
        console.log(`✅ ${tableName}: ${count[0].count} rows`);
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
