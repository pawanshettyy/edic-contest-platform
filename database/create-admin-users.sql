-- Admin Creation Script
-- This script creates admin users in the database
-- Run this script to add admin accounts

-- Insert default admin user (change password in production!)
INSERT INTO admin_users (
  id,
  username,
  email,
  password_hash,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin',
  'admin@contest.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', -- bcrypt hash of 'admin123'
  'super_admin',
  '{"all": true, "teams": true, "config": true, "users": true, "logs": true}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert additional admin user (example)
INSERT INTO admin_users (
  id,
  username,
  email,
  password_hash,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'manager',
  'manager@contest.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', -- bcrypt hash of 'admin123'
  'admin',
  '{"teams": true, "config": false, "users": false, "logs": true}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Verify admin users were created
SELECT 
  username,
  email,
  role,
  permissions,
  is_active,
  created_at
FROM admin_users
WHERE is_active = true
ORDER BY created_at;

-- Show current admin count
SELECT 
  role,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM admin_users
GROUP BY role
ORDER BY role;
