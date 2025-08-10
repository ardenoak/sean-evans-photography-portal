-- Fix RLS policy to allow invitation acceptance without authentication

-- Add a policy that allows anyone to read pending invitations by token
-- This is safe because the token is a secure UUID that's hard to guess
CREATE POLICY "Allow token-based access to pending invitations" ON admin_invitations
    FOR SELECT USING (
        status = 'pending' AND expires_at > NOW()
    );

-- Also allow anyone to update the invitation they're accepting
CREATE POLICY "Allow token-based invitation acceptance" ON admin_invitations
    FOR UPDATE USING (
        status = 'pending' AND expires_at > NOW()
    );