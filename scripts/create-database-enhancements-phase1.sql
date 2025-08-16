-- DATABASE SCHEMA ENHANCEMENTS - PHASE 1
-- Foundation for Advanced Features: Audit Logging & Workflow Tracking
-- Run this in Supabase SQL Editor
-- ZERO DOWNTIME: All changes are additive only

-- =============================================================================
-- PHASE 1: AUDIT LOGGING & WORKFLOW FOUNDATION
-- =============================================================================

-- 1. COMPREHENSIVE AUDIT LOGGING SYSTEM
-- ----------------------------------------------------------------------------

-- Main audit log table for all data changes
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_email TEXT,
    user_ip INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_timestamp ON audit_log(table_name, timestamp) 
    WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days';
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_email ON audit_log(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit log
CREATE POLICY "Admins can view audit log" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- 2. WORKFLOW TRANSITION TRACKING
-- ----------------------------------------------------------------------------

-- Workflow transitions for lead/client/session status tracking
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'session', 'quote', 'contract')),
    entity_id UUID NOT NULL,
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transitioned_by TEXT NOT NULL,
    transition_reason TEXT,
    automated BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workflow tracking performance
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_entity ON workflow_transitions(entity_type, entity_id, transitioned_at);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_stage ON workflow_transitions(entity_type, to_stage);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_date ON workflow_transitions(transitioned_at);

-- Enable RLS on workflow transitions
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all workflow data
CREATE POLICY "Admins can manage workflow transitions" ON workflow_transitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- 3. ENHANCE EXISTING TABLES WITH WORKFLOW FIELDS
-- ----------------------------------------------------------------------------

-- Add workflow tracking fields to leads table (if not exists)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'inquiry';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS previous_stage TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_duration INTERVAL;

