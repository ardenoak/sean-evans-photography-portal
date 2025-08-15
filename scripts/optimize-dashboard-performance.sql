-- Dashboard Performance Optimization
-- 🔵 [DATABASE OPTIMIZATION] Adding indexes for dashboard queries

-- Performance monitoring functions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add composite indexes for dashboard queries
-- These indexes will significantly improve dashboard load times

-- Leads table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_dashboard_stats 
ON leads(status, created_at DESC) 
WHERE status IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_recent_activity 
ON leads(created_at DESC, status) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Sessions table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_dashboard_stats 
ON sessions(session_date, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_upcoming 
ON sessions(session_date) 
WHERE session_date >= CURRENT_DATE AND session_date <= CURRENT_DATE + INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_with_clients 
ON sessions(client_id, session_date DESC);

-- Clients table optimizations  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_dashboard_stats 
ON clients(created_at DESC, id);

-- Quotes table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_dashboard_stats 
ON quotes(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_recent_activity 
ON quotes(created_at DESC, status) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Contracts table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_dashboard_stats 
ON contracts(status, created_at DESC);

-- Payments table optimizations (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_dashboard_stats 
        ON payments(status, created_at DESC);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_pending 
        ON payments(status, amount) 
        WHERE status = 'pending';
    END IF;
END $$;

-- Create materialized view for dashboard summary (advanced optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_summary AS
SELECT 
    -- Counts
    (SELECT COUNT(*) FROM leads) as total_leads,
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM sessions) as total_sessions,
    (SELECT COUNT(*) FROM quotes) as total_quotes,
    (SELECT COUNT(*) FROM contracts) as total_contracts,
    
    -- Upcoming sessions (next 7 days)
    (SELECT COUNT(*) FROM sessions 
     WHERE session_date >= CURRENT_DATE 
     AND session_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming_sessions,
    
    -- Recent leads (last 5)
    (SELECT COUNT(*) FROM leads 
     WHERE created_at > NOW() - INTERVAL '7 days') as recent_leads_count,
    
    -- Conversion rate
    CASE 
        WHEN (SELECT COUNT(*) FROM quotes) > 0 THEN
            ROUND(((SELECT COUNT(*) FROM contracts)::DECIMAL / (SELECT COUNT(*) FROM quotes)) * 100, 2)
        ELSE 0
    END as conversion_rate,
    
    -- Last updated
    NOW() as last_updated
;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_updated 
ON dashboard_summary(last_updated);

-- Function to refresh dashboard summary
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard stats with caching
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
    last_refresh TIMESTAMP;
    cache_duration INTERVAL := '30 seconds';
BEGIN
    -- Check if materialized view needs refresh
    SELECT last_updated INTO last_refresh FROM dashboard_summary LIMIT 1;
    
    IF last_refresh IS NULL OR last_refresh < NOW() - cache_duration THEN
        PERFORM refresh_dashboard_summary();
    END IF;
    
    -- Return cached stats
    SELECT row_to_json(dashboard_summary) INTO result FROM dashboard_summary LIMIT 1;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add performance monitoring
CREATE OR REPLACE FUNCTION log_query_performance(
    query_name TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO query_performance_log (
        query_name, 
        execution_time_ms, 
        executed_at
    ) VALUES (
        query_name,
        EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        start_time
    );
END;
$$ LANGUAGE plpgsql;

-- Create performance log table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_name TEXT NOT NULL,
    execution_time_ms DECIMAL(10,3) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_performance_log_name_time 
ON query_performance_log(query_name, executed_at DESC);

-- Connection pooling optimization
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Query optimization settings
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET seq_page_cost = 1.0;
ALTER SYSTEM SET cpu_tuple_cost = 0.01;
ALTER SYSTEM SET cpu_index_tuple_cost = 0.005;
ALTER SYSTEM SET cpu_operator_cost = 0.0025;

-- Enable query plan analysis
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_functions = all;
ALTER SYSTEM SET track_io_timing = on;

-- Log slow queries (queries taking longer than 100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_duration = off;

COMMENT ON MATERIALIZED VIEW dashboard_summary IS 'Cached dashboard statistics for improved performance';
COMMENT ON FUNCTION get_dashboard_stats() IS 'Returns dashboard stats with intelligent caching';
COMMENT ON FUNCTION refresh_dashboard_summary() IS 'Refreshes cached dashboard statistics';

SELECT '🔵 [DATABASE] Dashboard performance optimizations applied successfully!' as result;