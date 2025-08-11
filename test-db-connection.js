// Database connection test for Neon (CommonJS)
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        const value = values.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    });
    
    console.log('✅ Environment variables loaded from .env.local');
  } catch {
    console.log('⚠️ Could not load .env.local file, using system environment variables');
  }
}

async function testNeonConnection() {
  console.log('🔍 Testing Neon database connection...');
  
  // Load environment variables
  loadEnvFile();
  
  // Check environment variable
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return false;
  }
  
  console.log('✅ DATABASE_URL is configured');
  console.log('🔗 Connection string preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const result = await sql`SELECT 1 as test, NOW() as timestamp, version() as db_version`;
    
    console.log('✅ Connection successful!');
    console.log('📊 Test result:', {
      test: result[0]?.test,
      timestamp: result[0]?.timestamp,
      version: result[0]?.db_version?.substring(0, 50) + '...'
    });
    
    // Test if teams table exists
    console.log('🔍 Checking if teams table exists...');
    try {
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'teams'
      `;
      
      if (tableCheck.length > 0) {
        console.log('✅ Teams table exists');
        
        // Get team count
        const teamCount = await sql`SELECT COUNT(*) as count FROM teams`;
        console.log('📊 Teams in database:', teamCount[0]?.count);
      } else {
        console.log('⚠️ Teams table does not exist - you may need to run the schema');
        
        // Check what tables do exist
        console.log('🔍 Checking existing tables...');
        const allTables = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `;
        
        console.log('📋 Existing tables:', allTables.map(t => t.table_name).join(', ') || 'None');
      }
    } catch (tableError) {
      console.log('⚠️ Could not check teams table:', tableError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide helpful debugging info
    if (error.message.includes('password authentication failed')) {
      console.log('💡 Hint: Check your DATABASE_URL password');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Hint: Check your DATABASE_URL database name');
    } else if (error.message.includes('connection')) {
      console.log('💡 Hint: Check your network connection and DATABASE_URL host');
    }
    
    return false;
  }
}

// Run the test
testNeonConnection()
  .then(success => {
    if (success) {
      console.log('🎉 Database connection test completed successfully!');
      process.exit(0);
    } else {
      console.log('💥 Database connection test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });