-- Fix duplicate profiles and prevent future duplicates
-- This script will clean up existing duplicates and add constraints

-- Step 1: See current duplicates
SELECT user_id, email, COUNT(*) as profile_count
FROM clients 
GROUP BY user_id, email 
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- Step 2: Clean up duplicates - keep the most recent profile for each user
WITH duplicates AS (
  SELECT id, user_id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM clients
  WHERE user_id IS NOT NULL
),
to_delete AS (
  SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM clients WHERE id IN (SELECT id FROM to_delete);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE clients ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);

-- Step 4: Verify cleanup worked
SELECT 'Cleanup complete. Profile counts per user:' as message;
SELECT user_id, email, COUNT(*) as profile_count
FROM clients 
WHERE user_id IS NOT NULL
GROUP BY user_id, email 
ORDER BY profile_count DESC;