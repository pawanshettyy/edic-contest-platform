// Fix admin password hash
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

async function fixAdminPassword() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Fixing admin password hash...');
    
    // Test the current hash first
    const currentAdmin = await sql`SELECT username, password_hash FROM admin_users WHERE username = 'admin'`;
    if (currentAdmin.length === 0) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log('🔍 Current admin details:');
    console.log(`Username: ${currentAdmin[0].username}`);
    console.log(`Current hash: ${currentAdmin[0].password_hash}`);
    
    // Test current password verification
    console.log('\n🧪 Testing current password verification...');
    const currentHashValid = await bcrypt.compare('admin123', currentAdmin[0].password_hash);
    console.log(`Current hash validation: ${currentHashValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (currentHashValid) {
      console.log('✅ Current password hash is working correctly!');
      return;
    }
    
    // Generate a fresh hash
    console.log('\n🔑 Generating fresh password hash...');
    const saltRounds = 12;
    const newPassword = 'admin123';
    const freshHash = await bcrypt.hash(newPassword, saltRounds);
    console.log(`Fresh hash: ${freshHash}`);
    
    // Test the fresh hash
    const freshHashValid = await bcrypt.compare('admin123', freshHash);
    console.log(`Fresh hash validation: ${freshHashValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!freshHashValid) {
      console.log('❌ Fresh hash generation failed! This indicates a bcrypt issue.');
      return;
    }
    
    // Update the admin user with the fresh hash
    console.log('\n💾 Updating admin user with fresh hash...');
    const updateResult = await sql`
      UPDATE admin_users 
      SET password_hash = ${freshHash}, updated_at = NOW()
      WHERE username = 'admin'
      RETURNING username, email, updated_at
    `;
    
    if (updateResult.length > 0) {
      console.log('✅ Admin password hash updated successfully!');
      console.log(`Username: ${updateResult[0].username}`);
      console.log(`Email: ${updateResult[0].email}`);
      console.log(`Updated: ${updateResult[0].updated_at}`);
      
      // Final verification
      console.log('\n🎯 Final verification...');
      const verifyAdmin = await sql`SELECT password_hash FROM admin_users WHERE username = 'admin'`;
      const finalValid = await bcrypt.compare('admin123', verifyAdmin[0].password_hash);
      console.log(`Final verification: ${finalValid ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (finalValid) {
        console.log('\n🎉 Admin login should now work with:');
        console.log('Username: admin');
        console.log('Password: admin123');
      }
    } else {
      console.log('❌ Failed to update admin password');
    }
    
  } catch (error) {
    console.error('💥 Failed to fix admin password:', error.message);
    console.error('Full error:', error);
  }
}

fixAdminPassword();
