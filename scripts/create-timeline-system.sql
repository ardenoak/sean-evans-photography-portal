-- Dynamic Timeline System for Photography Sessions
-- Run this in Supabase SQL Editor

-- 1. Create timeline templates table
CREATE TABLE IF NOT EXISTS timeline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type VARCHAR(100) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  tasks JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create session timeline instances table  
CREATE TABLE IF NOT EXISTS session_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  task_name VARCHAR(200) NOT NULL,
  calculated_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  days_offset INTEGER NOT NULL, -- Days relative to session date (negative = before, positive = after)
  task_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Insert default timeline templates
INSERT INTO timeline_templates (session_type, template_name, tasks) VALUES 

-- Portrait Session Template
('Portrait Session', 'Standard Portrait Timeline', '[
  {"task": "Contract signed & payment received", "offset_days": -14, "order": 1},
  {"task": "Style guide & preparation materials sent", "offset_days": -7, "order": 2},
  {"task": "Pre-session consultation call", "offset_days": -3, "order": 3},
  {"task": "Session day", "offset_days": 0, "order": 4, "highlight": true},
  {"task": "Preview gallery delivery", "offset_days": 2, "order": 5},
  {"task": "Complete gallery delivery", "offset_days": 7, "order": 6}
]'),

-- Family Session Template
('Family Session', 'Standard Family Timeline', '[
  {"task": "Contract signed & payment received", "offset_days": -21, "order": 1},
  {"task": "Family style guide sent", "offset_days": -10, "order": 2},
  {"task": "Location confirmation & planning", "offset_days": -7, "order": 3},
  {"task": "Pre-session consultation call", "offset_days": -2, "order": 4},
  {"task": "Session day", "offset_days": 0, "order": 5, "highlight": true},
  {"task": "Preview gallery delivery", "offset_days": 2, "order": 6},
  {"task": "Complete gallery & prints delivery", "offset_days": 10, "order": 7}
]'),

-- Executive Session Template  
('Executive Session', 'Standard Executive Timeline', '[
  {"task": "Contract signed & payment received", "offset_days": -10, "order": 1},
  {"task": "Executive style guide sent", "offset_days": -5, "order": 2},
  {"task": "Pre-session consultation call", "offset_days": -2, "order": 3},
  {"task": "Session day", "offset_days": 0, "order": 4, "highlight": true},
  {"task": "Preview gallery delivery", "offset_days": 1, "order": 5},
  {"task": "Complete gallery delivery", "offset_days": 5, "order": 6}
]'),

-- Branding Session Template
('Branding Session', 'Standard Branding Timeline', '[
  {"task": "Contract signed & payment received", "offset_days": -14, "order": 1},
  {"task": "Brand consultation & mood board", "offset_days": -10, "order": 2},
  {"task": "Wardrobe & styling guide sent", "offset_days": -7, "order": 3},
  {"task": "Pre-session planning call", "offset_days": -2, "order": 4},
  {"task": "Session day", "offset_days": 0, "order": 5, "highlight": true},
  {"task": "Preview gallery delivery", "offset_days": 2, "order": 6},
  {"task": "Complete brand package delivery", "offset_days": 7, "order": 7}
]');

-- 4. Create function to generate timeline for a session
CREATE OR REPLACE FUNCTION generate_session_timeline(
  p_session_id UUID,
  p_session_type VARCHAR,
  p_session_date DATE
) RETURNS VOID AS $$
DECLARE
  template_record RECORD;
  task_record RECORD;
BEGIN
  -- Get the template for this session type
  SELECT tasks INTO template_record 
  FROM timeline_templates 
  WHERE session_type = p_session_type 
  LIMIT 1;
  
  -- If template exists, create timeline items
  IF template_record.tasks IS NOT NULL THEN
    -- Loop through each task in the template
    FOR task_record IN SELECT * FROM jsonb_array_elements(template_record.tasks)
    LOOP
      INSERT INTO session_timelines (
        session_id,
        task_name,
        calculated_date,
        days_offset,
        task_order
      ) VALUES (
        p_session_id,
        task_record.value->>'task',
        p_session_date + (task_record.value->>'offset_days')::INTEGER,
        (task_record.value->>'offset_days')::INTEGER,
        (task_record.value->>'order')::INTEGER
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Enable RLS on new tables
ALTER TABLE timeline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_timelines ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Templates are readable by all authenticated users
CREATE POLICY "Templates are readable by authenticated users" ON timeline_templates
  FOR SELECT TO authenticated USING (true);

-- Session timelines follow same rules as sessions
CREATE POLICY "Users can view own session timelines" ON session_timelines
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Admin users can manage all timelines
CREATE POLICY "Admin users can manage all timelines" ON session_timelines
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'sean@ardenoak.co',
      'hello@ardenoak.co'
    )
  ) WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'sean@ardenoak.co', 
      'hello@ardenoak.co'
    )
  );

-- 7. Verify setup
SELECT 'Timeline system created successfully!' as message;
SELECT 'Templates created:' as message;
SELECT session_type, template_name FROM timeline_templates;