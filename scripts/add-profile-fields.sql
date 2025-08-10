-- Add additional profile fields to clients table
-- Run this in Supabase SQL Editor

-- Add profile fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip VARCHAR(10);

-- Verify columns were added
SELECT 'Profile fields added successfully' as message;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;