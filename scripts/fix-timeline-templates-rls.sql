-- Fix RLS policies for timeline_templates table
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "timeline_templates_select_policy" ON timeline_templates;
DROP POLICY IF EXISTS "timeline_templates_insert_policy" ON timeline_templates;
DROP POLICY IF EXISTS "timeline_templates_update_policy" ON timeline_templates;
DROP POLICY IF EXISTS "timeline_templates_delete_policy" ON timeline_templates;

-- Create new policies that allow admin operations
CREATE POLICY "timeline_templates_select_policy" ON timeline_templates
  FOR SELECT USING (true);

CREATE POLICY "timeline_templates_insert_policy" ON timeline_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );

CREATE POLICY "timeline_templates_update_policy" ON timeline_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );

CREATE POLICY "timeline_templates_delete_policy" ON timeline_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );

-- Also fix session_timelines policies while we're at it
DROP POLICY IF EXISTS "session_timelines_insert_policy" ON session_timelines;
DROP POLICY IF EXISTS "session_timelines_update_policy" ON session_timelines;
DROP POLICY IF EXISTS "session_timelines_delete_policy" ON session_timelines;

CREATE POLICY "session_timelines_insert_policy" ON session_timelines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
    OR
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = session_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "session_timelines_update_policy" ON session_timelines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
    OR
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = session_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "session_timelines_delete_policy" ON session_timelines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );

SELECT 'Timeline templates RLS policies updated!' as message;