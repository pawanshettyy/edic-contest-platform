// Script to create correct admin user with proper password hash
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://ekdgadhqytjiqcaxdfqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGdhZGhxeXRqaXFjYXhkZnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTEzNDMsImV4cCI6MjA2OTk4NzM0M30.ouVw_LI9rP-4HvYX20XmQBRK--j8oT2Nv2kmSllqyxg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createCorrectAdminUser() {
  console.log('🔧 Creating correct admin user...');
  
  try {
    // Generate correct password hash for "admin123"
    const password = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Generated password hash for "admin123"');
    
    // Delete existing admin user
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('username', 'admin');
    
    if (deleteError) {
      console.log('⚠️ Delete error (might not exist):', deleteError.message);
    }
    
    // Insert new admin user with correct hash
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: 'admin',
        email: 'admin@axiostechnology.com',
        password_hash: hashedPassword,
        role: 'super_admin',
        permissions: {
          all: true,
          teams: true,
          config: true,
          users: true,
          logs: true
        },
        is_active: true
      })
      .select();
    
    if (error) {
      console.error('❌ Insert error:', error);
      return;
    }
    
    console.log('✅ Successfully created admin user:', data[0]);
    
    // Test the password
    console.log('\n🧪 Testing password...');
    const isValid = await bcrypt.compare('admin123', hashedPassword);
    console.log('Password "admin123" is valid:', isValid);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createCorrectAdminUser();
