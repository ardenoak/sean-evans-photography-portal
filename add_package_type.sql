-- Add package_type column to custom_packages table
ALTER TABLE custom_packages 
ADD COLUMN IF NOT EXISTS package_type TEXT 
CHECK (package_type IN ('experience', 'enhancement', 'motion')) 
DEFAULT 'experience';

-- Update existing packages to have a default package_type
UPDATE custom_packages 
SET package_type = 'experience' 
WHERE package_type IS NULL;