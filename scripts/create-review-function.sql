-- Create the review_ai_content function for the admin interface
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION review_ai_content(
  p_approval_id UUID,
  p_admin_email VARCHAR,
  p_decision VARCHAR, -- 'approved', 'rejected', 'needs_revision'
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  timeline_task_id_val UUID;
BEGIN
  -- Get timeline task id
  SELECT timeline_task_id INTO timeline_task_id_val
  FROM ai_task_approvals
  WHERE id = p_approval_id;
  
  -- Update approval record
  UPDATE ai_task_approvals SET
    approval_status = p_decision,
    reviewed_by = p_admin_email,
    reviewed_at = NOW(),
    approval_notes = p_notes
  WHERE id = p_approval_id;
  
  -- Update timeline task based on decision
  IF p_decision = 'approved' THEN
    UPDATE session_timelines SET
      approval_status = 'approved',
      automation_status = 'approved_ready_to_execute'
    WHERE id = timeline_task_id_val;
  ELSIF p_decision = 'rejected' THEN  
    UPDATE session_timelines SET
      approval_status = 'rejected',
      automation_status = 'rejected'
    WHERE id = timeline_task_id_val;
  ELSIF p_decision = 'needs_revision' THEN
    UPDATE session_timelines SET
      approval_status = 'revision_needed',
      automation_status = 'pending_revision'
    WHERE id = timeline_task_id_val;
    
    -- Update revision tracking
    UPDATE ai_task_approvals SET
      revision_requested_at = NOW(),
      revision_notes = p_notes,
      revision_count = revision_count + 1
    WHERE id = p_approval_id;
  END IF;
END;
$$ LANGUAGE plpgsql;