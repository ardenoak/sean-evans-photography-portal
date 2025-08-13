-- Quote to Payment System Schema
-- This creates tables for the complete client quote-to-payment workflow

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE; 
DROP TABLE IF EXISTS quotes CASCADE;

-- Quotes table - stores client quotes generated from proposals
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  proposal_id UUID, -- Can be null for hardcoded proposals
  
  -- Quote identification
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
  
  -- Client information (cached for easy access)
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  
  -- Selected packages and services
  selected_package TEXT,
  selected_addons TEXT[], -- Array of addon names
  selected_video_addons TEXT[], -- Array of video addon names
  
  -- Pricing breakdown
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Quote details
  valid_until DATE,
  terms_and_conditions TEXT,
  special_notes TEXT,
  
  -- Tracking timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table - stores contract information after quote acceptance
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Contract identification
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, signed, cancelled
  
  -- Contract content
  terms TEXT NOT NULL,
  payment_terms TEXT NOT NULL,
  cancellation_policy TEXT NOT NULL,
  
  -- Electronic signature
  signature_required BOOLEAN DEFAULT true,
  client_signature VARCHAR(255), -- Client's typed name for e-signature
  client_signed_at TIMESTAMP WITH TIME ZONE,
  signature_ip_address INET,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table - stores payment information and Stripe integration
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Payment identification
  payment_number VARCHAR(50) UNIQUE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_type VARCHAR(20) NOT NULL, -- 'deposit', 'full', 'balance'
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, succeeded, failed, cancelled
  
  -- Payment method info (from Stripe)
  payment_method_type VARCHAR(50), -- card, bank_transfer, etc.
  payment_method_details JSONB, -- Last 4 digits, brand, etc.
  
  -- Fees and net amounts
  stripe_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  
  -- Processing timestamps
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  failure_reason TEXT,
  stripe_webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table enhancement - link to quotes and contracts
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Create indexes for performance
CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_client_email ON quotes(client_email);

CREATE INDEX idx_contracts_quote_id ON contracts(quote_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);

CREATE INDEX idx_payments_quote_id ON payments(quote_id);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin access for now)
CREATE POLICY "Admin can manage quotes" ON quotes FOR ALL USING (true);
CREATE POLICY "Admin can manage contracts" ON contracts FOR ALL USING (true);
CREATE POLICY "Admin can manage payments" ON payments FOR ALL USING (true);

-- Client policies for quote viewing (clients can view their own quotes)
CREATE POLICY "Clients can view their quotes" ON quotes FOR SELECT USING (true); -- We'll make this more restrictive later
CREATE POLICY "Clients can view their contracts" ON contracts FOR SELECT USING (true);

-- Insert default contract terms and policies
INSERT INTO contracts (id, quote_id, contract_number, terms, payment_terms, cancellation_policy)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder ID for template
  '00000000-0000-0000-0000-000000000000', -- Placeholder quote ID
  'TEMPLATE',
  'PHOTOGRAPHY SERVICE AGREEMENT

This agreement is between Sean Evans Photography ("Photographer") and the client named in the associated quote ("Client").

1. SCOPE OF SERVICES
The Photographer agrees to provide photography services as outlined in the accepted quote, including but not limited to:
- Professional photography session(s) at agreed locations and times
- Professional editing and post-processing of selected images
- Digital delivery of final images via online gallery
- All services and deliverables specified in the selected package

2. CLIENT RESPONSIBILITIES
- Arrive on time and prepared for scheduled sessions
- Provide accurate contact information and session details
- Communicate any special requests or concerns in advance
- Respect photographer''s creative direction and professional expertise

3. CREATIVE CONTROL
The Photographer retains creative and editorial control over all aspects of the photography and editing process. While client input is welcomed, final artistic decisions rest with the Photographer.

4. DELIVERY AND TIMELINE
- Sneak peek images (if included) delivered within 24-48 hours
- Full gallery delivered within timeframe specified in package
- All images professionally edited and color-corrected
- Digital delivery via secure online gallery

