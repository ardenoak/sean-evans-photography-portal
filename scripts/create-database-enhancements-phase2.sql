-- DATABASE SCHEMA ENHANCEMENTS - PHASE 2
-- Analytics & Business Intelligence Foundation
-- Run this in Supabase SQL Editor AFTER Phase 1
-- ZERO DOWNTIME: All changes are additive only

-- =============================================================================
-- PHASE 2: ANALYTICS & BUSINESS INTELLIGENCE
-- =============================================================================

-- 1. DAILY BUSINESS METRICS AGGREGATION
-- ----------------------------------------------------------------------------

-- Daily business metrics for dashboard performance
CREATE TABLE IF NOT EXISTS daily_business_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE NOT NULL,
    
    -- Lead metrics
    total_leads INTEGER DEFAULT 0,
    new_leads INTEGER DEFAULT 0,
    converted_leads INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    lost_leads INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    pending_revenue DECIMAL(12,2) DEFAULT 0,
    completed_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Session metrics
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    upcoming_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    
    -- Gallery metrics
    gallery_views INTEGER DEFAULT 0,
    gallery_downloads INTEGER DEFAULT 0,
    images_favorited INTEGER DEFAULT 0,
    
    -- Client metrics
    new_clients INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    total_clients INTEGER DEFAULT 0,
    
    -- Operational metrics
    quotes_sent INTEGER DEFAULT 0,
    contracts_signed INTEGER DEFAULT 0,
    payments_received INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date)
);

-- Indexes for business metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_business_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_revenue ON daily_business_metrics(total_revenue);

-- Enable RLS on business metrics
ALTER TABLE daily_business_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins with analytics permission can view
CREATE POLICY "Admins with analytics permission can view metrics" ON daily_business_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true 
            AND can_view_analytics = true
        )
    );

-- 2. LEAD SOURCE PERFORMANCE ANALYTICS
-- ----------------------------------------------------------------------------

-- Lead source performance tracking
CREATE TABLE IF NOT EXISTS lead_source_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Performance metrics
    lead_count INTEGER DEFAULT 0,
    qualified_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    avg_deal_size DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    qualification_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Time metrics
    avg_days_to_conversion DECIMAL(5,1) DEFAULT 0,
    avg_days_to_qualification DECIMAL(5,1) DEFAULT 0,
    
    -- Cost metrics (for paid sources)
    cost_per_lead DECIMAL(10,2) DEFAULT 0,
    cost_per_conversion DECIMAL(10,2) DEFAULT 0,
    return_on_investment DECIMAL(7,2) DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(source, period_start, period_end)
);

-- Indexes for lead source analytics
CREATE INDEX IF NOT EXISTS idx_lead_source_analytics_source ON lead_source_analytics(source);
CREATE INDEX IF NOT EXISTS idx_lead_source_analytics_period ON lead_source_analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_lead_source_analytics_conversion ON lead_source_analytics(conversion_rate);

-- Enable RLS on lead source analytics
ALTER TABLE lead_source_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins with analytics permission
CREATE POLICY "Admins can view lead source analytics" ON lead_source_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true 
            AND can_view_analytics = true
        )
    );

-- 3. CLIENT LIFECYCLE ANALYTICS
-- ----------------------------------------------------------------------------

-- Client lifecycle metrics for retention analysis
CREATE TABLE IF NOT EXISTS client_lifecycle_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID, -- References clients(id) when available
    client_email TEXT NOT NULL,
    
    -- Timeline metrics
    first_contact_date DATE,
    first_session_date DATE,
    last_session_date DATE,
    last_interaction_date DATE,
    
    -- Session metrics
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    
    -- Financial metrics
    total_spent DECIMAL(12,2) DEFAULT 0,
    avg_session_value DECIMAL(10,2) DEFAULT 0,
    highest_session_value DECIMAL(10,2) DEFAULT 0,
    pending_value DECIMAL(10,2) DEFAULT 0,
    
    -- Engagement metrics
    gallery_views INTEGER DEFAULT 0,
    images_favorited INTEGER DEFAULT 0,
    documents_downloaded INTEGER DEFAULT 0,
    support_interactions INTEGER DEFAULT 0,
    
    -- Lifecycle calculations
    client_lifetime_days INTEGER,
    days_since_last_session INTEGER,
    predicted_churn_risk DECIMAL(5,2) DEFAULT 0,
    
    -- Status classification
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'at_risk', 'churned', 'vip')),
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'standard')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_email)
);

