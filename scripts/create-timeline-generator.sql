-- Create function to automatically generate timeline when session is created
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION generate_session_timeline(
  p_session_id UUID,
  p_session_type VARCHAR,
  p_session_date DATE
) RETURNS VOID AS $$
DECLARE
  template_record RECORD;
  task_record RECORD;
  calculated_date DATE;
  adjusted_date DATE;
BEGIN
  -- Get the template for this session type
  SELECT tasks INTO template_record 
  FROM timeline_templates 
  WHERE session_type = p_session_type 
  LIMIT 1;
  
  -- If template exists, create timeline items
  IF template_record.tasks IS NOT NULL THEN
    FOR task_record IN SELECT * FROM jsonb_array_elements(template_record.tasks)
    LOOP
      -- Calculate base date
      calculated_date := p_session_date + (task_record.value->>'offset_days')::INTEGER;
      adjusted_date := calculated_date; -- No workload adjustment for now
      
      INSERT INTO session_timelines (
        session_id,
        task_name,
        calculated_date,
        adjusted_date,
        days_offset,
        task_order,
        can_be_automated,
        approval_required,
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
        COALESCE((task_record.value->>'approval_required')::BOOLEAN, false),
        COALESCE((task_record.value->>'estimated_hours')::DECIMAL, 0.0),
        COALESCE((task_record.value->>'requires_photographer')::BOOLEAN, true),
        COALESCE((task_record.value->>'can_be_batched')::BOOLEAN, false)
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate timeline when session is created
CREATE OR REPLACE FUNCTION trigger_generate_timeline() 
RETURNS TRIGGER AS $$
BEGIN
  -- Generate timeline for the new session
  PERFORM generate_session_timeline(
    NEW.id,
    NEW.session_type,
    NEW.session_date::DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_generate_timeline ON sessions;

-- Create the trigger
CREATE TRIGGER auto_generate_timeline
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_timeline();

SELECT 'Timeline auto-generation system created!' as message;