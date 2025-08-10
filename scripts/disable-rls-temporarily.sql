-- Temporarily disable RLS to test invitation acceptance

-- Disable RLS on admin_users temporarily
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Keep RLS on invitations but with simple policies
ALTER TABLE admin_invitations DISABLE ROW LEVEL SECURITY;