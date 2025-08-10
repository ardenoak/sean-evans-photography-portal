-- Create Gallery System for Client Portal
-- This creates tables for managing client galleries with photos and metadata

-- Galleries table - one gallery per session
CREATE TABLE galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Gallery',
  description TEXT,
  status TEXT DEFAULT 'preparing' CHECK (status IN ('preparing', 'preview', 'ready', 'delivered', 'archived')),
  preview_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  delivery_date DATE,
  expiry_date DATE,
  access_days INTEGER DEFAULT 90, -- Configurable per session type
  pic_time_gallery_id TEXT, -- For Pic-Time integration
  pic_time_url TEXT,
  is_wedding BOOLEAN DEFAULT FALSE, -- Different timeline for weddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Images table - individual photos in galleries
CREATE TABLE gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_preview BOOLEAN DEFAULT FALSE, -- Part of preview selection
  is_favorite BOOLEAN DEFAULT FALSE, -- Client marked as favorite
  sort_order INTEGER DEFAULT 0,
  pic_time_image_id TEXT, -- For Pic-Time sync
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Access Log - track client viewing
CREATE TABLE gallery_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  access_type TEXT DEFAULT 'view' CHECK (access_type IN ('view', 'download', 'favorite')),
  image_id UUID REFERENCES gallery_images(id) ON DELETE CASCADE NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Settings - per session type defaults
CREATE TABLE gallery_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type TEXT NOT NULL UNIQUE,
  default_access_days INTEGER DEFAULT 90,
  preview_image_count INTEGER DEFAULT 20,
  delivery_days INTEGER DEFAULT 3, -- Business days to deliver
  is_wedding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default gallery settings
INSERT INTO gallery_settings (session_type, default_access_days, preview_image_count, delivery_days, is_wedding) VALUES
('Editorial Portrait', 90, 20, 3, FALSE),
('Branding Session', 90, 25, 2, FALSE),
('Headshots', 90, 15, 2, FALSE),
('Creative Portrait', 90, 20, 3, FALSE),
('Wedding', 365, 50, 21, TRUE), -- 21 days for wedding delivery
('Engagement', 90, 20, 3, FALSE),
('Event', 90, 30, 5, FALSE);

-- Enable RLS
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Galleries
CREATE POLICY "Users can view their own session galleries" ON galleries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s 
      JOIN clients c ON s.client_id = c.id 
      WHERE s.id = galleries.session_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all galleries" ON galleries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Gallery Images
CREATE POLICY "Users can view images in their galleries" ON gallery_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM galleries g
      JOIN sessions s ON g.session_id = s.id
      JOIN clients c ON s.client_id = c.id
      WHERE g.id = gallery_images.gallery_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update favorite status" ON gallery_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM galleries g
      JOIN sessions s ON g.session_id = s.id
      JOIN clients c ON s.client_id = c.id
      WHERE g.id = gallery_images.gallery_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all gallery images" ON gallery_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Gallery Access Log
CREATE POLICY "Users can view their own access log" ON gallery_access_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE id = gallery_access_log.client_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own access log" ON gallery_access_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE id = gallery_access_log.client_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all access logs" ON gallery_access_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Gallery Settings accessible to all authenticated users (read-only)
CREATE POLICY "All users can view gallery settings" ON gallery_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage gallery settings" ON gallery_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Function to automatically create gallery when session is created
CREATE OR REPLACE FUNCTION create_gallery_for_session()
RETURNS TRIGGER AS $$
DECLARE
  gallery_config gallery_settings%ROWTYPE;
  delivery_date_calc DATE;
BEGIN
  -- Get gallery settings for this session type
  SELECT * INTO gallery_config 
  FROM gallery_settings 
  WHERE session_type = NEW.session_type;
  
  -- If no specific settings, use default
  IF gallery_config IS NULL THEN
    gallery_config.default_access_days := 90;
    gallery_config.preview_image_count := 20;
    gallery_config.delivery_days := 3;
    gallery_config.is_wedding := FALSE;
  END IF;
  
  -- Calculate delivery date based on session date
  delivery_date_calc := NEW.session_date + INTERVAL '1 day' * gallery_config.delivery_days;
  
  -- Create gallery for the new session
  INSERT INTO galleries (
    session_id,
    title,
    access_days,
    delivery_date,
    expiry_date,
    is_wedding
  ) VALUES (
    NEW.id,
    NEW.session_type || ' Gallery',
    gallery_config.default_access_days,
    delivery_date_calc,
    delivery_date_calc + INTERVAL '1 day' * gallery_config.default_access_days,
    gallery_config.is_wedding
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create gallery when session is created
CREATE TRIGGER create_gallery_on_session_insert
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_gallery_for_session();

-- Function to update gallery counts
CREATE OR REPLACE FUNCTION update_gallery_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total and preview counts for the gallery
  UPDATE galleries SET 
    total_count = (
      SELECT COUNT(*) 
      FROM gallery_images 
      WHERE gallery_id = COALESCE(NEW.gallery_id, OLD.gallery_id)
    ),
    preview_count = (
      SELECT COUNT(*) 
      FROM gallery_images 
      WHERE gallery_id = COALESCE(NEW.gallery_id, OLD.gallery_id) 
      AND is_preview = TRUE
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.gallery_id, OLD.gallery_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update counts when images are added/removed/updated
CREATE TRIGGER update_gallery_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_counts();