const { neon } = require('@neondatabase/serverless');

async function testDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log('DATABASE_URL exists:', !!connectionString);
    
    if (!connectionString) {
      console.log('❌ No DATABASE_URL found');
      return;
    }
    
    const sql = neon(connectionString);
    console.log('🔗 Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Check if admin_users table exists
    try {
      // List all tables
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      console.log('📋 All tables:', tables.map(t => t.table_name));
      
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_users'
        );
      `;
      console.log('📋 Admin users table exists:', tableCheck[0].exists);
      
      if (tableCheck[0].exists) {
        const adminCount = await sql`SELECT COUNT(*) as count FROM admin_users`;
        console.log('👥 Admin users count:', adminCount[0].count);
        
        const adminList = await sql`SELECT username, role, is_active, created_at FROM admin_users ORDER BY created_at`;
        console.log('👤 Admin users:', adminList);
      }
    } catch (tableError) {
      console.log('❌ Admin users table error:', tableError.message);
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    console.log('Error details:', error);
  }
}

testDatabase();
