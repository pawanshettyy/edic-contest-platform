// Simple database connection test
const { Pool } = require('pg');

// Read environment variables manually
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ Environment file loaded');
  } catch (error) {
    console.log('⚠️ Could not load .env.local file:', error.message);
  }
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  // Load environment variables
  loadEnvFile();
  
  console.log('📊 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL found in environment');
    return;
  }

  // Mask sensitive parts of the URL for logging
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('🔗 Connecting to:', maskedUrl);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('🗄️ PostgreSQL version:', result.rows[0].postgres_version.substring(0, 50) + '...');
    
    // Test if our tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_users', 'teams', 'quiz_questions')
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tableCheck.rows.map(r => r.table_name));
    
    if (tableCheck.rows.length === 0) {
      console.log('⚠️ No tables found - you need to run the database schema!');
      console.log('📝 Go to Neon Dashboard > SQL Editor and run the schema from database/optimized-schema.sql');
    } else {
      console.log('✅ Database schema appears to be set up');
      
      // Test admin user exists
      const adminCheck = await client.query('SELECT username FROM admin_users WHERE username = $1', ['admin']);
      if (adminCheck.rows.length > 0) {
        console.log('👤 Admin user found - ready for login!');
      } else {
        console.log('⚠️ No admin user found - make sure to run the full schema with sample data');
      }
    }

    client.release();
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 This usually means the database host is unreachable');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 This usually means the database is not accepting connections');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('💡 This usually means incorrect credentials');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 The database does not exist - check your Neon project');
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your Neon database is running');
    console.log('2. Check the connection string is correct');
    console.log('3. Ensure your IP is allowlisted (Neon allows all by default)');
    console.log('4. Try connecting via Neon Dashboard first');
  } finally {
    await pool.end();
  }
}

testConnection();
