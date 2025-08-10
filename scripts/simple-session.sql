-- Simple session creation
-- First, let's check if you have a client profile
SELECT id, first_name, last_name, email FROM clients;

-- Then use that ID in the INSERT below (replace YOUR_CLIENT_ID with the actual ID from above)
-- INSERT INTO sessions (client_id, session_type, session_title, session_date, session_time, location, duration, photographer, investment, status) VALUES ('YOUR_CLIENT_ID_HERE', 'Executive Portrait Session', 'Professional Headshots & Brand Photography', 'Saturday, February 22, 2025', '2:00 PM', 'Downtown Studio', '2 Hours', 'Sean Evans', '$897', 'Confirmed & Scheduled');