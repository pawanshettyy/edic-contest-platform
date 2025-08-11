const { neon } = require('@neondatabase/serverless');

async function runMigration() {
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log('DATABASE_URL exists:', !!connectionString);
    
    if (!connectionString) {
      console.log('❌ No DATABASE_URL found');
      return;
    }
    
    const sql = neon(connectionString);
    console.log('🔗 Running database migration...');
    
    // Add missing columns to teams table
    console.log('Adding columns to teams table...');
    await sql`
      ALTER TABLE teams 
      ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS leader_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'
    `;
    
    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_teams_leader_email ON teams(leader_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teams_leader_name ON teams(leader_name)`;
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    const tables = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      AND column_name IN ('leader_name', 'leader_email', 'members')
      ORDER BY column_name
    `;
    console.log('📋 New columns added:', tables);
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    console.log('Error details:', error);
  }
}

runMigration();
