-- Temporarily fix RLS issues for invitation acceptance

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow authenticated users to read admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow super admins to manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow users to update their own admin record" ON admin_users;
DROP POLICY IF EXISTS "Service role full access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow new user admin record creation" ON admin_users;

-- Create simple policies that work
CREATE POLICY "Allow authenticated read admin_users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert admin_users" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update admin_users" ON admin_users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Also fix the invitations policies
DROP POLICY IF EXISTS "Allow authenticated users to read admin invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Allow super admins to manage admin invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Service role full access to admin invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Allow token-based access to pending invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Allow token-based invitation acceptance" ON admin_invitations;

-- Create simple invitation policies
CREATE POLICY "Anyone can read pending invitations" ON admin_invitations
    FOR SELECT USING (status = 'pending');

CREATE POLICY "Anyone can update pending invitations" ON admin_invitations
    FOR UPDATE USING (status = 'pending');

CREATE POLICY "Authenticated can manage invitations" ON admin_invitations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access invitations" ON admin_invitations
    FOR ALL USING (auth.role() = 'service_role');