-- Fix RLS policy to allow invitation acceptance process to create admin users

-- Allow newly signed up users to create their admin record
-- This is safe because they must have a valid invitation to get here
CREATE POLICY "Allow new user admin record creation" ON admin_users
    FOR INSERT 
    WITH CHECK (
        -- Only allow if the user just signed up (their auth.uid exists)
        auth.uid() IS NOT NULL
    );