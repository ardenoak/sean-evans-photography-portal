-- Fix RLS policy for sessions table to allow admin access
-- Run this in Supabase SQL Editor

-- First, let's see the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sessions';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only see own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can only insert own sessions" ON sessions;

-- Create new policies that allow both client access AND admin access
-- Policy 1: Allow users to see their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM clients WHERE clients.id = sessions.client_id
        )
    );

-- Policy 2: Allow users to insert sessions for themselves (not typically used)
CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM clients WHERE clients.id = sessions.client_id
        )
    );

-- Policy 3: Allow admin users to do everything with sessions
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

-- Verify the new policies
SELECT 'New RLS policies created successfully' as message;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sessions';