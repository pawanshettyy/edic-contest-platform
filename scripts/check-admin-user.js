// Check admin user details
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

async function checkAdminUser() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('👤 Checking admin user details...');
    
    const adminUsers = await sql`
      SELECT 
        id,
        username, 
        email, 
        role,
        permissions,
        is_active,
        last_login,
        created_at,
        updated_at
      FROM admin_users 
      ORDER BY created_at
    `;
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      return;
    }
    
    console.log(`\n📋 Found ${adminUsers.length} admin user(s):\n`);
    
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. Admin User Details:`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   👤 Username: ${admin.username}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🛡️  Role: ${admin.role}`);
      console.log(`   ⚡ Active: ${admin.is_active ? 'Yes' : 'No'}`);
      console.log(`   🕐 Last Login: ${admin.last_login || 'Never'}`);
      console.log(`   📅 Created: ${admin.created_at}`);
      console.log('');
    });
    
    console.log('🔑 To log in, use these credentials:');
    console.log(`   Username: ${adminUsers[0].username}`);
    console.log(`   Password: admin123 (default password)`);
    console.log('');
    console.log('⚠️  Remember: Password hashes cannot be reversed to plain text!');
    console.log('💡 If you forgot the password, use the reset-admin-password.js script');
    
  } catch (error) {
    console.error('💥 Failed to check admin users:', error.message);
  }
}

checkAdminUser();
