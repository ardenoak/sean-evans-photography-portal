-- Create table to store Google Calendar authentication tokens
CREATE TABLE admin_auth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(user_id) ON DELETE CASCADE,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_auth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy - only admins can access their own tokens
CREATE POLICY "Admins can manage their own auth tokens" ON admin_auth_tokens
  FOR ALL USING (
    admin_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_auth_tokens 
  WHERE google_expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- Index for performance
CREATE INDEX idx_admin_auth_tokens_admin_id ON admin_auth_tokens(admin_id);
CREATE INDEX idx_admin_auth_tokens_expires_at ON admin_auth_tokens(google_expires_at);