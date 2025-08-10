-- Run this in your Supabase SQL Editor to create an admin user
-- This will ensure you can get back into your system

-- First, check if admin_users table exists and what's in it
SELECT * FROM admin_users;

-- If you need to create an admin user record (adjust email as needed)
INSERT INTO admin_users (email, is_active, role, created_at, updated_at)
VALUES ('hello@ardenoak.co', true, 'super_admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  is_active = true,
  role = 'super_admin',
  updated_at = NOW();

-- Check the result
SELECT * FROM admin_users WHERE email = 'hello@ardenoak.co';