5. USAGE RIGHTS
- Client receives personal and social media usage rights for all delivered images
- Commercial usage requires separate licensing agreement
- Photographer retains copyright and portfolio usage rights
- Credit to Sean Evans Photography appreciated but not required

6. LIABILITY
Photographer''s liability is limited to the amount paid for services. Client acknowledges that photography involves inherent risks and releases Photographer from liability for any injuries or damages.

7. FORCE MAJEURE
Neither party shall be liable for any failure to perform due to events beyond reasonable control, including but not limited to acts of God, weather, illness, or government restrictions.

This agreement constitutes the entire agreement between parties and supersedes all prior negotiations and agreements.',

  'PAYMENT TERMS

1. DEPOSIT REQUIREMENT
- 50% deposit required to secure session date
- Deposit due upon contract acceptance
- Sessions will not be scheduled until deposit is received

2. BALANCE PAYMENT
- Remaining balance due 24 hours before scheduled session
- Failure to pay balance may result in session cancellation
- No gallery delivery until all payments are received in full

3. PAYMENT METHODS
- Secure online payment via credit card or bank transfer
- All payments processed through encrypted payment systems
- Payment confirmations sent via email

4. LATE PAYMENT
- Late fees may apply for overdue balances
- Gallery delivery delayed until payment is complete
- Additional sessions may be cancelled for non-payment

5. REFUND POLICY
- Deposits are non-refundable once session is scheduled
- Refunds considered only in cases of photographer cancellation
- Partial refunds may be available for unused services (subject to approval)',

  'CANCELLATION POLICY

1. CLIENT CANCELLATION
- 48+ hours notice: Full rescheduling allowed (one-time)
- 24-48 hours notice: 50% cancellation fee applied
- Less than 24 hours: Full session fee retained
- No-shows: Full session fee retained, no rescheduling

2. WEATHER CANCELLATION
- Outdoor sessions subject to weather conditions
- Photographer makes final decision on weather suitability
- Indoor backup locations available when possible
- Full rescheduling allowed for weather cancellations

3. PHOTOGRAPHER CANCELLATION
- Full refund provided for photographer-initiated cancellations
- Alternative dates offered when possible
- No liability for expenses incurred by client

4. RESCHEDULING
- One complimentary reschedule allowed with 48+ hours notice
- Additional reschedules subject to availability and fees
- Peak season dates may have limited rescheduling options

5. EMERGENCY SITUATIONS
- Illness, family emergencies, or other urgent matters considered case-by-case
- Documentation may be required for emergency cancellations
- Photographer reserves right to make exceptions for extraordinary circumstances'
) ON CONFLICT (id) DO NOTHING;

-- Create quote number sequence function
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  quote_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current year
  quote_num := 'SEP-' || EXTRACT(YEAR FROM NOW()) || '-';
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'SEP-' || EXTRACT(YEAR FROM NOW()) || '-(.*)') AS INTEGER)), 0) + 1
  INTO counter
  FROM quotes
  WHERE quote_number LIKE 'SEP-' || EXTRACT(YEAR FROM NOW()) || '-%';
  
  -- Pad with zeros
  quote_num := quote_num || LPAD(counter::TEXT, 4, '0');
  
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

-- Create contract number sequence function
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  contract_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current year
  contract_num := 'CON-' || EXTRACT(YEAR FROM NOW()) || '-';
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 'CON-' || EXTRACT(YEAR FROM NOW()) || '-(.*)') AS INTEGER)), 0) + 1
  INTO counter
  FROM contracts
  WHERE contract_number LIKE 'CON-' || EXTRACT(YEAR FROM NOW()) || '-%';
  
  -- Pad with zeros
  contract_num := contract_num || LPAD(counter::TEXT, 4, '0');
  
  RETURN contract_num;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Quote-to-Payment system tables created successfully!' as result;