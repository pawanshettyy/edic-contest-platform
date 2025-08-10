// Reset admin password script
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

async function resetAdminPassword() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Get new password from command line argument or use default
  const newPassword = process.argv[2] || 'admin123';
  
  console.log('🔐 Resetting admin password...');
  
  try {
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the admin user password
    const result = await sql`
      UPDATE admin_users 
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE username = 'admin'
      RETURNING username, email
    `;
    
    if (result.length > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log(`👤 Username: ${result[0].username}`);
      console.log(`📧 Email: ${result[0].email}`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log('⚠️  Please log in and change this password immediately!');
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('💥 Failed to reset password:', error.message);
  }
}

resetAdminPassword();
