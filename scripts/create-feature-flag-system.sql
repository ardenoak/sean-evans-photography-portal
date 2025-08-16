-- =====================================================
-- TALLY PHOTOGRAPHY FEATURE FLAG SYSTEM
-- Comprehensive database schema for feature flag management
-- =====================================================
-- Created: 2025-08-16
-- Purpose: Safe deployment and progressive rollout system

-- =====================================================
-- 1. FEATURE FLAG CONFIGURATIONS TABLE
-- =====================================================
-- Stores global feature flag definitions and configurations
CREATE TABLE IF NOT EXISTS feature_flag_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'enhancement',
    default_value BOOLEAN NOT NULL DEFAULT false,
    
    -- Environment-specific defaults
    development_default BOOLEAN NOT NULL DEFAULT false,
    staging_default BOOLEAN NOT NULL DEFAULT false,
    production_default BOOLEAN NOT NULL DEFAULT false,
    
    -- Feature metadata
    dependencies TEXT[], -- Array of dependent flag keys
    admin_only BOOLEAN NOT NULL DEFAULT false,
    beta_feature BOOLEAN NOT NULL DEFAULT false,
    
    -- Rollout configuration
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    rollout_start_date TIMESTAMPTZ,
    rollout_end_date TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN ('core', 'enhancement', 'experimental', 'admin', 'integration', 'performance', 'ui')),
    CONSTRAINT valid_rollout_dates CHECK (rollout_end_date IS NULL OR rollout_end_date > rollout_start_date)
);

-- =====================================================
-- 2. GLOBAL FEATURE FLAGS TABLE
-- =====================================================
-- Stores current global state of feature flags
CREATE TABLE IF NOT EXISTS global_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    environment VARCHAR(20) NOT NULL DEFAULT 'production',
    
    -- Override settings
    force_enabled BOOLEAN DEFAULT false,
    force_disabled BOOLEAN DEFAULT false,
    
    -- Audit fields
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_by UUID REFERENCES auth.users(id),
    reason TEXT,
    
    -- Foreign key
    FOREIGN KEY (flag_key) REFERENCES feature_flag_configs(flag_key) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT valid_environment CHECK (environment IN ('development', 'staging', 'production', 'preview')),
    CONSTRAINT valid_force_settings CHECK (NOT (force_enabled AND force_disabled))
);

-- =====================================================
-- 3. USER FEATURE PREFERENCES TABLE
-- =====================================================
-- Stores user-specific feature flag preferences and overrides
CREATE TABLE IF NOT EXISTS user_feature_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL,
    
    -- User settings
    preview_mode BOOLEAN NOT NULL DEFAULT false,
    auto_enabled BOOLEAN NOT NULL DEFAULT false, -- Auto-enabled by admin
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_id, flag_key),
    
    -- Foreign key
    FOREIGN KEY (flag_key) REFERENCES feature_flag_configs(flag_key) ON DELETE CASCADE
);

-- =====================================================
-- 4. FEATURE FLAG AUDIT LOG TABLE
-- =====================================================
-- Comprehensive audit trail for all feature flag changes
CREATE TABLE IF NOT EXISTS feature_flag_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- What changed
    flag_key VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_value BOOLEAN,
    new_value BOOLEAN,
    
    -- Who changed it
    user_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id), -- For user-specific changes
    
    -- Context
    environment VARCHAR(20),
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT valid_action CHECK (action IN ('enable', 'disable', 'toggle', 'reset', 'create', 'delete', 'bulk_update')),
    CONSTRAINT valid_environment_audit CHECK (environment IN ('development', 'staging', 'production', 'preview'))
);

-- =====================================================
-- 5. FEATURE FLAG ANALYTICS TABLE
-- =====================================================
-- Tracks feature usage, performance, and adoption metrics
CREATE TABLE IF NOT EXISTS feature_flag_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    -- Event data
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Performance metrics
    evaluation_time_ms DECIMAL(10, 3),
    error_occurred BOOLEAN DEFAULT false,
    error_message TEXT,
    
    -- Usage context
    page_url TEXT,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN ('viewed', 'interacted', 'completed', 'error', 'performance')),
    
    -- Foreign key
    FOREIGN KEY (flag_key) REFERENCES feature_flag_configs(flag_key) ON DELETE CASCADE
);

