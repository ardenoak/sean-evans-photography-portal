-- Create comprehensive admin management system for Sean Evans Photography

-- Create admin_users table
CREATE TABLE public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User Information
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    
    -- Admin Status
    is_active BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
    
    -- Permissions
    can_manage_leads BOOLEAN DEFAULT true,
    can_manage_clients BOOLEAN DEFAULT true,
    can_manage_sessions BOOLEAN DEFAULT true,
    can_manage_admins BOOLEAN DEFAULT false, -- Only super_admin by default
    can_view_analytics BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE
);

-- Create admin_invitations table for managing invites
CREATE TABLE public.admin_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
    
    -- Invitation status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    invitation_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Who sent the invitation
    invited_by TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
CREATE INDEX idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX idx_admin_invitations_status ON admin_invitations(status);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_active = true
        )
    );

CREATE POLICY "Super admins can manage all admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.role = 'super_admin'
            AND au.is_active = true
        )
    );

CREATE POLICY "Users can update their own login timestamp" ON admin_users
    FOR UPDATE USING (email = auth.jwt() ->> 'email')
    WITH CHECK (email = auth.jwt() ->> 'email');

-- RLS Policies for admin_invitations  
CREATE POLICY "Super admins can manage invitations" ON admin_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.role = 'super_admin'
            AND au.is_active = true
        )
    );

CREATE POLICY "Admins can view invitations" ON admin_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email' 
            AND au.is_active = true
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = user_email 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM admin_users 
    WHERE email = user_email 
    AND is_active = true;
    
    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check specific admin permissions
CREATE OR REPLACE FUNCTION has_admin_permission(user_email TEXT, permission_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT 
        CASE permission_type
            WHEN 'leads' THEN can_manage_leads
            WHEN 'clients' THEN can_manage_clients  
            WHEN 'sessions' THEN can_manage_sessions
            WHEN 'admins' THEN can_manage_admins
            WHEN 'analytics' THEN can_view_analytics
            ELSE false
        END
    INTO has_permission
    FROM admin_users 
    WHERE email = user_email 
    AND is_active = true;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert the initial super admin
INSERT INTO admin_users (
    email, first_name, last_name, role, 
    can_manage_leads, can_manage_clients, can_manage_sessions, can_manage_admins, can_view_analytics,
    created_by, activated_at
) VALUES (
    'hello@ardenoak.co', 'Sean', 'Evans', 'super_admin',
    true, true, true, true, true,
    'system', NOW()
);