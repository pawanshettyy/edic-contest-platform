// Database setup script for Neon
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Get current directory
const currentDir = process.cwd();

function loadEnvFile() {
  try {
    const envPath = path.join(currentDir, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...values] = trimmedLine.split('=');
          if (key && values.length > 0) {
            const value = values.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value.trim();
          }
        }
      });
      
      console.log('✅ Environment variables loaded from .env.local');
      return true;
    } else {
      console.log('⚠️ .env.local file not found');
      return false;
    }
  } catch (error) {
    console.log('⚠️ Could not load .env.local file:', error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Neon database schema...');
  
  // Load environment variables
  loadEnvFile();
  
  // Check environment variable
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please check your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is configured');
  
  try {
    // Initialize Neon client
    const sql = neon(process.env.DATABASE_URL);
    console.log('🔗 Connected to Neon database');
    
    // Read the quick setup SQL file
    const sqlFilePath = path.join(currentDir, 'database', 'quick-setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Loaded SQL schema from quick-setup.sql');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('SELECT \'Quick setup'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using template literal syntax
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          // Use eval to properly execute template literals
          await eval(`sql\`${statement}\``);
        } catch (error) {
          // Some errors are expected (like extension already exists)
          if (error.message.includes('already exists')) {
            console.log(`⚠️ ${error.message} (skipping)`);
          } else {
            console.log(`⚠️ Error in statement ${i + 1}: ${error.message}`);
            // Continue with other statements
          }
        }
      }
    }
    
    // Verify tables were created
    console.log('🔍 Verifying database setup...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    // Test admin user
    console.log('👤 Checking admin user...');
    const adminUsers = await sql`SELECT username, email, role FROM admin_users WHERE username = 'admin'`;
    
    if (adminUsers.length > 0) {
      console.log(`✅ Admin user created: ${adminUsers[0].username} (${adminUsers[0].email})`);
      console.log(`🔑 Default admin credentials:`);
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('🚀 You can now start the development server with: npm run dev');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);
