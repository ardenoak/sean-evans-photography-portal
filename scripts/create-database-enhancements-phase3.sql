-- DATABASE SCHEMA ENHANCEMENTS - PHASE 3
-- Advanced Search & Performance Optimization
-- Run this in Supabase SQL Editor AFTER Phase 2
-- ZERO DOWNTIME: All changes are additive only

-- =============================================================================
-- PHASE 3: SEARCH OPTIMIZATION & ADVANCED FEATURES
-- =============================================================================

-- 1. FULL-TEXT SEARCH ENHANCEMENT
-- ----------------------------------------------------------------------------

-- Add search vectors to existing tables for full-text search
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE lead_interactions ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add search vectors to other tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_vector tsvector;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS search_vector tsvector;
    END IF;
END $$;

-- Add search vectors to quotes and contracts
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes for full-text search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_search_vector ON leads USING gin(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_interactions_search ON lead_interactions USING gin(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_search_vector ON quotes USING gin(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_search_vector ON contracts USING gin(search_vector);

-- Create conditional indexes for other tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search_vector ON clients USING gin(search_vector)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_search_vector ON sessions USING gin(search_vector)';
    END IF;
END $$;

-- 2. SAVED SEARCHES & FILTERS
-- ----------------------------------------------------------------------------

-- Saved search filters for admin users
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    search_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('leads', 'clients', 'sessions', 'quotes', 'contracts', 'global')),
    search_criteria JSONB NOT NULL,
    
    -- Search configuration
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with TEXT[], -- Array of admin emails
    
    -- Performance settings
    result_limit INTEGER DEFAULT 100,
    sort_field TEXT,
    sort_direction TEXT DEFAULT 'desc' CHECK (sort_direction IN ('asc', 'desc')),
    
    -- Usage tracking
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(admin_email, search_name, entity_type)
);

-- Indexes for saved searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_admin ON saved_searches(admin_email);
CREATE INDEX IF NOT EXISTS idx_saved_searches_entity ON saved_searches(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_searches_shared ON saved_searches USING gin(shared_with);

-- Enable RLS on saved searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own searches and view shared ones
CREATE POLICY "Users can manage own searches and view shared" ON saved_searches
    FOR ALL USING (
        admin_email = auth.jwt() ->> 'email'
        OR (is_shared = true AND auth.jwt() ->> 'email' = ANY(shared_with))
        OR EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'super_admin'
            AND is_active = true
        )
    );

-- 3. SEARCH RESULTS CACHE
-- ----------------------------------------------------------------------------

-- Global search results cache for complex queries
CREATE TABLE IF NOT EXISTS search_results_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_hash TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Relevance and matching
    relevance_score DECIMAL(5,3) DEFAULT 0,
    matched_fields TEXT[],
    match_context TEXT, -- Snippet of matched text
    
    -- Search metadata
    search_query TEXT,
    search_filters JSONB,
    total_results INTEGER,
    result_position INTEGER,
    
    -- Cache management
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    accessed_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for search cache
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_results_cache(search_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_admin ON search_results_cache(admin_email);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_results_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_entity ON search_results_cache(entity_type, entity_id);

-- Enable RLS on search cache
ALTER TABLE search_results_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own cached results
CREATE POLICY "Users see own search cache" ON search_results_cache
    FOR ALL USING (admin_email = auth.jwt() ->> 'email');

-- 4. ADVANCED CALENDAR & SCHEDULING
-- ----------------------------------------------------------------------------

-- Session availability and scheduling optimization
CREATE TABLE IF NOT EXISTS session_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    availability_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability status
    is_available BOOLEAN DEFAULT TRUE,
    booking_type TEXT DEFAULT 'available' CHECK (booking_type IN ('available', 'booked', 'blocked', 'travel', 'personal')),
    
    -- Linked session
    session_id UUID, -- References sessions(id) when booked
    
    -- Capacity and resources
    max_sessions INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    
    -- Location and requirements
    location TEXT,
    required_equipment TEXT[],
    required_assistants INTEGER DEFAULT 0,
    
    -- Pricing modifiers
    price_modifier DECIMAL(5,2) DEFAULT 1.0, -- Multiplier for pricing (e.g., 1.5 for weekend premium)
    
    -- Notes and constraints
    notes TEXT,
    weather_dependent BOOLEAN DEFAULT FALSE,
    indoor_backup_available BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for availability
CREATE INDEX IF NOT EXISTS idx_availability_date ON session_availability(availability_date);
CREATE INDEX IF NOT EXISTS idx_availability_status ON session_availability(is_available, booking_type);
CREATE INDEX IF NOT EXISTS idx_availability_session ON session_availability(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_unique ON session_availability(availability_date, start_time, end_time);

-- Resource allocation tracking
CREATE TABLE IF NOT EXISTS session_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID, -- References sessions(id)
    availability_id UUID REFERENCES session_availability(id),
    
    -- Resource details
    resource_type TEXT NOT NULL CHECK (resource_type IN ('equipment', 'location', 'assistant', 'vehicle', 'studio')),
    resource_name TEXT NOT NULL,
    resource_description TEXT,
    
    -- Allocation details
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints and requirements
    setup_time_minutes INTEGER DEFAULT 0,
    breakdown_time_minutes INTEGER DEFAULT 0,
    is_critical BOOLEAN DEFAULT FALSE, -- Cannot proceed without this resource
    
    -- Cost tracking
    cost_per_hour DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    
    -- Notes and status
    notes TEXT,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'unavailable', 'cancelled')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for resource allocation
CREATE INDEX IF NOT EXISTS idx_session_resources_session ON session_resources(session_id);
CREATE INDEX IF NOT EXISTS idx_session_resources_availability ON session_resources(availability_id);
CREATE INDEX IF NOT EXISTS idx_session_resources_type ON session_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_session_resources_status ON session_resources(status);

-- Session conflict detection
CREATE TABLE IF NOT EXISTS scheduling_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id_1 UUID, -- References sessions(id)
    session_id_2 UUID, -- References sessions(id)
    availability_id_1 UUID REFERENCES session_availability(id),
    availability_id_2 UUID REFERENCES session_availability(id),
    
    -- Conflict details
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('time_overlap', 'resource_conflict', 'travel_time', 'equipment_conflict', 'location_conflict')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Conflict description
    description TEXT,
    auto_detected BOOLEAN DEFAULT TRUE,
    
    -- Resolution tracking
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_method TEXT, -- 'reschedule', 'resource_change', 'cancellation', 'accept_risk'
    resolution_notes TEXT,
    resolved_by TEXT,
    
    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conflict detection
CREATE INDEX IF NOT EXISTS idx_conflicts_sessions ON scheduling_conflicts(session_id_1, session_id_2);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON scheduling_conflicts(severity, resolved);
CREATE INDEX IF NOT EXISTS idx_conflicts_type ON scheduling_conflicts(conflict_type);
CREATE INDEX IF NOT EXISTS idx_conflicts_detected ON scheduling_conflicts(detected_at);

-- Enable RLS on scheduling tables
ALTER TABLE session_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_conflicts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduling
CREATE POLICY "Admins can manage availability" ON session_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage resources" ON session_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

CREATE POLICY "Admins can view conflicts" ON scheduling_conflicts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- 5. SEARCH VECTOR UPDATE FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to update search vectors for leads
CREATE OR REPLACE FUNCTION update_leads_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.first_name, '') || ' ' ||
        COALESCE(NEW.last_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.session_type_interest, '') || ' ' ||
        COALESCE(NEW.lead_source, '') || ' ' ||
        COALESCE(NEW.message, '') || ' ' ||
        COALESCE(NEW.notes, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for quotes
CREATE OR REPLACE FUNCTION update_quotes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.quote_number, '') || ' ' ||
        COALESCE(NEW.client_name, '') || ' ' ||
        COALESCE(NEW.client_email, '') || ' ' ||
        COALESCE(NEW.selected_package, '') || ' ' ||
        COALESCE(array_to_string(NEW.selected_addons, ' '), '') || ' ' ||
        COALESCE(NEW.special_notes, '') || ' ' ||
        COALESCE(NEW.terms_and_conditions, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for lead interactions
CREATE OR REPLACE FUNCTION update_lead_interactions_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.interaction_type, '') || ' ' ||
        COALESCE(NEW.subject, '') || ' ' ||
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(NEW.outcome, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for contracts
CREATE OR REPLACE FUNCTION update_contracts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.contract_number, '') || ' ' ||
        COALESCE(NEW.terms, '') || ' ' ||
        COALESCE(NEW.payment_terms, '') || ' ' ||
        COALESCE(NEW.cancellation_policy, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditional functions for other tables
DO $$ 
BEGIN
    -- Function for clients table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION update_clients_search_vector()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.search_vector := to_tsvector(''english'', 
                COALESCE(NEW.first_name, '''') || '' '' ||
                COALESCE(NEW.last_name, '''') || '' '' ||
                COALESCE(NEW.email, '''') || '' '' ||
                COALESCE(NEW.phone, '''') || '' '' ||
                COALESCE(NEW.notes, '''')
            );
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql';
    END IF;
    
    -- Function for sessions table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION update_sessions_search_vector()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.search_vector := to_tsvector(''english'', 
                COALESCE(NEW.session_type, '''') || '' '' ||
                COALESCE(NEW.session_title, '''') || '' '' ||
                COALESCE(NEW.location, '''') || '' '' ||
                COALESCE(NEW.photographer, '''') || '' '' ||
                COALESCE(NEW.status, '''')
            );
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql';
    END IF;
END $$;

-- 6. APPLY SEARCH VECTOR TRIGGERS
-- ----------------------------------------------------------------------------

-- Apply triggers to update search vectors
DROP TRIGGER IF EXISTS update_leads_search_trigger ON leads;
CREATE TRIGGER update_leads_search_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_leads_search_vector();

DROP TRIGGER IF EXISTS update_quotes_search_trigger ON quotes;
CREATE TRIGGER update_quotes_search_trigger
    BEFORE INSERT OR UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_quotes_search_vector();

DROP TRIGGER IF EXISTS update_lead_interactions_search_trigger ON lead_interactions;
CREATE TRIGGER update_lead_interactions_search_trigger
    BEFORE INSERT OR UPDATE ON lead_interactions
    FOR EACH ROW EXECUTE FUNCTION update_lead_interactions_search_vector();

DROP TRIGGER IF EXISTS update_contracts_search_trigger ON contracts;
CREATE TRIGGER update_contracts_search_trigger
    BEFORE INSERT OR UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_contracts_search_vector();

-- Apply conditional triggers
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_clients_search_trigger ON clients';
        EXECUTE 'CREATE TRIGGER update_clients_search_trigger
            BEFORE INSERT OR UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION update_clients_search_vector()';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_sessions_search_trigger ON sessions';
        EXECUTE 'CREATE TRIGGER update_sessions_search_trigger
            BEFORE INSERT OR UPDATE ON sessions
            FOR EACH ROW EXECUTE FUNCTION update_sessions_search_vector()';
    END IF;
END $$;

-- 7. SEARCH UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Global search function across all entities
CREATE OR REPLACE FUNCTION global_search(
    search_query TEXT,
    admin_email TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    title TEXT,
    subtitle TEXT,
    relevance DECIMAL(5,3),
    matched_fields TEXT[],
    context TEXT
) AS $$
BEGIN
    -- Clear expired cache entries
    DELETE FROM search_results_cache WHERE expires_at < NOW();
    
    -- Search leads
    RETURN QUERY
    SELECT 
        'lead'::TEXT as entity_type,
        l.id as entity_id,
        (l.first_name || ' ' || l.last_name) as title,
        l.email as subtitle,
        ts_rank_cd(l.search_vector, plainto_tsquery('english', search_query)) as relevance,
        ARRAY['name', 'email']::TEXT[] as matched_fields,
        substring(l.message, 1, 100) as context
    FROM leads l
    WHERE l.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_cd(l.search_vector, plainto_tsquery('english', search_query)) DESC
    LIMIT result_limit / 4;
    
    -- Search quotes
    RETURN QUERY
    SELECT 
        'quote'::TEXT as entity_type,
        q.id as entity_id,
        q.quote_number as title,
        q.client_name as subtitle,
        ts_rank_cd(q.search_vector, plainto_tsquery('english', search_query)) as relevance,
        ARRAY['quote_number', 'client']::TEXT[] as matched_fields,
        substring(q.special_notes, 1, 100) as context
    FROM quotes q
    WHERE q.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_cd(q.search_vector, plainto_tsquery('english', search_query)) DESC
    LIMIT result_limit / 4;
    
    -- Search clients if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        RETURN QUERY
        EXECUTE format('
            SELECT 
                ''client''::TEXT as entity_type,
                c.id as entity_id,
                (c.first_name || '' '' || c.last_name) as title,
                c.email as subtitle,
                ts_rank_cd(c.search_vector, plainto_tsquery(''english'', %L)) as relevance,
                ARRAY[''name'', ''email'']::TEXT[] as matched_fields,
                substring(COALESCE(c.notes, ''''), 1, 100) as context
            FROM clients c
            WHERE c.search_vector @@ plainto_tsquery(''english'', %L)
            ORDER BY ts_rank_cd(c.search_vector, plainto_tsquery(''english'', %L)) DESC
            LIMIT %s', search_query, search_query, search_query, result_limit / 4);
    END IF;
    
    -- Search sessions if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        RETURN QUERY
        EXECUTE format('
            SELECT 
                ''session''::TEXT as entity_type,
                s.id as entity_id,
                COALESCE(s.session_title, s.session_type) as title,
                s.location as subtitle,
                ts_rank_cd(s.search_vector, plainto_tsquery(''english'', %L)) as relevance,
                ARRAY[''title'', ''location'']::TEXT[] as matched_fields,
                s.session_date::TEXT as context
            FROM sessions s
            WHERE s.search_vector @@ plainto_tsquery(''english'', %L)
            ORDER BY ts_rank_cd(s.search_vector, plainto_tsquery(''english'', %L)) DESC
            LIMIT %s', search_query, search_query, search_query, result_limit / 4);
    END IF;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Advanced search with filters
CREATE OR REPLACE FUNCTION advanced_search(
    search_criteria JSONB,
    admin_email TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    entity_data JSONB,
    relevance DECIMAL(5,3)
) AS $$
DECLARE
    search_text TEXT;
    entity_filter TEXT;
    date_from DATE;
    date_to DATE;
    status_filter TEXT;
BEGIN
    -- Extract search parameters
    search_text := search_criteria->>'query';
    entity_filter := search_criteria->>'entity_type';
    date_from := (search_criteria->>'date_from')::DATE;
    date_to := (search_criteria->>'date_to')::DATE;
    status_filter := search_criteria->>'status';
    
    -- Search based on entity filter
    IF entity_filter IS NULL OR entity_filter = 'leads' THEN
        RETURN QUERY
        SELECT 
            'lead'::TEXT,
            l.id,
            row_to_json(l)::JSONB,
            CASE 
                WHEN search_text IS NOT NULL 
                THEN ts_rank_cd(l.search_vector, plainto_tsquery('english', search_text))
                ELSE 1.0
            END as relevance
        FROM leads l
        WHERE (search_text IS NULL OR l.search_vector @@ plainto_tsquery('english', search_text))
        AND (date_from IS NULL OR l.created_at::date >= date_from)
        AND (date_to IS NULL OR l.created_at::date <= date_to)
        AND (status_filter IS NULL OR l.status = status_filter)
        ORDER BY relevance DESC
        LIMIT result_limit;
    END IF;
    
    IF entity_filter IS NULL OR entity_filter = 'quotes' THEN
        RETURN QUERY
        SELECT 
            'quote'::TEXT,
            q.id,
            row_to_json(q)::JSONB,
            CASE 
                WHEN search_text IS NOT NULL 
                THEN ts_rank_cd(q.search_vector, plainto_tsquery('english', search_text))
                ELSE 1.0
            END as relevance
        FROM quotes q
        WHERE (search_text IS NULL OR q.search_vector @@ plainto_tsquery('english', search_text))
        AND (date_from IS NULL OR q.created_at::date >= date_from)
        AND (date_to IS NULL OR q.created_at::date <= date_to)
        AND (status_filter IS NULL OR q.status = status_filter)
        ORDER BY relevance DESC
        LIMIT result_limit;
    END IF;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. POPULATE EXISTING SEARCH VECTORS
-- ----------------------------------------------------------------------------

-- Update search vectors for existing records
UPDATE leads SET search_vector = to_tsvector('english', 
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '') || ' ' ||
    COALESCE(session_type_interest, '') || ' ' ||
    COALESCE(lead_source, '') || ' ' ||
    COALESCE(message, '') || ' ' ||
    COALESCE(notes, '') || ' ' ||
    COALESCE(array_to_string(tags, ' '), '')
);

UPDATE quotes SET search_vector = to_tsvector('english', 
    COALESCE(quote_number, '') || ' ' ||
    COALESCE(client_name, '') || ' ' ||
    COALESCE(client_email, '') || ' ' ||
    COALESCE(selected_package, '') || ' ' ||
    COALESCE(array_to_string(selected_addons, ' '), '') || ' ' ||
    COALESCE(special_notes, '') || ' ' ||
    COALESCE(terms_and_conditions, '')
);

UPDATE lead_interactions SET search_vector = to_tsvector('english', 
    COALESCE(interaction_type, '') || ' ' ||
    COALESCE(subject, '') || ' ' ||
    COALESCE(content, '') || ' ' ||
    COALESCE(outcome, '')
);

UPDATE contracts SET search_vector = to_tsvector('english', 
    COALESCE(contract_number, '') || ' ' ||
    COALESCE(terms, '') || ' ' ||
    COALESCE(payment_terms, '') || ' ' ||
    COALESCE(cancellation_policy, '')
);

-- Update other tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'UPDATE clients SET search_vector = to_tsvector(''english'', 
            COALESCE(first_name, '''') || '' '' ||
            COALESCE(last_name, '''') || '' '' ||
            COALESCE(email, '''') || '' '' ||
            COALESCE(phone, '''') || '' '' ||
            COALESCE(notes, ''''))';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        EXECUTE 'UPDATE sessions SET search_vector = to_tsvector(''english'', 
            COALESCE(session_type, '''') || '' '' ||
            COALESCE(session_title, '''') || '' '' ||
            COALESCE(location, '''') || '' '' ||
            COALESCE(photographer, '''') || '' '' ||
            COALESCE(status, ''''))';
    END IF;
END $$;

-- 9. PERFORMANCE OPTIMIZATION INDEXES
-- ----------------------------------------------------------------------------

-- High-performance indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_status_created ON leads(status, created_at) 
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 year';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_status_amount ON quotes(status, total_amount)
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_interactions_lead_type ON lead_interactions(lead_id, interaction_type, created_at);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_active_high_priority ON leads(priority, created_at)
    WHERE status IN ('new', 'contacted', 'qualified') AND priority = 'high';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_pending_recent ON quotes(created_at, total_amount)
    WHERE status IN ('draft', 'sent') AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Composite indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_transitions_analytics ON workflow_transitions(entity_type, to_stage, transitioned_at)
    WHERE transitioned_at >= CURRENT_DATE - INTERVAL '90 days';

-- 10. SUCCESS MESSAGE
-- ----------------------------------------------------------------------------

SELECT 'DATABASE ENHANCEMENTS PHASE 3 COMPLETED SUCCESSFULLY!' as message,
       'Full-text search, advanced scheduling, and performance optimization complete' as details,
       'All database enhancements installed. System ready for advanced features!' as next_step;