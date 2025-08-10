-- Create leads management system for Sean Evans Photography
-- Final version that works with the admin_users table

-- Create leads table
CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contact Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Lead Details
    lead_source TEXT, -- website, referral, instagram, etc.
    session_type_interest TEXT, -- branding, editorial, etc.
    budget_range TEXT,
    preferred_timeline TEXT,
    location_preference TEXT,
    
    -- Lead Status
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Additional Info
    message TEXT,
    notes TEXT,
    tags TEXT[], -- array of tags like ["wedding", "corporate", "urgent"]
    
    -- Conversion
    converted_to_session_id UUID REFERENCES sessions(id),
    conversion_date TIMESTAMP WITH TIME ZONE,
    lost_reason TEXT,
    
    -- Admin fields
    assigned_to TEXT, -- admin user email
    last_contacted TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    
    -- Optional client linking
    client_id UUID REFERENCES clients(id)
);

-- Create lead_interactions table for tracking communication
CREATE TABLE public.lead_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('email', 'phone', 'meeting', 'note', 'proposal')),
    subject TEXT,
    content TEXT,
    outcome TEXT,
    
    -- Admin who logged this interaction
    created_by TEXT NOT NULL
);

-- Create lead_documents table for storing proposals, contracts, etc.
CREATE TABLE public.lead_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('proposal', 'contract', 'mood_board', 'quote', 'other')),
    file_url TEXT,
    file_path TEXT,
    file_size INTEGER,
    
    uploaded_by TEXT NOT NULL,
    is_sent_to_client BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_documents_lead_id ON lead_documents(lead_id);

-- Add RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
-- Allow admins with lead permissions to manage leads
CREATE POLICY "Admins can manage leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
            AND au.is_active = true
            AND au.can_manage_leads = true
        )
    );

-- Allow clients to view their own leads (if they become clients later)
CREATE POLICY "Clients can view their own leads" ON leads
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email
        OR (
            client_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM clients c 
                WHERE c.id = client_id 
                AND c.user_id = auth.uid()
            )
        )
    );

-- RLS Policies for lead_interactions
CREATE POLICY "Admins can manage lead interactions" ON lead_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
            AND au.is_active = true
            AND au.can_manage_leads = true
        )
    );

-- RLS Policies for lead_documents
CREATE POLICY "Admins can manage lead documents" ON lead_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.email = auth.jwt() ->> 'email'
            AND au.is_active = true
            AND au.can_manage_leads = true
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- Function to convert lead to client
CREATE OR REPLACE FUNCTION convert_lead_to_client(lead_uuid UUID)
RETURNS UUID AS $$
DECLARE
    lead_record leads%ROWTYPE;
    new_client_id UUID;
BEGIN
    -- Get the lead data
    SELECT * INTO lead_record FROM leads WHERE id = lead_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;
    
    -- Create a new client
    INSERT INTO clients (
        first_name, last_name, email, phone, 
        created_at, notes
    ) VALUES (
        lead_record.first_name, lead_record.last_name, 
        lead_record.email, lead_record.phone,
        NOW(), 
        'Converted from lead: ' || COALESCE(lead_record.message, '')
    ) RETURNING id INTO new_client_id;
    
    -- Update the lead to mark as converted
    UPDATE leads SET 
        status = 'converted',
        client_id = new_client_id,
        conversion_date = NOW(),
        updated_at = NOW()
    WHERE id = lead_uuid;
    
    -- Add interaction record
    INSERT INTO lead_interactions (
        lead_id, interaction_type, subject, content, created_by
    ) VALUES (
        lead_uuid, 'note', 'Lead Converted', 
        'Lead successfully converted to client', 
        auth.jwt() ->> 'email'
    );
    
    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample leads for development
INSERT INTO leads (
    first_name, last_name, email, phone, 
    session_type_interest, budget_range, preferred_timeline, 
    lead_source, status, priority, message
) VALUES 
(
    'Sarah', 'Johnson', 'sarah.johnson@email.com', '(555) 123-4567',
    'Editorial Portrait', '$2,500 - $5,000', '1-3 months',
    'Instagram', 'new', 'high', 
    'Hi! I saw your work on Instagram and love your editorial style. I''m a startup founder looking for professional headshots and brand photos. Would love to discuss!'
),
(
    'Michael', 'Chen', 'mchen@techstartup.com', '(555) 987-6543',
    'Branding Session', '$3,000 - $5,000', '1 month',
    'Website', 'contacted', 'medium',
    'Our tech startup needs professional photos for our team and marketing materials. Looking for a modern, professional aesthetic.'
),
(
    'Emma', 'Williams', 'emma.w@agency.com', '(555) 456-7890',
    'Editorial Portrait', '$1,500 - $2,500', 'Flexible',
    'Referral', 'qualified', 'medium',
    'Referred by Jessica Martinez. Need executive portraits for our agency''s new website and marketing campaigns.'
),
(
    'David', 'Rodriguez', 'david@creativestudio.com', '(555) 321-9876',
    'Creative Portrait', '$2,000 - $3,500', '3-6 months',
    'Website', 'new', 'low',
    'Looking for creative portraits for my design studio. Interested in exploring unique lighting and artistic concepts.'
),
(
    'Jessica', 'Martinez', 'j.martinez@consulting.com', '(555) 654-3210',
    'Headshots', '$800 - $1,500', 'Within 2 weeks',
    'Referral', 'proposal_sent', 'high',
    'Need professional headshots for LinkedIn and company website. Prefer clean, corporate style.'
);

-- Insert sample interactions for some leads
INSERT INTO lead_interactions (lead_id, interaction_type, subject, content, created_by) 
SELECT 
    l.id,
    'email',
    'Initial Inquiry Response',
    'Thank you for your interest! I''d love to discuss your vision for the session. Are you available for a brief call this week?',
    'hello@ardenoak.co'
FROM leads l WHERE l.email = 'mchen@techstartup.com';

INSERT INTO lead_interactions (lead_id, interaction_type, subject, content, created_by)
SELECT 
    l.id,
    'phone',
    'Consultation Call',
    'Great 30-minute call discussing project scope, timeline, and budget. Client is very interested and ready to move forward.',
    'hello@ardenoak.co'
FROM leads l WHERE l.email = 'j.martinez@consulting.com';

INSERT INTO lead_interactions (lead_id, interaction_type, subject, content, created_by)
SELECT 
    l.id,
    'proposal',
    'Proposal Sent',
    'Sent detailed proposal including session details, pricing, and timeline. Waiting for client response.',
    'hello@ardenoak.co'
FROM leads l WHERE l.email = 'j.martinez@consulting.com';