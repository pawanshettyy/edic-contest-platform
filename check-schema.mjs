import { neon } from '@neondatabase/serverless';

async function checkTableStructure() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_BoY6CjGyVQP8@ep-summer-boat-a1v7yo0q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  const sql = neon(connectionString);
  
  try {
    console.log('🔗 Connected to Neon database');

    // Check contest_config table structure
    console.log('📋 Checking contest_config table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'contest_config'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Contest Config table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

    // Check if we have any data in contest_config
    console.log('\n📄 Current contest_config data:');
    const configData = await sql`SELECT * FROM contest_config LIMIT 1`;
    if (configData.length > 0) {
      console.log('✅ Config exists:', JSON.stringify(configData[0], null, 2));
    } else {
      console.log('❌ No config data found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTableStructure();
