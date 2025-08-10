-- Safe cleanup of duplicate client profiles
-- This will reassign all sessions and documents to one profile, then delete duplicates

-- Step 1: Find your user ID and see all profiles
SELECT user_id, id, email, first_name, last_name, created_at 
FROM clients 
WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
ORDER BY created_at DESC;

-- Step 2: Get the most recent profile ID (we'll keep this one)
WITH keep_profile AS (
  SELECT id as keep_id
  FROM clients 
  WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
  ORDER BY created_at DESC 
  LIMIT 1
),
old_profiles AS (
  SELECT id as old_id
  FROM clients 
  WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
  AND id NOT IN (SELECT keep_id FROM keep_profile)
)

-- Step 3: Update all sessions to point to the kept profile
UPDATE sessions 
SET client_id = (SELECT keep_id FROM keep_profile)
WHERE client_id IN (SELECT old_id FROM old_profiles);

-- Step 4: Update all documents to point to the kept profile  
WITH keep_profile AS (
  SELECT id as keep_id
  FROM clients 
  WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
  ORDER BY created_at DESC 
  LIMIT 1
),
old_profiles AS (
  SELECT id as old_id
  FROM clients 
  WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
  AND id NOT IN (SELECT keep_id FROM keep_profile)
)
UPDATE documents 
SET client_id = (SELECT keep_id FROM keep_profile)
WHERE client_id IN (SELECT old_id FROM old_profiles);

-- Step 5: Now we can safely delete the duplicate profiles
DELETE FROM clients 
WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
AND id NOT IN (
  SELECT id FROM clients 
  WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d'
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 6: Verify cleanup worked
SELECT 'Final profile count:' as message, COUNT(*) as count 
FROM clients 
WHERE user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d';

SELECT 'Sessions linked to profile:' as message, COUNT(*) as count 
FROM sessions s 
JOIN clients c ON s.client_id = c.id 
WHERE c.user_id = '321864d7-7c62-45a7-bf7b-efa39b63325d';