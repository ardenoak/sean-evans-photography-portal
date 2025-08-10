-- AI-Integrated Timeline System with Workload Management
-- Run this in Supabase SQL Editor

-- 1. Enhanced timeline templates with AI automation flags
CREATE TABLE IF NOT EXISTS timeline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type VARCHAR(100) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  tasks JSONB NOT NULL, -- Enhanced with automation flags
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enhanced session timeline instances with AI integration
CREATE TABLE IF NOT EXISTS session_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  task_name VARCHAR(200) NOT NULL,
  calculated_date DATE NOT NULL,
  adjusted_date DATE, -- Date adjusted for workload
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  completed_by VARCHAR(20) DEFAULT 'manual', -- 'manual', 'ai_agent', 'automated'
  days_offset INTEGER NOT NULL,
  task_order INTEGER NOT NULL,
  
  -- AI Integration Fields
  can_be_automated BOOLEAN DEFAULT false,
  ai_agent_assigned BOOLEAN DEFAULT false,
  automation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  
  -- Workload Management Fields
  estimated_work_hours DECIMAL(3,1) DEFAULT 0.0,
  requires_photographer BOOLEAN DEFAULT true,
  can_be_batched BOOLEAN DEFAULT false, -- Can be done with other sessions
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Workload capacity management table
CREATE TABLE IF NOT EXISTS workload_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  photographer_hours_available DECIMAL(3,1) DEFAULT 8.0,
  photographer_hours_scheduled DECIMAL(3,1) DEFAULT 0.0,
  ai_tasks_capacity INTEGER DEFAULT 50,
  ai_tasks_scheduled INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Enhanced timeline templates with AI automation
INSERT INTO timeline_templates (session_type, template_name, tasks) VALUES 

-- Portrait Session Template with AI flags
('Portrait Session', 'AI-Enhanced Portrait Timeline', '[
  {
    "task": "Contract signed & payment received", 
    "offset_days": -14, 
    "order": 1,
    "can_be_automated": false,
    "estimated_hours": 0.5,
    "requires_photographer": true,
    "can_be_batched": false
  },
  {
    "task": "Style guide & preparation materials sent", 
    "offset_days": -7, 
    "order": 2,
    "can_be_automated": true,
    "estimated_hours": 0.0,
    "requires_photographer": false,
    "can_be_batched": true,
    "ai_description": "Generate and send personalized style guide based on session type and client preferences"
  },
  {
    "task": "Pre-session consultation call", 
    "offset_days": -3, 
    "order": 3,
    "can_be_automated": false,
    "estimated_hours": 0.5,
    "requires_photographer": true,
    "can_be_batched": false
  },
  {
    "task": "Session day", 
    "offset_days": 0, 
    "order": 4, 
    "highlight": true,
    "can_be_automated": false,
    "estimated_hours": 3.0,
    "requires_photographer": true,
    "can_be_batched": false
  },
  {
    "task": "Preview gallery curation & delivery", 
    "offset_days": 2, 
    "order": 5,
    "can_be_automated": true,
    "estimated_hours": 0.0,
    "requires_photographer": false,
    "can_be_batched": true,
    "ai_description": "AI curates best 15-20 images and sends preview gallery link to client"
  },
  {
    "task": "Complete gallery editing", 
    "offset_days": 5, 
    "order": 6,
    "can_be_automated": false,
    "estimated_hours": 2.0,
    "requires_photographer": true,
    "can_be_batched": true
  },
  {
    "task": "Final gallery delivery & client notification", 
    "offset_days": 7, 
    "order": 7,
    "can_be_automated": true,
    "estimated_hours": 0.0,
    "requires_photographer": false,
    "can_be_batched": true,
    "ai_description": "Upload final gallery and send personalized delivery email to client"
  }
]');

