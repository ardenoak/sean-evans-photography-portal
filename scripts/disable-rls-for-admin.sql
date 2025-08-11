-- Temporarily disable RLS for admin system to work
-- This is the quickest fix for the admin direct access issue

-- Disable RLS on main tables to allow admin operations
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;  
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations DISABLE ROW LEVEL SECURITY;

-- Optional: You can re-enable later with proper policies
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- etc...