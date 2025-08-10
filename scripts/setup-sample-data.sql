-- Comprehensive sample data setup
-- This script will automatically find your client ID and add sample data

-- First, let's see your client info (you can check this worked)
SELECT id, first_name, last_name, email FROM clients;

-- Add a sample session with timeline
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
) 
SELECT 
  c.id,
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
FROM clients c
LIMIT 1;

-- Add a second session to show multiple sessions
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
) 
SELECT 
  c.id,
  'Family Legacy Session',
  'Multi-Generational Family Portraits',
  'Sunday, March 15, 2025',
  '10:00 AM',
  'Hampton Park & Rainbow Row',
  '2.5 Hours',
  'Sean Evans',
  '$1,497',
  'Confirmed & Scheduled',
  '[
    {"date": "February 28, 2025", "task": "Pre-session consultation call", "highlight": false},
    {"date": "March 10, 2025", "task": "Style guide & preparation materials sent", "highlight": false},
    {"date": "March 15, 2025", "task": "Session day", "highlight": true},
    {"date": "March 17, 2025", "task": "Preview gallery delivery", "highlight": false},
    {"date": "March 22, 2025", "task": "Complete gallery delivery", "highlight": false}
  ]'::jsonb
FROM clients c
LIMIT 1;

-- Add sample documents for the first session
INSERT INTO documents (
  client_id,
  session_id,
  title,
  description,
  type,
  status,
  date
)
SELECT 
  c.id,
  s.id,
  'Session Contract',
  'Signed agreement for your portrait session',
  'contract',
  'signed',
  'February 10, 2025'
FROM clients c
JOIN sessions s ON s.client_id = c.id
WHERE s.session_title = 'Professional Headshots & Brand Photography'
LIMIT 1;

INSERT INTO documents (
  client_id,
  session_id,
  title,
  description,
  type,
  status,
  date
)
SELECT 
  c.id,
  s.id,
  'Executive Style Guide',
  'Professional wardrobe recommendations for headshots',
  'guide',
  'new',
  'February 20, 2025'
FROM clients c
JOIN sessions s ON s.client_id = c.id
WHERE s.session_title = 'Professional Headshots & Brand Photography'
LIMIT 1;

INSERT INTO documents (
  client_id,
  session_id,
  title,
  description,
  type,
  status,
  date
)
SELECT 
  c.id,
  s.id,
  'Invoice',
  'Payment confirmation and receipt',
  'invoice',
  'paid',
  'February 12, 2025'
FROM clients c
JOIN sessions s ON s.client_id = c.id
WHERE s.session_title = 'Professional Headshots & Brand Photography'
LIMIT 1;

-- Add documents for the second session
INSERT INTO documents (
  client_id,
  session_id,
  title,
  description,
  type,
  status,
  date
)
SELECT 
  c.id,
  s.id,
  'Family Session Contract',
  'Signed agreement for your family portrait session',
  'contract',
  'signed',
  'March 1, 2025'
FROM clients c
JOIN sessions s ON s.client_id = c.id
WHERE s.session_title = 'Multi-Generational Family Portraits'
LIMIT 1;

INSERT INTO documents (
  client_id,
  session_id,
  title,
  description,
  type,
  status,
  date
)
SELECT 
  c.id,
  s.id,
  'Family Style Guide',
  'Comprehensive wardrobe recommendations and styling tips',
  'guide',
  'new',
  'March 10, 2025'
FROM clients c
JOIN sessions s ON s.client_id = c.id
WHERE s.session_title = 'Multi-Generational Family Portraits'
LIMIT 1;

-- Verify the data was added
SELECT 'Sessions created:' as message;
SELECT session_title, session_date, status FROM sessions;

SELECT 'Documents created:' as message;
SELECT title, type, status FROM documents;