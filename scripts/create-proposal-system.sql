-- Custom Proposal System Schema
-- This creates tables for managing custom packages and proposals

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS proposal_packages CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS custom_packages CASCADE;
DROP TABLE IF EXISTS package_categories CASCADE;

-- Package Categories (Experiences, Add-ons, Video, etc.)
CREATE TABLE package_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Packages (User-created packages that can be used in proposals)
CREATE TABLE custom_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES package_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  
  -- Package details
  sessions TEXT, -- e.g., "3 Hours"
  locations TEXT, -- e.g., "3"
  gallery TEXT, -- e.g., "40-60 Images"
  looks TEXT, -- e.g., "3"
  delivery TEXT, -- e.g., "10 Day Delivery"
  video TEXT, -- e.g., "30 Second Highlight Reel"
  turnaround TEXT, -- e.g., "48 Hour Sneak Peek"
  fine_art TEXT, -- e.g., "$100 Fine Art Credit"
  
  -- Metadata
  highlights JSONB DEFAULT '[]', -- Array of highlight strings
  investment_note TEXT,
  theme_keywords TEXT,
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false, -- True for system templates like current packages
  is_main_offer BOOLEAN DEFAULT false, -- True for featured main packages
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals (Custom proposals created for specific leads)
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Proposal metadata
  title TEXT NOT NULL DEFAULT 'Custom Proposal',
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected
  
  -- Client information (cached from lead at creation time)
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  
  -- Proposal content
  custom_message TEXT, -- Custom message for this specific proposal
  notes TEXT, -- Internal admin notes
  
  -- Pricing
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for packages included in proposals
CREATE TABLE proposal_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  package_id UUID REFERENCES custom_packages(id) ON DELETE CASCADE,
  
  -- Package details at time of proposal (in case package changes later)
  package_snapshot JSONB NOT NULL, -- Full package data
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_custom_packages_category ON custom_packages(category_id);
CREATE INDEX idx_custom_packages_active ON custom_packages(is_active);
CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposal_packages_proposal ON proposal_packages(proposal_id);
CREATE INDEX idx_proposal_packages_package ON proposal_packages(package_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_categories_updated_at BEFORE UPDATE ON package_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_packages_updated_at BEFORE UPDATE ON custom_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default package categories
INSERT INTO package_categories (name, description, display_order) VALUES
('Experiences', 'Main photography session packages', 1),
('Enhancements', 'Add-on services to enhance the experience', 2),
('Motion', 'Video and motion portrait services', 3);

-- Insert existing packages as templates
INSERT INTO custom_packages (
  category_id,
  name,
  title,
  description,
  price,
  sessions,
  locations,
  gallery,
  looks,
  delivery,
  video,
  turnaround,
  fine_art,
  highlights,
  investment_note,
  theme_keywords,
  image_url,
  is_template,
  is_main_offer
) VALUES 
-- Opulence Package
(
  (SELECT id FROM package_categories WHERE name = 'Experiences'),
  'OPULENCE',
  'The Opulence',
  'This is your full cinematic collection. Directed with precision and styled with grace. Your Opulence session is an immersive editorial experience where we document every facet of your evolution, from celebration to stillness, from glamour to gratitude. Designed to feel like a cover shoot and a connection. Art is more than documentation, it''s a declaration.',
  1650.00,
  '4 Hours',
  '4',
  'Full Gallery',
  'Unlimited',
  '7 Day Delivery',
  '60-90 Second Portrait Video',
  '24 Hour Sneak Peek',
  '$100 Fine Art Credit',
  '["Visual Themes: Power, Legacy, Radiance", "Style: Cinematic storytelling with luxury emotion", "Locations: 4 unique Charleston icons that echo power and symbolism", "Wardrobe: Up to 5 styled looks", "Creative Flow: Directed scenes, motion prompts, narrative building"]',
  '(Optional Studio Scene Included)',
  'cinematic and intentional from start to finish',
  '/portfolio/opulence-sample.jpg',
  true,
  true
),
-- Elegance Package
(
  (SELECT id FROM package_categories WHERE name = 'Experiences'),
  'ELEGANCE',
  'The Elegance',
  'Elegance is intentional. This session distills your identity into a clean, powerful narrative layered with depth, but delivered with restraint. Perfect for those who want luxury without excess, this is your legacy told in quiet confidence and curated style.',
  1350.00,
  '3 Hours',
  '3',
  '40-60 Images',
  '3',
  '10 Day Delivery',
  '30 Second Highlight Reel',
  '48 Hour Sneak Peek',
  NULL,
  '["Visual Themes: Grace, Resilience, Expression", "Style: Minimalist editorial with focused drama", "Locations: 2-3 visually rich Charleston settings", "Wardrobe: Up to 3 intentional looks", "Creative Flow: Sculpted movement, posture play, and light choreography"]',
  'All editorial direction, production, and digital deliverables included',
  'clean, powerful, timeless',
  '/portfolio/elegance-sample.jpg',
  true,
  true
),
-- Essence Package
(
  (SELECT id FROM package_categories WHERE name = 'Experiences'),
  'ESSENCE',
  'The Essence',
  'This is a visual statement. It''s short, poetic, and packed with presence. Essence captures a distilled chapter of who you are right now. It''s intimate, elegant, and guided with intention. One location. One look. One story, told well.',
  950.00,
  '90 Minutes',
  '1',
  '20-30 Images',
  '1',
  '14 Day Delivery',
  NULL,
  'No sneak peek',
  NULL,
  '["Visual Themes: Identity, Stillness, Becoming", "Style: Clean, personal editorial energy", "Locations: A singular Charleston location with depth and character", "Wardrobe: One look styled for contrast and texture", "Creative Flow: Portrait-led direction with audio-on-the-eye and mood"]',
  'All editorial direction, production, and digital deliverables included',
  'focused editorial statement',
  '/portfolio/essence-sample.jpg',
  true,
  true
);

-- Insert existing add-ons as templates
INSERT INTO custom_packages (
  category_id,
  name,
  title,
  description,
  price,
  is_template,
  is_main_offer
) VALUES 
(
  (SELECT id FROM package_categories WHERE name = 'Enhancements'),
  'FULL_GALLERY_ACCESS',
  'Full Gallery Access',
  'Receive access to the complete gallery of unedited images (lightly processed, not retouched). Perfect for archiving every captured frame, not just the final editorial selection.',
  250.00,
  true,
  false
),
(
  (SELECT id FROM package_categories WHERE name = 'Enhancements'),
  'STUDIO_VIGNETTE',
  'Studio Vignette',
  'Add an in-studio set for a controlled, stylized portrait vignette with editorial lighting. Vogue-level, clean, classic, or dramatic mood.',
  150.00,
  true,
  false
),
(
  (SELECT id FROM package_categories WHERE name = 'Enhancements'),
  'ADDITIONAL_LOOKS',
  'Additional Looks',
  'Add another outfit or concept to your shoot. Perfect for showing more sides of your story with style changes, headshots, or transformation moments.',
  75.00,
  true,
  false
),
(
  (SELECT id FROM package_categories WHERE name = 'Enhancements'),
  'RUSH_DELIVERY',
  'Rush Delivery',
  'Need your full gallery ASAP? Get your complete curated collection delivered within 48 hours.',
  300.00,
  true,
  false
);

-- Insert video add-ons as templates
INSERT INTO custom_packages (
  category_id,
  name,
  title,
  description,
  price,
  is_template,
  is_main_offer
) VALUES 
(
  (SELECT id FROM package_categories WHERE name = 'Motion'),
  'MOTION_PORTRAIT_15',
  'Motion Portrait (15 Sec.)',
  'A brief, artistic glimpse into your energy and expression. Perfect for Instagram, reels, and digital invites.',
  100.00,
  true,
  false
),
(
  (SELECT id FROM package_categories WHERE name = 'Motion'),
  'HIGHLIGHT_REEL_30',
  'Highlight Reel (30 Sec.)',
  'Cinematic story of your session with dynamic cuts and elevated production value.',
  250.00,
  true,
  false
),
(
  (SELECT id FROM package_categories WHERE name = 'Motion'),
  'EDITORIAL_FEATURE_90',
  'Editorial Feature (60-90 Sec.)',
  'Full narrative piece showcasing the complete arc of your experience with professional editing.',
  400.00,
  true,
  false
);

-- Enable Row Level Security
ALTER TABLE package_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin-only access for now)
CREATE POLICY "Admin can manage package categories" ON package_categories FOR ALL USING (true);
CREATE POLICY "Admin can manage custom packages" ON custom_packages FOR ALL USING (true);
CREATE POLICY "Admin can manage proposals" ON proposals FOR ALL USING (true);
CREATE POLICY "Admin can manage proposal packages" ON proposal_packages FOR ALL USING (true);