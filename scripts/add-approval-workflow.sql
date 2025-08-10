-- Add Approval Workflow to AI Timeline System
-- Run this in Supabase SQL Editor

-- 1. Create AI task approvals table
CREATE TABLE IF NOT EXISTS ai_task_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_task_id UUID REFERENCES session_timelines(id),
  session_id UUID REFERENCES sessions(id),
  
  -- AI Generated Content
  ai_generated_content JSONB, -- Email draft, style guide content, etc.
  ai_content_type VARCHAR(50), -- 'email', 'style_guide', 'gallery_notification', etc.
  ai_generated_at TIMESTAMP DEFAULT NOW(),
  
  -- Approval Workflow
  approval_status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected', 'needs_revision'
  reviewed_by VARCHAR(100), -- Admin email who reviewed
  reviewed_at TIMESTAMP,
  approval_notes TEXT,
  
  -- Revision History
  revision_count INTEGER DEFAULT 0,
  revision_requested_at TIMESTAMP,
  revision_notes TEXT,
  
  -- Final Execution
  executed_at TIMESTAMP,
  execution_status VARCHAR(20), -- 'pending', 'sent', 'failed'
  execution_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Update session_timelines with approval workflow states
ALTER TABLE session_timelines ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE session_timelines ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'not_required'; 
-- 'not_required', 'pending_ai', 'pending_review', 'approved', 'rejected', 'revision_needed'

-- 3. Update timeline templates to include approval requirements
UPDATE timeline_templates SET tasks = '[
  {
    "task": "Contract signed & payment received", 
    "offset_days": -14, 
    "order": 1,
    "can_be_automated": false,
    "approval_required": false,
    "estimated_hours": 0.5,
    "requires_photographer": true,
    "can_be_batched": false
  },
  {
    "task": "Style guide & preparation materials sent", 
    "offset_days": -7, 
    "order": 2,
    "can_be_automated": true,
    "approval_required": true,
    "ai_content_type": "style_guide",
    "estimated_hours": 0.0,
    "requires_photographer": false,
    "can_be_batched": true,
    "ai_description": "Generate personalized style guide based on session type and client preferences - REQUIRES APPROVAL"
  },
  {
    "task": "Pre-session consultation call", 
    "offset_days": -3, 
    "order": 3,
    "can_be_automated": false,
    "approval_required": false,
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
    "approval_required": false,
    "estimated_hours": 3.0,
    "requires_photographer": true,
    "can_be_batched": false
  },
  {
    "task": "Preview gallery curation & delivery", 
    "offset_days": 2, 
    "order": 5,
    "can_be_automated": true,
    "approval_required": true,
    "ai_content_type": "gallery_notification",
    "estimated_hours": 0.0,
    "requires_photographer": false,
    "can_be_batched": true,
    "ai_description": "AI curates best 15-20 images and drafts preview gallery email - REQUIRES APPROVAL"
  },
  {
    "task": "Complete gallery editing", 
    "offset_days": 5, 
    "order": 6,
    "can_be_automated": false,
    "approval_required": false,
    "estimated_hours": 2.0,
    "requires_photographer": true,
    "can_be_batched": true
  },
  {
    "task": "Final gallery delivery & client notification", 
    "offset_days": 7, 
    "order": 7,
    "can_be_automated": true,
    "approval_required": true,
    "ai_content_type": "final_delivery_email",
    "estimated_hours": 0.0,
    "requires_photographer": false,
    "can_be_batched": true,
    "ai_description": "Upload final gallery and draft personalized delivery email - REQUIRES APPROVAL"
  }
]'
WHERE session_type = 'Portrait Session';

-- 4. Create function to handle AI task approval workflow
CREATE OR REPLACE FUNCTION submit_ai_content_for_approval(
  p_timeline_task_id UUID,
  p_ai_content JSONB,
  p_content_type VARCHAR
) RETURNS UUID AS $$
DECLARE
  approval_id UUID;
  session_id_val UUID;
BEGIN
  -- Get session_id from timeline task
  SELECT session_id INTO session_id_val 
  FROM session_timelines 
  WHERE id = p_timeline_task_id;
  
  -- Create approval record
  INSERT INTO ai_task_approvals (
    timeline_task_id,
    session_id,
    ai_generated_content,
    ai_content_type
  ) VALUES (
    p_timeline_task_id,
    session_id_val,
    p_ai_content,
    p_content_type
  ) RETURNING id INTO approval_id;
  
  -- Update timeline task status
  UPDATE session_timelines 
  SET 
    automation_status = 'pending_approval',
    approval_status = 'pending_review'
  WHERE id = p_timeline_task_id;
  
  RETURN approval_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function for admin to approve/reject content
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

-- 6. Create admin dashboard view for pending approvals
CREATE OR REPLACE VIEW pending_approvals_view AS
SELECT 
  ata.id as approval_id,
  ata.ai_content_type,
  ata.ai_generated_at,
  ata.revision_count,
  
  -- Session details
  s.session_title,
  s.session_date,
  s.session_type,
  
  -- Client details  
  c.first_name || ' ' || c.last_name as client_name,
  c.email as client_email,
  
  -- Timeline task details
  st.task_name,
  st.adjusted_date as due_date,
  
  -- AI content preview (first 200 chars)
  CASE 
    WHEN ata.ai_content_type = 'email' THEN 
      SUBSTRING(ata.ai_generated_content->>'subject', 1, 100) || '...'
    WHEN ata.ai_content_type = 'style_guide' THEN
      'Style guide for ' || s.session_type
    ELSE 
      ata.ai_content_type
  END as content_preview

FROM ai_task_approvals ata
JOIN session_timelines st ON ata.timeline_task_id = st.id
JOIN sessions s ON ata.session_id = s.id  
JOIN clients c ON s.client_id = c.id
WHERE ata.approval_status = 'pending_review'
ORDER BY ata.ai_generated_at ASC;

-- 7. Enable RLS on approval table
ALTER TABLE ai_task_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage approvals" ON ai_task_approvals
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('sean@ardenoak.co', 'hello@ardenoak.co')
  );

-- 8. Create notification function for new approvals (webhook to admin)
CREATE OR REPLACE FUNCTION notify_admin_of_pending_approval() 
RETURNS TRIGGER AS $$
BEGIN
  -- This could trigger a webhook to notify admin of pending approval
  -- For now, we'll just log it
  INSERT INTO ai_automation_webhooks (
    timeline_task_id,
    webhook_url,
    webhook_payload,
    status,
    scheduled_for
  ) VALUES (
    NEW.timeline_task_id,
    'https://your-n8n-webhook-url/admin-notification',
    jsonb_build_object(
      'type', 'approval_needed',
      'approval_id', NEW.id,
      'content_type', NEW.ai_content_type,
      'session_id', NEW.session_id
    ),
    'pending',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin notifications
CREATE TRIGGER trigger_approval_notification
  AFTER INSERT ON ai_task_approvals
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_of_pending_approval();

SELECT 'AI Approval Workflow added successfully!' as message;
SELECT 'Pending approvals can be viewed with: SELECT * FROM pending_approvals_view;' as usage;