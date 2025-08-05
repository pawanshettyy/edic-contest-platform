-- Admin Password Hash Generator
-- Use this script to generate bcrypt hashes for admin passwords

-- Example password hashes (generated with bcrypt rounds=12):
-- 'admin123' = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i'
-- 'password' = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
-- 'secure123' = '$2a$12$1wGV9lKm.GHp7qrEBzxiXeU6LzQGiIlJiPPbNTxlYUNHQX8KQGrK'

-- Template for creating new admin user:
/*
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
  'YOUR_USERNAME',
  'YOUR_EMAIL@domain.com',
  'YOUR_BCRYPT_HASH_HERE',
  'admin', -- or 'super_admin'
  '{"teams": true, "config": true, "users": false, "logs": true}',
  true,
  NOW(),
  NOW()
);
*/

-- Admin Role Permissions:
-- super_admin: Full access to everything
-- admin: Limited access (cannot manage other admins)
-- manager: View-only access to most features

-- Generate bcrypt hash using Node.js:
-- const bcrypt = require('bcrypt');
-- console.log(await bcrypt.hash('your-password', 12));

-- Or use online bcrypt generator with rounds=12

-- Security Best Practices:
-- 1. Use strong passwords (min 12 characters)
-- 2. Include uppercase, lowercase, numbers, symbols
-- 3. Change default passwords immediately
-- 4. Use different passwords for each admin
-- 5. Regularly rotate admin passwords
-- 6. Monitor admin_logs table for suspicious activity
