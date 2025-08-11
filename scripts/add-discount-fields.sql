-- Add discount fields to custom_packages table
ALTER TABLE custom_packages 
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed', NULL)),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_label VARCHAR(255) DEFAULT 'Limited Time Offer',
ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Add quote and contract fields to proposals table
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS quote_status VARCHAR(50) DEFAULT 'draft' CHECK (quote_status IN ('draft', 'sent', 'viewed', 'accepted', 'expired')),
ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quote_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_status VARCHAR(50) DEFAULT 'pending' CHECK (contract_status IN ('pending', 'sent', 'signed', 'cancelled')),
ADD COLUMN IF NOT EXISTS contract_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS booking_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP WITH TIME ZONE;

-- Create quotes table for quote management
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  quote_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'draft',
  valid_until DATE,
  terms_and_conditions TEXT,
  special_notes TEXT,
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id),
  lead_id UUID REFERENCES leads(id),
  contract_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'draft',
  terms TEXT,
  cancellation_policy TEXT,
  payment_terms TEXT,
  signature_required BOOLEAN DEFAULT TRUE,
  client_signature TEXT,
  client_signed_at TIMESTAMP WITH TIME ZONE,
  photographer_signature TEXT,
  photographer_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for new tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (customize as needed)
CREATE POLICY "Enable all access for quotes" ON quotes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for contracts" ON contracts
  FOR ALL USING (true) WITH CHECK (true);