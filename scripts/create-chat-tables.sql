-- Create chat interactions table for Session Concierge
-- Run this in Supabase SQL Editor

-- Create chat_interactions table
CREATE TABLE IF NOT EXISTS chat_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  client_message TEXT,
  ai_response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_interactions
CREATE POLICY "chat_interactions_select_policy" ON chat_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = session_id AND c.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );

CREATE POLICY "chat_interactions_insert_policy" ON chat_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = session_id AND c.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS chat_interactions_session_id_idx ON chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS chat_interactions_created_at_idx ON chat_interactions(created_at);

SELECT 'Chat interactions table created successfully!' as message;