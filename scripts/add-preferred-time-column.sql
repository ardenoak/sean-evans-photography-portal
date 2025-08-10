-- Add preferred_time column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_time TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN leads.preferred_time IS 'Preferred time for sessions (e.g., "10:00 AM", "Flexible")';