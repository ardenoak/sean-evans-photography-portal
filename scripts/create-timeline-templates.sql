-- Create timeline templates for different session types
-- Run this in Supabase SQL Editor

-- Insert Branding Session template
INSERT INTO timeline_templates (session_type, tasks) VALUES (
  'Branding Session',
  '[
    {
      "task": "Contract & payment confirmed",
      "offset_days": -14,
      "order": 1,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Brand questionnaire sent & completed",
      "offset_days": -10,
      "order": 2,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Style guide & mood board creation",
      "offset_days": -7,
      "order": 3,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 2.0,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Location scouting & preparation",
      "offset_days": -5,
      "order": 4,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 1.5,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Pre-session consultation call",
      "offset_days": -2,
      "order": 5,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Session day - Branding photography",
      "offset_days": 0,
      "order": 6,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 3.0,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Initial photo selection & editing",
      "offset_days": 2,
      "order": 7,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 4.0,
      "requires_photographer": true,
      "can_be_batched": true
    },
    {
      "task": "Preview gallery delivery",
      "offset_days": 3,
      "order": 8,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Client selection & final editing",
      "offset_days": 10,
      "order": 9,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 3.0,
      "requires_photographer": true,
      "can_be_batched": true
    },
    {
      "task": "Complete brand package delivery",
      "offset_days": 14,
      "order": 10,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": true
    }
  ]'::jsonb
);

-- Insert Portrait Session template  
INSERT INTO timeline_templates (session_type, tasks) VALUES (
  'Portrait Session',
  '[
    {
      "task": "Contract & payment confirmed",
      "offset_days": -14,
      "order": 1,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Style guide & preparation materials sent",
      "offset_days": -7,
      "order": 2,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": true
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
      "task": "Session day - Portrait photography",
      "offset_days": 0,
      "order": 4,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 2.0,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Photo editing & enhancement",
      "offset_days": 2,
      "order": 5,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 3.0,
      "requires_photographer": true,
      "can_be_batched": true
    },
    {
      "task": "Preview gallery delivery",
      "offset_days": 3,
      "order": 6,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Final selection & delivery",
      "offset_days": 7,
      "order": 7,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": true
    }
  ]'::jsonb
);

-- Insert Executive Session template
INSERT INTO timeline_templates (session_type, tasks) VALUES (
  'Executive Session',
  '[
    {
      "task": "Contract & payment confirmed",
      "offset_days": -21,
      "order": 1,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Executive style consultation",
      "offset_days": -14,
      "order": 2,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 1.5,
      "requires_photographer": false,
      "can_be_batched": false
    },
    {
      "task": "Wardrobe & styling guide delivery",
      "offset_days": -10,
      "order": 3,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 2.0,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Location & setup planning",
      "offset_days": -7,
      "order": 4,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 1.0,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Pre-session strategy call",
      "offset_days": -2,
      "order": 5,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 0.75,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Session day - Executive portraits",
      "offset_days": 0,
      "order": 6,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 2.5,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Professional retouching & editing",
      "offset_days": 2,
      "order": 7,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 4.0,
      "requires_photographer": true,
      "can_be_batched": true
    },
    {
      "task": "Preview gallery with selections",
      "offset_days": 4,
      "order": 8,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Final high-resolution delivery",
      "offset_days": 7,
      "order": 9,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "LinkedIn & website optimization guide",
      "offset_days": 10,
      "order": 10,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 1.5,
      "requires_photographer": false,
      "can_be_batched": true
    }
  ]'::jsonb
);

-- Insert Family Session template
INSERT INTO timeline_templates (session_type, tasks) VALUES (
  'Family Session',
  '[
    {
      "task": "Contract & payment confirmed",
      "offset_days": -14,
      "order": 1,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Family preparation guide sent",
      "offset_days": -10,
      "order": 2,
      "can_be_automated": true,
      "approval_required": true,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Location & timing consultation",
      "offset_days": -7,
      "order": 3,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Pre-session family call",
      "offset_days": -2,
      "order": 4,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Session day - Family portraits",
      "offset_days": 0,
      "order": 5,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 1.5,
      "requires_photographer": true,
      "can_be_batched": false
    },
    {
      "task": "Photo editing & enhancement",
      "offset_days": 2,
      "order": 6,
      "can_be_automated": false,
      "approval_required": false,
      "estimated_hours": 3.0,
      "requires_photographer": true,
      "can_be_batched": true
    },
    {
      "task": "Online gallery delivery",
      "offset_days": 5,
      "order": 7,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 0.5,
      "requires_photographer": false,
      "can_be_batched": true
    },
    {
      "task": "Print & product ordering consultation",
      "offset_days": 14,
      "order": 8,
      "can_be_automated": true,
      "approval_required": false,
      "estimated_hours": 1.0,
      "requires_photographer": false,
      "can_be_batched": false
    }
  ]'::jsonb
);

SELECT 'Timeline templates created successfully!' as message;