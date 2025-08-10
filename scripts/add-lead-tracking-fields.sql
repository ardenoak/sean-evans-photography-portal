-- Add tracking fields for lead management
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_session_date DATE;

-- Add comments to explain the columns
COMMENT ON COLUMN leads.last_viewed_at IS 'When the lead was last viewed by an admin (removes "new" indicator)';
COMMENT ON COLUMN leads.preferred_session_date IS 'Clients preferred date for their session';