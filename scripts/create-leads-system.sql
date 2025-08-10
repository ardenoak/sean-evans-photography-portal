-- Create leads management system for Sean Evans Photography

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
    next_follow_up TIMESTAMP WITH TIME ZONE
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
CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_documents_lead_id ON lead_documents(lead_id);

-- Add RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_documents ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all leads
CREATE POLICY "Admins can manage all leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Admins can manage all lead interactions" ON lead_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Admins can manage all lead documents" ON lead_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
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

-- Insert some sample leads for development
INSERT INTO leads (
    first_name, last_name, email, phone, 
    session_type_interest, budget_range, preferred_timeline, 
    lead_source, status, priority, message
) VALUES 
(
    'Sarah', 'Johnson', 'sarah.johnson@email.com', '(555) 123-4567',
    'Editorial Portrait', '$2,000 - $3,000', 'Next 2 months',
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
);

-- Insert sample interactions
INSERT INTO lead_interactions (lead_id, interaction_type, subject, content, created_by) 
SELECT 
    l.id,
    'email',
    'Initial Inquiry Response',
    'Thank you for your interest! I''d love to discuss your vision for the session. Are you available for a brief call this week?',
    'admin@ardenoak.co'
FROM leads l WHERE l.email = 'mchen@techstartup.com';