-- Indexes for client lifecycle
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_email ON client_lifecycle_metrics(client_email);
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_status ON client_lifecycle_metrics(status);
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_tier ON client_lifecycle_metrics(tier);
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_value ON client_lifecycle_metrics(total_spent);
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_last_session ON client_lifecycle_metrics(last_session_date);

-- Enable RLS on client lifecycle
ALTER TABLE client_lifecycle_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and clients can view their own data
CREATE POLICY "Admins and clients can view lifecycle data" ON client_lifecycle_metrics
    FOR SELECT USING (
        client_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- 4. REVENUE ANALYTICS
-- ----------------------------------------------------------------------------

-- Revenue breakdown by service type and time period
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    granularity TEXT NOT NULL CHECK (granularity IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Service breakdown
    service_type TEXT, -- NULL for overall totals
    package_type TEXT,
    
    -- Revenue metrics
    gross_revenue DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) DEFAULT 0,
    fees_paid DECIMAL(12,2) DEFAULT 0,
    refunds_issued DECIMAL(12,2) DEFAULT 0,
    
    -- Volume metrics
    sessions_completed INTEGER DEFAULT 0,
    quotes_accepted INTEGER DEFAULT 0,
    contracts_signed INTEGER DEFAULT 0,
    
    -- Averages
    avg_session_value DECIMAL(10,2) DEFAULT 0,
    avg_quote_value DECIMAL(10,2) DEFAULT 0,
    
    -- Growth metrics
    revenue_growth_percentage DECIMAL(7,2) DEFAULT 0,
    session_growth_percentage DECIMAL(7,2) DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_start, period_end, granularity, COALESCE(service_type, 'overall'), COALESCE(package_type, 'all'))
);

-- Indexes for revenue analytics
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_period ON revenue_analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_service ON revenue_analytics(service_type, package_type);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_granularity ON revenue_analytics(granularity);

-- Enable RLS on revenue analytics
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins with analytics permission
CREATE POLICY "Admins can view revenue analytics" ON revenue_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true 
            AND can_view_analytics = true
        )
    );

-- 5. SESSION PERFORMANCE ANALYTICS
-- ----------------------------------------------------------------------------

-- Session performance and outcome tracking
CREATE TABLE IF NOT EXISTS session_performance_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID, -- References sessions(id) when available
    
    -- Session details
    session_type TEXT,
    session_date DATE,
    duration_hours DECIMAL(4,2),
    
    -- Performance metrics
    images_delivered INTEGER DEFAULT 0,
    images_favorited INTEGER DEFAULT 0,
    client_satisfaction_score DECIMAL(3,1), -- 1-10 scale
    
    -- Gallery metrics
    gallery_ready_days INTEGER, -- Days from session to gallery ready
    gallery_views INTEGER DEFAULT 0,
    gallery_downloads INTEGER DEFAULT 0,
    
    -- Financial metrics
    session_value DECIMAL(10,2),
    additional_purchases DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2),
    
    -- Follow-up metrics
    follow_up_bookings INTEGER DEFAULT 0,
    referrals_generated INTEGER DEFAULT 0,
    
    -- Operational metrics
    setup_time_minutes INTEGER,
    post_processing_hours DECIMAL(4,1),
    delivery_time_days INTEGER,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for session performance
CREATE INDEX IF NOT EXISTS idx_session_performance_type ON session_performance_analytics(session_type);
CREATE INDEX IF NOT EXISTS idx_session_performance_date ON session_performance_analytics(session_date);
CREATE INDEX IF NOT EXISTS idx_session_performance_satisfaction ON session_performance_analytics(client_satisfaction_score);