-- Add workflow tracking to clients table (assuming it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'active';
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS previous_stage TEXT;
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS stage_duration INTERVAL;
    END IF;
END $$;

-- Add workflow tracking to sessions table (assuming it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'scheduled';
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS previous_stage TEXT;
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stage_duration INTERVAL;
    END IF;
END $$;

-- 4. GDPR COMPLIANCE FRAMEWORK
-- ----------------------------------------------------------------------------

-- GDPR data subject requests tracking
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_type TEXT NOT NULL CHECK (request_type IN ('access', 'portability', 'deletion', 'rectification')),
    client_email TEXT NOT NULL,
    client_id UUID, -- May reference clients(id) if table exists
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    processed_by TEXT,
    notes TEXT,
    data_exported JSONB,
    deletion_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for GDPR requests
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_email ON gdpr_requests(client_email);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests(request_type);

-- Enable RLS on GDPR requests
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GDPR requests
CREATE POLICY "Clients can manage their own GDPR requests" ON gdpr_requests
    FOR ALL USING (
        client_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- Data retention policy tracking
CREATE TABLE IF NOT EXISTS data_retention_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    retention_policy TEXT NOT NULL,
    scheduled_deletion_date DATE,
    deleted_date DATE,
    deletion_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for data retention
CREATE INDEX IF NOT EXISTS idx_data_retention_table ON data_retention_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_retention_schedule ON data_retention_log(scheduled_deletion_date);

-- Enable RLS on data retention log
ALTER TABLE data_retention_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view retention data
CREATE POLICY "Admins can view data retention log" ON data_retention_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- 5. AUDIT TRIGGER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to create audit trail for any table
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB := NULL;
    new_values JSONB := NULL;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_name TEXT;
BEGIN
    -- Determine action and values
    IF TG_OP = 'DELETE' THEN
        old_values := to_jsonb(OLD);
        new_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
        
        -- Identify changed fields
        FOR field_name IN SELECT jsonb_object_keys(old_values) LOOP
            IF old_values->field_name IS DISTINCT FROM new_values->field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    ELSIF TG_OP = 'INSERT' THEN
        old_values := NULL;
        new_values := to_jsonb(NEW);
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_email,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_values,
        new_values,
        changed_fields,
        auth.jwt() ->> 'email',
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to track workflow transitions
CREATE OR REPLACE FUNCTION track_workflow_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if workflow_stage changed
    IF TG_OP = 'UPDATE' AND NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
        -- Update stage timing fields
        NEW.previous_stage := OLD.workflow_stage;
        NEW.stage_entered_at := NOW();
        NEW.stage_duration := CASE 
            WHEN OLD.stage_entered_at IS NOT NULL 
            THEN NOW() - OLD.stage_entered_at 
            ELSE NULL 
        END;
        
        -- Log the transition
        INSERT INTO workflow_transitions (
            entity_type,
            entity_id,
            from_stage,
            to_stage,
            transitioned_by,
            transition_reason,
            automated
        ) VALUES (
            CASE TG_TABLE_NAME
                WHEN 'leads' THEN 'lead'
                WHEN 'clients' THEN 'client'
                WHEN 'sessions' THEN 'session'
                WHEN 'quotes' THEN 'quote'
                WHEN 'contracts' THEN 'contract'
            END,
            NEW.id,
            OLD.workflow_stage,
            NEW.workflow_stage,
            COALESCE(auth.jwt() ->> 'email', 'system'),
            'Stage transition',
            FALSE
        );
    ELSIF TG_OP = 'INSERT' AND NEW.workflow_stage IS NOT NULL THEN
        -- Log initial stage for new records
        INSERT INTO workflow_transitions (
            entity_type,
            entity_id,
            from_stage,
            to_stage,
            transitioned_by,
            transition_reason,
            automated
        ) VALUES (
            CASE TG_TABLE_NAME
                WHEN 'leads' THEN 'lead'
                WHEN 'clients' THEN 'client'
                WHEN 'sessions' THEN 'session'
                WHEN 'quotes' THEN 'quote'
                WHEN 'contracts' THEN 'contract'
            END,
            NEW.id,
            NULL,
            NEW.workflow_stage,
            COALESCE(auth.jwt() ->> 'email', 'system'),
            'Initial stage',
            FALSE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. APPLY AUDIT TRIGGERS TO EXISTING TABLES
-- ----------------------------------------------------------------------------

-- Add audit triggers to key tables
DROP TRIGGER IF EXISTS audit_leads_trigger ON leads;
CREATE TRIGGER audit_leads_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

DROP TRIGGER IF EXISTS workflow_leads_trigger ON leads;
CREATE TRIGGER workflow_leads_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION track_workflow_transition();

-- Add triggers to clients table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_clients_trigger ON clients';
        EXECUTE 'CREATE TRIGGER audit_clients_trigger
            AFTER INSERT OR UPDATE OR DELETE ON clients
            FOR EACH ROW EXECUTE FUNCTION create_audit_trail()';
            
        EXECUTE 'DROP TRIGGER IF EXISTS workflow_clients_trigger ON clients';
        EXECUTE 'CREATE TRIGGER workflow_clients_trigger
            BEFORE INSERT OR UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION track_workflow_transition()';
    END IF;
END $$;

-- Add triggers to sessions table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_sessions_trigger ON sessions';
        EXECUTE 'CREATE TRIGGER audit_sessions_trigger
            AFTER INSERT OR UPDATE OR DELETE ON sessions
            FOR EACH ROW EXECUTE FUNCTION create_audit_trail()';
            
        EXECUTE 'DROP TRIGGER IF EXISTS workflow_sessions_trigger ON sessions';
        EXECUTE 'CREATE TRIGGER workflow_sessions_trigger
            BEFORE INSERT OR UPDATE ON sessions
            FOR EACH ROW EXECUTE FUNCTION track_workflow_transition()';
    END IF;
END $$;

-- Add triggers to quotes table
DROP TRIGGER IF EXISTS audit_quotes_trigger ON quotes;
CREATE TRIGGER audit_quotes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON quotes
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- Add triggers to contracts table
DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
CREATE TRIGGER audit_contracts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- Add triggers to payments table
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- 7. UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to get audit trail for a specific record
CREATE OR REPLACE FUNCTION get_audit_trail(p_table_name TEXT, p_record_id UUID)
RETURNS TABLE (
    action TEXT,
    changed_fields TEXT[],
    old_values JSONB,
    new_values JSONB,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.action,
        al.changed_fields,
        al.old_values,
        al.new_values,
        al.user_email,
        al.timestamp
    FROM audit_log al
    WHERE al.table_name = p_table_name 
    AND al.record_id = p_record_id
    ORDER BY al.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workflow history for an entity
CREATE OR REPLACE FUNCTION get_workflow_history(p_entity_type TEXT, p_entity_id UUID)
RETURNS TABLE (
    from_stage TEXT,
    to_stage TEXT,
    transitioned_at TIMESTAMP WITH TIME ZONE,
    transitioned_by TEXT,
    transition_reason TEXT,
    automated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.from_stage,
        wt.to_stage,
        wt.transitioned_at,
        wt.transitioned_by,
        wt.transition_reason,
        wt.automated
    FROM workflow_transitions wt
    WHERE wt.entity_type = p_entity_type 
    AND wt.entity_id = p_entity_id
    ORDER BY wt.transitioned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. SUCCESS MESSAGE
-- ----------------------------------------------------------------------------

SELECT 'DATABASE ENHANCEMENTS PHASE 1 COMPLETED SUCCESSFULLY!' as message,
       'Audit logging, workflow tracking, and GDPR compliance framework installed' as details,
       'Next: Run Phase 2 for analytics and search enhancements' as next_step;