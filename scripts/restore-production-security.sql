-- RESTORE PRODUCTION SECURITY
-- Re-enable RLS and set up proper security policies for production

-- ====================================
-- 1. RE-ENABLE ROW LEVEL SECURITY
-- ====================================

-- Re-enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other sensitive tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 2. ADMIN USERS POLICIES (Secure)
-- ====================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow authenticated read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Service role full access admin_users" ON admin_users;

-- Create secure admin_users policies
CREATE POLICY "Active admins can read admin_users" ON admin_users
    FOR SELECT USING (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND 
         EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true))
    );

CREATE POLICY "New users can create admin record during invitation" ON admin_users
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND user_id = auth.uid())
    );

CREATE POLICY "Users can update own admin record" ON admin_users
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND user_id = auth.uid())
    );

CREATE POLICY "Super admins can manage all admin users" ON admin_users
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true))
    );

-- ====================================
-- 3. ADMIN INVITATIONS POLICIES (Secure)
-- ====================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Anyone can read pending invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Anyone can update pending invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Authenticated can manage invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Service role full access invitations" ON admin_invitations;

-- Create secure invitation policies
CREATE POLICY "Service role manages invitations" ON admin_invitations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Super admins can manage invitations" ON admin_invitations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true)
    );

CREATE POLICY "Anyone can read pending invitations by token" ON admin_invitations
    FOR SELECT USING (status = 'pending');

CREATE POLICY "Anyone can accept pending invitations" ON admin_invitations
    FOR UPDATE USING (status = 'pending') WITH CHECK (status IN ('accepted', 'expired'));

-- ====================================
-- 4. LEADS POLICIES (Admin Only)
-- ====================================

CREATE POLICY "Active admins can manage leads" ON leads
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true AND au.can_manage_leads = true)
    );

-- ====================================
-- 5. SESSIONS POLICIES (Admin Only)
-- ====================================

CREATE POLICY "Active admins can manage sessions" ON sessions
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true AND au.can_manage_sessions = true)
    );

-- ====================================
-- 6. CLIENTS POLICIES (Admin Only)
-- ====================================

CREATE POLICY "Active admins can manage clients" ON clients
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true AND au.can_manage_clients = true)
    );

-- ====================================
-- 7. VERIFICATION
-- ====================================

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('admin_users', 'admin_invitations', 'leads', 'sessions', 'clients');

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;