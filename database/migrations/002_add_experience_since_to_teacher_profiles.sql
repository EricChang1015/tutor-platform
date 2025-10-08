-- Migration: Add experience_since field to teacher_profiles
-- Date: 2025-10-08
-- Description: Replace experience_years with experience_since for better profile management

-- Add new experience_since column
ALTER TABLE teacher_profiles 
ADD COLUMN experience_since INTEGER NULL;

-- Update existing records with calculated experience_since based on experience_years
-- Assuming current year is 2025, calculate experience_since from experience_years
UPDATE teacher_profiles 
SET experience_since = 2025 - experience_years 
WHERE experience_years > 0;

-- Add comment to explain the field
COMMENT ON COLUMN teacher_profiles.experience_since IS 'Year when teacher started teaching (e.g., 2020)';

-- Update teacher_gallery table to support audio files
ALTER TABLE teacher_gallery 
ALTER COLUMN type TYPE VARCHAR(20),
ADD CONSTRAINT teacher_gallery_type_check 
CHECK (type IN ('image', 'video', 'audio', 'other'));

-- Drop the old constraint first
ALTER TABLE teacher_gallery 
DROP CONSTRAINT IF EXISTS teacher_gallery_type_check1;

-- Add the new constraint
ALTER TABLE teacher_gallery 
ADD CONSTRAINT teacher_gallery_type_check 
CHECK (type IN ('image', 'video', 'audio', 'other'));

-- Add filename column for better file management
ALTER TABLE teacher_gallery 
ADD COLUMN filename VARCHAR(255) NULL;

-- Update existing records with default filename
UPDATE teacher_gallery 
SET filename = 'gallery-' || teacher_id || '-' || EXTRACT(EPOCH FROM uploaded_at) || '.jpg'
WHERE filename IS NULL;

-- Add index for better performance
CREATE INDEX idx_teacher_gallery_type ON teacher_gallery(type);
CREATE INDEX idx_teacher_gallery_teacher_type ON teacher_gallery(teacher_id, type);

-- Note: We keep experience_years for backward compatibility
-- It can be calculated as: EXTRACT(YEAR FROM CURRENT_DATE) - experience_since
-- In application code, we should use experience_since as the primary field