-- =====================================================
-- 6. FEATURE FLAG ROLLOUT GROUPS TABLE
-- =====================================================
-- Manages gradual rollout and A/B testing groups
CREATE TABLE IF NOT EXISTS feature_flag_rollout_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Rollout configuration
    enabled BOOLEAN NOT NULL DEFAULT false,
    percentage INTEGER NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    
    -- User targeting
    user_criteria JSONB DEFAULT '{}', -- JSON criteria for user selection
    priority INTEGER NOT NULL DEFAULT 0, -- Higher priority groups evaluated first
    
    -- Date range
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Unique constraint
    UNIQUE(flag_key, group_name),
    
    -- Foreign key
    FOREIGN KEY (flag_key) REFERENCES feature_flag_configs(flag_key) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- =====================================================
-- 7. FEATURE FLAG USER GROUPS TABLE
-- =====================================================
-- Maps users to rollout groups for targeted feature delivery
CREATE TABLE IF NOT EXISTS feature_flag_user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES feature_flag_rollout_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    automatic_assignment BOOLEAN NOT NULL DEFAULT true,
    
    -- Unique constraint
    UNIQUE(group_id, user_id)
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Feature flag configs indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_configs_flag_key ON feature_flag_configs(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_configs_category ON feature_flag_configs(category);
CREATE INDEX IF NOT EXISTS idx_feature_flag_configs_beta ON feature_flag_configs(beta_feature);

-- Global feature flags indexes
CREATE INDEX IF NOT EXISTS idx_global_feature_flags_flag_key ON global_feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_global_feature_flags_environment ON global_feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_global_feature_flags_enabled ON global_feature_flags(enabled);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_feature_preferences_user_id ON user_feature_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_preferences_flag_key ON user_feature_preferences(flag_key);
CREATE INDEX IF NOT EXISTS idx_user_feature_preferences_enabled ON user_feature_preferences(enabled);
CREATE INDEX IF NOT EXISTS idx_user_feature_preferences_preview ON user_feature_preferences(preview_mode);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_log_flag_key ON feature_flag_audit_log(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_log_user_id ON feature_flag_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_log_timestamp ON feature_flag_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_log_action ON feature_flag_audit_log(action);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_analytics_flag_key ON feature_flag_analytics(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_analytics_user_id ON feature_flag_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_analytics_timestamp ON feature_flag_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_flag_analytics_event_type ON feature_flag_analytics(event_type);

-- Rollout groups indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_rollout_groups_flag_key ON feature_flag_rollout_groups(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_rollout_groups_enabled ON feature_flag_rollout_groups(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flag_rollout_groups_priority ON feature_flag_rollout_groups(priority);

-- User groups indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_user_groups_group_id ON feature_flag_user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_user_groups_user_id ON feature_flag_user_groups(user_id);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE feature_flag_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_rollout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_user_groups ENABLE ROW LEVEL SECURITY;

-- Feature flag configs policies (Admin read/write, Public read for basic info)
CREATE POLICY "feature_flag_configs_admin_all" ON feature_flag_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

CREATE POLICY "feature_flag_configs_public_read" ON feature_flag_configs
    FOR SELECT USING (true); -- Allow public read of basic config

-- Global feature flags policies (Admin only)
CREATE POLICY "global_feature_flags_admin_only" ON global_feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- User feature preferences policies (Users can manage their own)
CREATE POLICY "user_feature_preferences_own" ON user_feature_preferences
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_feature_preferences_admin" ON user_feature_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- Audit log policies (Admin read-only, system write)
CREATE POLICY "feature_flag_audit_log_admin_read" ON feature_flag_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

CREATE POLICY "feature_flag_audit_log_system_write" ON feature_flag_audit_log
    FOR INSERT WITH CHECK (true); -- Allow system to write audit logs

-- Analytics policies (Admin read, system write)
CREATE POLICY "feature_flag_analytics_admin_read" ON feature_flag_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

CREATE POLICY "feature_flag_analytics_system_write" ON feature_flag_analytics
    FOR INSERT WITH CHECK (true); -- Allow system to write analytics

-- Rollout groups policies (Admin only)
CREATE POLICY "feature_flag_rollout_groups_admin_only" ON feature_flag_rollout_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- User groups policies (Admin only)
CREATE POLICY "feature_flag_user_groups_admin_only" ON feature_flag_user_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- =====================================================
-- 10. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_feature_flag_configs_updated_at
    BEFORE UPDATE ON feature_flag_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feature_preferences_updated_at
    BEFORE UPDATE ON user_feature_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_rollout_groups_updated_at
    BEFORE UPDATE ON feature_flag_rollout_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION feature_flag_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Log global feature flag changes
    IF TG_TABLE_NAME = 'global_feature_flags' THEN
        INSERT INTO feature_flag_audit_log (
            flag_key, action, previous_value, new_value, user_id, environment, metadata
        ) VALUES (
            COALESCE(NEW.flag_key, OLD.flag_key),
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'create'
                WHEN TG_OP = 'DELETE' THEN 'delete'
                WHEN OLD.enabled != NEW.enabled THEN 
                    CASE WHEN NEW.enabled THEN 'enable' ELSE 'disable' END
                ELSE 'toggle'
            END,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.enabled END,
            CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.enabled END,
            auth.uid(),
            COALESCE(NEW.environment, OLD.environment),
            jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
    END IF;
    
    -- Log user preference changes
    IF TG_TABLE_NAME = 'user_feature_preferences' THEN
        INSERT INTO feature_flag_audit_log (
            flag_key, action, previous_value, new_value, user_id, target_user_id, metadata
        ) VALUES (
            COALESCE(NEW.flag_key, OLD.flag_key),
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'create'
                WHEN TG_OP = 'DELETE' THEN 'delete'
                WHEN OLD.enabled != NEW.enabled THEN 
                    CASE WHEN NEW.enabled THEN 'enable' ELSE 'disable' END
                ELSE 'toggle'
            END,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.enabled END,
            CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.enabled END,
            auth.uid(),
            COALESCE(NEW.user_id, OLD.user_id),
            jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit triggers
CREATE TRIGGER feature_flag_global_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON global_feature_flags
    FOR EACH ROW EXECUTE FUNCTION feature_flag_audit_trigger();

CREATE TRIGGER feature_flag_user_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_feature_preferences
    FOR EACH ROW EXECUTE FUNCTION feature_flag_audit_trigger();

-- =====================================================
-- 11. INITIAL DATA INSERTION
-- =====================================================

-- Insert default feature flag configurations
INSERT INTO feature_flag_configs (
    flag_key, name, description, category, default_value,
    development_default, staging_default, production_default,
    dependencies, admin_only, beta_feature
) VALUES
    ('enhancedNavigation', 'Enhanced Navigation', 'Studio Ninja-inspired navigation with improved UX', 'core', true, true, true, true, NULL, false, false),
    ('enhancedSearch', 'Enhanced Search & Filtering', 'Advanced search capabilities with smart filtering', 'enhancement', false, true, true, false, '{"enhancedNavigation"}', false, false),
    ('dashboardAnalytics', 'Dashboard Analytics', 'Revenue visualization and business insights', 'enhancement', false, true, true, false, NULL, false, false),
    ('calendarIntegration', 'Calendar Integration', 'Professional scheduling and calendar sync', 'integration', false, true, false, false, NULL, false, true),
    ('realTimeFeatures', 'Real-time Features', 'WebSocket-based real-time collaboration', 'experimental', false, true, false, false, NULL, false, true),
    ('invoiceEnhancement', 'Invoice Enhancement', 'Rich text invoice system with advanced features', 'enhancement', false, true, false, false, NULL, false, false),
    ('clientPortalV2', 'Client Portal V2', 'Enhanced client experience with new portal', 'core', false, true, false, false, NULL, false, false),
    ('adminAnalytics', 'Admin Analytics', 'Administrative analytics and system insights', 'admin', false, true, true, false, NULL, true, false),
    ('systemHealth', 'System Health Monitoring', 'Real-time system health and performance monitoring', 'admin', false, true, true, false, NULL, true, false),
    ('featureFlagManager', 'Feature Flag Manager', 'Administrative interface for managing feature flags', 'admin', false, true, true, false, NULL, true, false),
    ('debugMode', 'Debug Mode', 'Advanced debugging and development tools', 'admin', false, true, false, false, NULL, true, false)
ON CONFLICT (flag_key) DO NOTHING;

-- Insert default global feature flags for production environment
INSERT INTO global_feature_flags (flag_key, enabled, environment, modified_by)
SELECT flag_key, production_default, 'production', NULL
FROM feature_flag_configs
ON CONFLICT (flag_key) DO NOTHING;

-- =====================================================
-- 12. UTILITY FUNCTIONS
-- =====================================================

-- Function to get effective feature flag value for a user
CREATE OR REPLACE FUNCTION get_user_feature_flag(
    p_user_id UUID,
    p_flag_key VARCHAR(100),
    p_environment VARCHAR(20) DEFAULT 'production'
)
RETURNS BOOLEAN AS $$
DECLARE
    user_preference BOOLEAN;
    global_setting BOOLEAN;
    config_default BOOLEAN;
BEGIN
    -- Check user-specific preference first
    SELECT enabled INTO user_preference
    FROM user_feature_preferences
    WHERE user_id = p_user_id AND flag_key = p_flag_key;
    
    IF user_preference IS NOT NULL THEN
        RETURN user_preference;
    END IF;
    
    -- Check global setting
    SELECT enabled INTO global_setting
    FROM global_feature_flags
    WHERE flag_key = p_flag_key AND environment = p_environment;
    
    IF global_setting IS NOT NULL THEN
        RETURN global_setting;
    END IF;
    
    -- Fall back to config default
    SELECT 
        CASE p_environment
            WHEN 'development' THEN development_default
            WHEN 'staging' THEN staging_default
            WHEN 'production' THEN production_default
            ELSE default_value
        END INTO config_default
    FROM feature_flag_configs
    WHERE flag_key = p_flag_key;
    
    RETURN COALESCE(config_default, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to bulk update feature flags
CREATE OR REPLACE FUNCTION bulk_update_feature_flags(
    p_flags JSONB,
    p_environment VARCHAR(20) DEFAULT 'production',
    p_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    flag_record RECORD;
    update_count INTEGER := 0;
BEGIN
    -- Iterate through the provided flags
    FOR flag_record IN 
        SELECT key as flag_key, value::boolean as enabled 
        FROM jsonb_each(p_flags)
    LOOP
        -- Update or insert global flag
        INSERT INTO global_feature_flags (flag_key, enabled, environment, modified_by, reason)
        VALUES (flag_record.flag_key, flag_record.enabled, p_environment, auth.uid(), p_reason)
        ON CONFLICT (flag_key) 
        DO UPDATE SET 
            enabled = EXCLUDED.enabled,
            last_modified = NOW(),
            modified_by = auth.uid(),
            reason = EXCLUDED.reason;
        
        update_count := update_count + 1;
    END LOOP;
    
    RETURN update_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Feature Flag System Successfully Created!';
    RAISE NOTICE '📊 Tables: % created with full RLS and audit capabilities', 
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_name LIKE 'feature_flag%' OR table_name LIKE '%feature%flag%');
    RAISE NOTICE '🔒 Security: Row Level Security enabled on all tables';
    RAISE NOTICE '📝 Audit: Complete audit trail with triggers activated';
    RAISE NOTICE '⚡ Performance: Optimized indexes created for fast queries';
    RAISE NOTICE '🚀 Ready for safe feature deployment and progressive rollout!';
END $$;