-- Enable RLS on session performance
ALTER TABLE session_performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all session performance data
CREATE POLICY "Admins can view session performance" ON session_performance_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true 
            AND can_view_analytics = true
        )
    );

-- 6. ANALYTICS AUTOMATION FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to calculate daily business metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    metrics_record daily_business_metrics%ROWTYPE;
BEGIN
    -- Initialize metrics record
    metrics_record.metric_date := target_date;
    
    -- Calculate lead metrics
    SELECT 
        COUNT(*) FILTER (WHERE created_at::date = target_date),
        COUNT(*) FILTER (WHERE status = 'converted' AND conversion_date::date = target_date),
        COUNT(*) FILTER (WHERE status = 'qualified' AND updated_at::date = target_date),
        COUNT(*) FILTER (WHERE status = 'lost' AND updated_at::date = target_date)
    INTO 
        metrics_record.new_leads,
        metrics_record.converted_leads,
        metrics_record.qualified_leads,
        metrics_record.lost_leads
    FROM leads;
    
    -- Calculate total leads
    SELECT COUNT(*) INTO metrics_record.total_leads FROM leads;
    
    -- Calculate revenue metrics (if quotes/payments tables exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') THEN
        SELECT 
            COALESCE(SUM(total_amount) FILTER (WHERE accepted_at::date = target_date), 0),
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'sent'), 0)
        INTO 
            metrics_record.completed_revenue,
            metrics_record.pending_revenue
        FROM quotes;
        
        metrics_record.total_revenue := metrics_record.completed_revenue + metrics_record.pending_revenue;
    END IF;
    
    -- Calculate session metrics (if sessions table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        SELECT 
            COUNT(*) FILTER (WHERE session_date = target_date),
            COUNT(*) FILTER (WHERE status = 'completed' AND session_date = target_date),
            COUNT(*) FILTER (WHERE session_date > target_date AND session_date <= target_date + INTERVAL '7 days'),
            COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at::date = target_date)
        INTO 
            metrics_record.total_sessions,
            metrics_record.completed_sessions,
            metrics_record.upcoming_sessions,
            metrics_record.cancelled_sessions
        FROM sessions;
    END IF;
    
    -- Calculate gallery metrics
    SELECT 
        COUNT(*) FILTER (WHERE accessed_at::date = target_date AND access_type = 'view'),
        COUNT(*) FILTER (WHERE accessed_at::date = target_date AND access_type = 'download'),
        COUNT(*) FILTER (WHERE accessed_at::date = target_date AND access_type = 'favorite')
    INTO 
        metrics_record.gallery_views,
        metrics_record.gallery_downloads,
        metrics_record.images_favorited
    FROM gallery_access_log;
    
    -- Calculate client metrics (if clients table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        SELECT 
            COUNT(*) FILTER (WHERE created_at::date = target_date),
            COUNT(*)
        INTO 
            metrics_record.new_clients,
            metrics_record.total_clients
        FROM clients;
    END IF;
    
    -- Insert or update metrics
    INSERT INTO daily_business_metrics 
    VALUES (metrics_record.*)
    ON CONFLICT (metric_date) 
    DO UPDATE SET
        total_leads = EXCLUDED.total_leads,
        new_leads = EXCLUDED.new_leads,
        converted_leads = EXCLUDED.converted_leads,
        qualified_leads = EXCLUDED.qualified_leads,
        lost_leads = EXCLUDED.lost_leads,
        total_revenue = EXCLUDED.total_revenue,
        pending_revenue = EXCLUDED.pending_revenue,
        completed_revenue = EXCLUDED.completed_revenue,
        total_sessions = EXCLUDED.total_sessions,
        completed_sessions = EXCLUDED.completed_sessions,
        upcoming_sessions = EXCLUDED.upcoming_sessions,
        cancelled_sessions = EXCLUDED.cancelled_sessions,
        gallery_views = EXCLUDED.gallery_views,
        gallery_downloads = EXCLUDED.gallery_downloads,
        images_favorited = EXCLUDED.images_favorited,
        new_clients = EXCLUDED.new_clients,
        total_clients = EXCLUDED.total_clients,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update client lifecycle metrics
CREATE OR REPLACE FUNCTION update_client_lifecycle_metrics(target_email TEXT)
RETURNS VOID AS $$
DECLARE
    lifecycle_record client_lifecycle_metrics%ROWTYPE;
    client_sessions_count INTEGER;
    days_since_last INTEGER;
BEGIN
    -- Initialize with email
    lifecycle_record.client_email := target_email;
    
    -- Get client ID if clients table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        SELECT id INTO lifecycle_record.client_id 
        FROM clients WHERE email = target_email;
    END IF;
    
    -- Calculate timeline metrics from leads
    SELECT 
        MIN(created_at::date),
        COUNT(*)
    INTO 
        lifecycle_record.first_contact_date,
        lifecycle_record.support_interactions
    FROM leads 
    WHERE email = target_email;
    
    -- Calculate session metrics if sessions table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        SELECT 
            MIN(session_date),
            MAX(session_date),
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'completed'),
            COUNT(*) FILTER (WHERE status = 'cancelled'),
            COALESCE(SUM(CAST(regexp_replace(investment, '[^0-9.]', '', 'g') AS DECIMAL)), 0),
            COALESCE(AVG(CAST(regexp_replace(investment, '[^0-9.]', '', 'g') AS DECIMAL)), 0),
            COALESCE(MAX(CAST(regexp_replace(investment, '[^0-9.]', '', 'g') AS DECIMAL)), 0)
        INTO 
            lifecycle_record.first_session_date,
            lifecycle_record.last_session_date,
            lifecycle_record.total_sessions,
            lifecycle_record.completed_sessions,
            lifecycle_record.cancelled_sessions,
            lifecycle_record.total_spent,
            lifecycle_record.avg_session_value,
            lifecycle_record.highest_session_value
        FROM sessions s
        JOIN clients c ON s.client_id = c.id
        WHERE c.email = target_email;
    END IF;
    
    -- Calculate gallery metrics if client has sessions
    IF lifecycle_record.client_id IS NOT NULL THEN
        SELECT 
            COUNT(*) FILTER (WHERE access_type = 'view'),
            COUNT(*) FILTER (WHERE access_type = 'favorite')
        INTO 
            lifecycle_record.gallery_views,
            lifecycle_record.images_favorited
        FROM gallery_access_log gal
        WHERE gal.client_id = lifecycle_record.client_id;
    END IF;
    
    -- Calculate lifecycle days
    IF lifecycle_record.first_contact_date IS NOT NULL THEN
        lifecycle_record.client_lifetime_days := CURRENT_DATE - lifecycle_record.first_contact_date;
    END IF;
    
    -- Calculate days since last session
    IF lifecycle_record.last_session_date IS NOT NULL THEN
        lifecycle_record.days_since_last_session := CURRENT_DATE - lifecycle_record.last_session_date;
        days_since_last := lifecycle_record.days_since_last_session;
    END IF;
    
    -- Determine status based on activity
    IF lifecycle_record.total_sessions = 0 THEN
        lifecycle_record.status := 'active'; -- New lead
    ELSIF days_since_last IS NULL OR days_since_last <= 90 THEN
        lifecycle_record.status := 'active';
    ELSIF days_since_last <= 365 THEN
        lifecycle_record.status := 'dormant';
    ELSIF days_since_last <= 730 THEN
        lifecycle_record.status := 'at_risk';
    ELSE
        lifecycle_record.status := 'churned';
    END IF;
    
    -- Determine tier based on total spent
    IF lifecycle_record.total_spent >= 5000 THEN
        lifecycle_record.tier := 'platinum';
    ELSIF lifecycle_record.total_spent >= 3000 THEN
        lifecycle_record.tier := 'gold';
    ELSIF lifecycle_record.total_spent >= 1500 THEN
        lifecycle_record.tier := 'silver';
    ELSIF lifecycle_record.total_spent >= 500 THEN
        lifecycle_record.tier := 'bronze';
    ELSE
        lifecycle_record.tier := 'standard';
    END IF;
    
    -- Insert or update lifecycle metrics
    INSERT INTO client_lifecycle_metrics 
    VALUES (lifecycle_record.*)
    ON CONFLICT (client_email) 
    DO UPDATE SET
        client_id = EXCLUDED.client_id,
        first_contact_date = EXCLUDED.first_contact_date,
        first_session_date = EXCLUDED.first_session_date,
        last_session_date = EXCLUDED.last_session_date,
        total_sessions = EXCLUDED.total_sessions,
        completed_sessions = EXCLUDED.completed_sessions,
        cancelled_sessions = EXCLUDED.cancelled_sessions,
        total_spent = EXCLUDED.total_spent,
        avg_session_value = EXCLUDED.avg_session_value,
        highest_session_value = EXCLUDED.highest_session_value,
        gallery_views = EXCLUDED.gallery_views,
        images_favorited = EXCLUDED.images_favorited,
        client_lifetime_days = EXCLUDED.client_lifetime_days,
        days_since_last_session = EXCLUDED.days_since_last_session,
        status = EXCLUDED.status,
        tier = EXCLUDED.tier,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. MATERIALIZED VIEWS FOR PERFORMANCE
