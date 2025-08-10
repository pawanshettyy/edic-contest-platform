// Debug admin user query
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

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

async function debugAdminQuery() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Debug: Testing exact API query...');
    
    // This is the exact query used in the API
    const adminUsers = await sql`
      SELECT * FROM admin_users 
      WHERE username = ${'admin'} AND is_active = true 
      LIMIT 1
    `;
    
    console.log('📊 Query result:', JSON.stringify(adminUsers, null, 2));
    
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log('\n🔐 Password Hash Details:');
      console.log('Hash length:', admin.password_hash?.length || 'undefined');
      console.log('Hash starts with:', admin.password_hash?.substring(0, 10) || 'undefined');
      console.log('Full hash:', admin.password_hash);
      
      // Test password verification
      if (admin.password_hash) {
        console.log('\n🧪 Testing password verification:');
        try {
          const isValid = await bcrypt.compare('admin123', admin.password_hash);
          console.log(`Password verification result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
          
          // Also test with some common wrong passwords
          const wrongTest = await bcrypt.compare('wrong', admin.password_hash);
          console.log(`Wrong password test: ${wrongTest ? '❌ SHOULD BE FALSE' : '✅ CORRECTLY FALSE'}`);
          
        } catch (bcryptError) {
          console.log('❌ Bcrypt error:', bcryptError.message);
        }
      } else {
        console.log('❌ No password hash found!');
      }
    } else {
      console.log('❌ No admin users found');
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
    console.error('Full error:', error);
  }
}

debugAdminQuery();
