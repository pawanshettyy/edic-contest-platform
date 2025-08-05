// Test script to check admin user in database
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://ekdgadhqytjiqcaxdfqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGdhZGhxeXRqaXFjYXhkZnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTEzNDMsImV4cCI6MjA2OTk4NzM0M30.ouVw_LI9rP-4HvYX20XmQBRK--j8oT2Nv2kmSllqyxg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminUser() {
  console.log('🔍 Testing admin user in database...');
  
  try {
    // Check if admin_users table exists and get all users
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('*');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('📊 Admin users found:', adminUsers?.length || 0);
    
    if (adminUsers && adminUsers.length > 0) {
      adminUsers.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`, {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at
        });
      });
      
      // Test password hash for admin user
      const adminUser = adminUsers.find(u => u.username === 'admin');
      if (adminUser) {
        console.log('\n🔐 Testing password for admin user...');
        const isPasswordValid = await bcrypt.compare('admin123', adminUser.password_hash);
        console.log('Password "admin123" is valid:', isPasswordValid);
        
        // Test some other common passwords
        const testPasswords = ['admin', 'password', 'admin@123'];
        for (const pwd of testPasswords) {
          const isValid = await bcrypt.compare(pwd, adminUser.password_hash);
          if (isValid) {
            console.log(`✅ Password "${pwd}" works!`);
          }
        }
      }
    } else {
      console.log('❌ No admin users found in database!');
      console.log('💡 You may need to run the admin-schema.sql script');
    }
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testAdminUser();