-- ----------------------------------------------------------------------------

-- High-level dashboard metrics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_summary_view AS
SELECT 
    -- Current totals
    (SELECT COUNT(*) FROM leads) as total_leads,
    (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_last_30_days,
    (SELECT COUNT(*) FROM leads WHERE status = 'converted') as converted_leads,
    
    -- Revenue metrics
    (SELECT COALESCE(SUM(total_amount), 0) FROM quotes WHERE status = 'accepted') as total_revenue,
    (SELECT COALESCE(SUM(total_amount), 0) FROM quotes WHERE accepted_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_last_30_days,
    
    -- Session metrics
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') 
         THEN (SELECT COUNT(*) FROM sessions)
         ELSE 0 END as total_sessions,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') 
         THEN (SELECT COUNT(*) FROM sessions WHERE session_date >= CURRENT_DATE AND session_date <= CURRENT_DATE + INTERVAL '7 days')
         ELSE 0 END as upcoming_sessions,
    
    -- Client metrics
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') 
         THEN (SELECT COUNT(*) FROM clients)
         ELSE 0 END as total_clients,
    
    -- Activity metrics
    (SELECT COUNT(*) FROM gallery_access_log WHERE accessed_at >= CURRENT_DATE - INTERVAL '7 days') as gallery_views_week,
    
    -- Update timestamp
    NOW() as last_updated;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_updated ON dashboard_summary_view(last_updated);

-- 8. AUTOMATED REFRESH FUNCTION
-- ----------------------------------------------------------------------------

-- Function to refresh analytics data
CREATE OR REPLACE FUNCTION refresh_analytics_data()
RETURNS VOID AS $$
BEGIN
    -- Refresh daily metrics for yesterday and today
    PERFORM calculate_daily_metrics(CURRENT_DATE - 1);
    PERFORM calculate_daily_metrics(CURRENT_DATE);
    
    -- Refresh client lifecycle metrics for recently active clients
    PERFORM update_client_lifecycle_metrics(email)
    FROM leads 
    WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY email;
    
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW dashboard_summary_view;
    
    -- Log the refresh
    INSERT INTO audit_log (table_name, record_id, action, user_email, timestamp, metadata)
    VALUES ('analytics_refresh', gen_random_uuid(), 'UPDATE', 'system', NOW(), '{"type": "automated_refresh"}'::jsonb);
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. SUCCESS MESSAGE
-- ----------------------------------------------------------------------------

SELECT 'DATABASE ENHANCEMENTS PHASE 2 COMPLETED SUCCESSFULLY!' as message,
       'Analytics tables, metrics calculation, and performance views installed' as details,
       'Next: Run Phase 3 for search optimization and advanced features' as next_step;