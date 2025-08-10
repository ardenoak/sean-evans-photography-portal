-- Force fix RLS policies for sessions table
-- Run this in Supabase SQL Editor

-- First, see what policies currently exist
SELECT 'Current policies:' as message;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'sessions';

-- Drop ALL existing policies on sessions table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'sessions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON sessions';
    END LOOP;
END $$;

-- Now create the correct policies from scratch
-- Policy 1: Allow users to see their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM clients WHERE clients.id = sessions.client_id
        )
    );

-- Policy 2: Allow admin users to do everything with sessions
CREATE POLICY "Admin users can manage all sessions" ON sessions
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'sean@ardenoak.co',
            'hello@ardenoak.co'
        )
    ) WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'sean@ardenoak.co', 
            'hello@ardenoak.co'
        )
    );

-- Verify the new policies work
SELECT 'New policies created:' as message;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'sessions';