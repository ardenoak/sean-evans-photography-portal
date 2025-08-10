-- Sample session data
-- Run this in your Supabase SQL Editor to add a test session

-- First, let's find your client ID (replace YOUR_EMAIL with your actual email)
-- SELECT id FROM clients WHERE email = 'YOUR_EMAIL';

-- Then insert a sample session (replace YOUR_CLIENT_ID with the ID from above)
INSERT INTO sessions (
  client_id,
  session_type,
  session_title, 
  session_date,
  session_time,
  location,
  duration,
  photographer,
  investment,
  status,
  timeline
) VALUES (
  'YOUR_CLIENT_ID_HERE', -- Replace with your actual client ID
  'Executive Portrait Session',
  'Professional Headshots & Brand Photography',
  'Saturday, February 22, 2025',
  '2:00 PM',
  'Downtown Studio & Waterfront Location',
  '2 Hours',
  'Sean Evans',
  '$897',
  'Confirmed & Scheduled',
  '[
    {"date": "February 15, 2025", "task": "Pre-session consultation call", "highlight": false},
    {"date": "February 20, 2025", "task": "Wardrobe & styling guide sent", "highlight": false},
    {"date": "February 22, 2025", "task": "Session day", "highlight": true},
    {"date": "February 24, 2025", "task": "Preview gallery delivery", "highlight": false},
    {"date": "February 28, 2025", "task": "Complete gallery delivery", "highlight": false}
  ]'::jsonb
);

-- Add sample documents for the session
INSERT INTO documents (
  client_id,
  session_id,
  title,
  description,
  type,
  status,
  date
) VALUES 
-- Replace YOUR_CLIENT_ID and YOUR_SESSION_ID with actual IDs
(
  'YOUR_CLIENT_ID_HERE',
  (SELECT id FROM sessions WHERE client_id = 'YOUR_CLIENT_ID_HERE' LIMIT 1),
  'Session Contract',
  'Signed agreement for your portrait session',
  'contract',
  'signed',
  'February 10, 2025'
),
(
  'YOUR_CLIENT_ID_HERE',
  (SELECT id FROM sessions WHERE client_id = 'YOUR_CLIENT_ID_HERE' LIMIT 1),
  'Executive Style Guide',
  'Professional wardrobe recommendations for headshots',
  'guide',
  'new',
  'February 20, 2025'
),
(
  'YOUR_CLIENT_ID_HERE',
  (SELECT id FROM sessions WHERE client_id = 'YOUR_CLIENT_ID_HERE' LIMIT 1),
  'Invoice',
  'Payment confirmation and receipt',
  'invoice',
  'paid',
  'February 12, 2025'
);