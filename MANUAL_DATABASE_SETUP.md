# Manual Database Setup for Quote-to-Payment System

## 🔧 Database Tables Need Manual Creation

The automated migration didn't complete successfully. Please follow these steps:

### Step 1: Access Supabase Dashboard
1. Go to [your Supabase project dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Run the SQL Script
Copy and paste the following SQL script and run it:

```sql
-- Drop existing tables if they exist (for clean setup)
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
```

### Step 3: Verify Tables Created
After running the script, you should see:
- ✅ `quotes` table created
- ✅ `contracts` table created  
- ✅ `payments` table created

### Step 4: Test the System
Once the tables are created, you can:

1. **Visit a proposal page**: 
   - Go to: `http://localhost:3000/proposals/dabc69e7-23ff-414f-ba1c-59d9c715884b`
   - Select a package and add-ons
   - Click "Reserve Experience"

2. **Expected flow**:
   - Quote should be generated successfully
   - New window opens with quote details
   - Quote can be accepted to proceed to contract

### Step 5: Verify Quote Creation
You can check if quotes are being created by running this query in Supabase SQL Editor:

```sql
SELECT * FROM quotes ORDER BY created_at DESC LIMIT 5;
```

## 🚨 Important Notes
- Make sure to run this in your **Supabase Dashboard SQL Editor**
- The automated migration failed due to RPC limitations
- This manual setup will enable the complete quote-to-payment workflow

Once completed, we'll be able to test the full client flow from proposal → quote → contract → payment.