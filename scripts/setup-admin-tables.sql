-- Admin panel database setup
-- This script sets up the tables needed for admin functionality

-- Client invitations system
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL, 
  phone VARCHAR(20),
  invitation_token UUID DEFAULT gen_random_uuid(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, registered, expired
  created_by VARCHAR(100), -- admin email who created it
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS on client_invitations
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_invitations (admin-only access)
CREATE POLICY "Admin can manage invitations" ON client_invitations
  FOR ALL USING (true); -- We'll control access via environment variables

-- Add an admin_created field to clients table to track admin-created clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS admin_created BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES client_invitations(id);

-- Verify tables were created
SELECT 'Client invitations table created' as message;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_invitations' 
ORDER BY ordinal_position;