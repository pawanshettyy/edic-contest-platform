// Create 5 admin users with unique credentials
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

const adminUsers = [
  {
    username: 'superadmin',
    email: 'superadmin@techpreneur3.com',
    password: 'SuperAdmin@2025',
    role: 'super_admin',
    permissions: { all: true, teams: true, config: true, users: true, logs: true, questions: true, monitor: true }
  },
  {
    username: 'admin_contest',
    email: 'contest@techpreneur3.com', 
    password: 'Contest#Admin123',
    role: 'contest_admin',
    permissions: { teams: true, config: true, questions: true, monitor: true }
  },
  {
    username: 'admin_tech',
    email: 'tech@techpreneur3.com',
    password: 'TechAdmin$456',
    role: 'tech_admin', 
    permissions: { config: true, monitor: true, logs: true }
  },
  {
    username: 'admin_judge',
    email: 'judge@techpreneur3.com',
    password: 'Judge&Panel789',
    role: 'judge_admin',
    permissions: { teams: true, monitor: true }
  },
  {
    username: 'admin_backup',
    email: 'backup@techpreneur3.com',
    password: 'Backup!Admin999',
    role: 'backup_admin',
    permissions: { teams: true, config: true, monitor: true }
  }
];

async function createAdminUsers() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🧹 Clearing existing admin users...');
    await sql`DELETE FROM admin_users`;
    
    console.log('👥 Creating 5 new admin users...\n');
    
    const saltRounds = 12;
    const createdUsers = [];
    
    for (const admin of adminUsers) {
      console.log(`📝 Creating admin: ${admin.username}`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(admin.password, saltRounds);
      
      // Insert admin user
      const result = await sql`
        INSERT INTO admin_users (
          username, 
          email, 
          password_hash, 
          role, 
          permissions,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${admin.username},
          ${admin.email}, 
          ${hashedPassword},
          ${admin.role},
          ${JSON.stringify(admin.permissions)},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, username, email, role
      `;
      
      if (result.length > 0) {
        const createdUser = result[0];
        createdUsers.push({
          ...admin,
          id: createdUser.id
        });
        console.log(`   ✅ Created: ${createdUser.username} (${createdUser.role})`);
      }
    }
    
    console.log('\n🔍 Verifying created users...');
    const allAdmins = await sql`SELECT username, email, role, is_active FROM admin_users ORDER BY created_at`;
    
    console.log(`\n📊 Total admin users: ${allAdmins.length}`);
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.role}) - ${admin.is_active ? 'Active' : 'Inactive'}`);
    });
    
    console.log('\n🎉 Admin users created successfully!');
    console.log('📋 See ADMIN_CREDENTIALS.md for login details');
    
    return createdUsers;
    
  } catch (error) {
    console.error('💥 Failed to create admin users:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

createAdminUsers();