-- 5. Create intelligent timeline generation function
CREATE OR REPLACE FUNCTION generate_intelligent_timeline(
  p_session_id UUID,
  p_session_type VARCHAR,
  p_session_date DATE
) RETURNS VOID AS $$
DECLARE
  template_record RECORD;
  task_record RECORD;
  calculated_date DATE;
  adjusted_date DATE;
  workload_factor DECIMAL;
BEGIN
  -- Get the template for this session type
  SELECT tasks INTO template_record 
  FROM timeline_templates 
  WHERE session_type = p_session_type 
  LIMIT 1;
  
  -- Calculate workload factor (how busy we are around this time)
  SELECT 
    CASE 
      WHEN AVG(photographer_hours_scheduled / photographer_hours_available) > 0.8 THEN 1.5
      WHEN AVG(photographer_hours_scheduled / photographer_hours_available) > 0.6 THEN 1.2  
      ELSE 1.0
    END INTO workload_factor
  FROM workload_capacity 
  WHERE date BETWEEN p_session_date - INTERVAL '14 days' AND p_session_date + INTERVAL '14 days';
  
  -- Default workload factor if no data
  workload_factor := COALESCE(workload_factor, 1.0);
  
  -- If template exists, create timeline items
  IF template_record.tasks IS NOT NULL THEN
    FOR task_record IN SELECT * FROM jsonb_array_elements(template_record.tasks)
    LOOP
      -- Calculate base date
      calculated_date := p_session_date + (task_record.value->>'offset_days')::INTEGER;
      
      -- Adjust date based on workload (only for tasks that require photographer time)
      IF (task_record.value->>'requires_photographer')::BOOLEAN AND workload_factor > 1.0 THEN
        adjusted_date := calculated_date + FLOOR(workload_factor)::INTEGER;
      ELSE
        adjusted_date := calculated_date;
      END IF;
      
      INSERT INTO session_timelines (
        session_id,
        task_name,
        calculated_date,
        adjusted_date,
        days_offset,
        task_order,
        can_be_automated,
        estimated_work_hours,
        requires_photographer,
        can_be_batched
      ) VALUES (
        p_session_id,
        task_record.value->>'task',
        calculated_date,
        adjusted_date,
        (task_record.value->>'offset_days')::INTEGER,
        (task_record.value->>'order')::INTEGER,
        COALESCE((task_record.value->>'can_be_automated')::BOOLEAN, false),
        COALESCE((task_record.value->>'estimated_hours')::DECIMAL, 0.0),
        COALESCE((task_record.value->>'requires_photographer')::BOOLEAN, true),
        COALESCE((task_record.value->>'can_be_batched')::BOOLEAN, false)
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create API webhook endpoints table for n8n integration
CREATE TABLE IF NOT EXISTS ai_automation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_task_id UUID REFERENCES session_timelines(id),
  webhook_url TEXT,
  webhook_payload JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Enable RLS on all tables
ALTER TABLE timeline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_automation_webhooks ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
CREATE POLICY "Templates readable by authenticated" ON timeline_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own session timelines" ON session_timelines
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can manage all timelines" ON session_timelines
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('sean@ardenoak.co', 'hello@ardenoak.co')
  );

CREATE POLICY "Admin users can manage workload" ON workload_capacity
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('sean@ardenoak.co', 'hello@ardenoak.co')
  );

CREATE POLICY "Admin users can manage webhooks" ON ai_automation_webhooks  
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('sean@ardenoak.co', 'hello@ardenoak.co')
  );

-- 9. Create view for client timeline display (hides automation details)
CREATE OR REPLACE VIEW client_timeline_view AS
SELECT 
  st.session_id,
  st.task_name,
  COALESCE(st.adjusted_date, st.calculated_date) as display_date,
  st.task_order,
  CASE WHEN st.task_name LIKE '%Session day%' THEN true ELSE false END as highlight,
  st.is_completed
FROM session_timelines st
ORDER BY st.task_order;

SELECT 'Intelligent Timeline System with AI Integration created successfully!' as message;