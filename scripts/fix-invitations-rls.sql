-- Fix the RLS policy for admin_invitations to allow inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read invitations" ON admin_invitations;
DROP POLICY IF EXISTS "Service role full access to admin_invitations" ON admin_invitations;

-- Create new policies that allow super admins to manage invitations
CREATE POLICY "Allow authenticated users to read admin invitations" ON admin_invitations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow super admins to manage admin invitations" ON admin_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
            AND au.role = 'super_admin'
            AND au.is_active = true
        )
    );

CREATE POLICY "Service role full access to admin invitations" ON admin_invitations
    FOR ALL USING (auth.role() = 'service_role');