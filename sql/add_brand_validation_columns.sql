-- Migration: Add brand validation columns to campaigns table
-- Purpose: Store brand validation results in dedicated columns for better query performance
-- Date: 2025-10-15

USE campaigns_db;

-- Add brand validation status column
ALTER TABLE campaigns 
ADD COLUMN brand_validation_status VARCHAR(20) NULL 
COMMENT 'Brand validation status: passed, warning, error, skipped, not_validated';

-- Add brand validation message column
ALTER TABLE campaigns 
ADD COLUMN brand_validation_message TEXT NULL 
COMMENT 'Human-readable brand validation message';

-- Add brand validation result column (JSON with complete details)
ALTER TABLE campaigns 
ADD COLUMN brand_validation_result JSON NULL 
COMMENT 'Complete brand validation result including colors, compliance percentage, etc.';

-- Add index on brand_validation_status for faster filtering
CREATE INDEX idx_brand_validation_status ON campaigns(brand_validation_status);

-- Add index on completed campaigns with brand validation
CREATE INDEX idx_completed_brand_validated ON campaigns(status, brand_validation_status);

-- Show the updated table structure
DESCRIBE campaigns;

-- Verify columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'campaigns_db' 
  AND TABLE_NAME = 'campaigns' 
  AND COLUMN_NAME LIKE 'brand_validation%';

-- Example queries enabled by new columns:

-- 1. Get campaigns with high brand compliance
-- SELECT id, description, brand_validation_status,
--        JSON_EXTRACT(brand_validation_result, '$.compliance_percentage') as compliance
-- FROM campaigns
-- WHERE brand_validation_status = 'passed'
--   AND JSON_EXTRACT(brand_validation_result, '$.compliance_percentage') >= 70.0;

-- 2. Get campaigns that need review
-- SELECT id, description, brand_validation_message
-- FROM campaigns
-- WHERE brand_validation_status = 'warning';

-- 3. Average compliance by date
-- SELECT 
--     DATE(created_at) as date,
--     AVG(JSON_EXTRACT(brand_validation_result, '$.compliance_percentage')) as avg_compliance,
--     COUNT(*) as total_campaigns
-- FROM campaigns
-- WHERE brand_validation_status IN ('passed', 'warning')
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- 4. Find most common matched brand colors
-- SELECT 
--     JSON_EXTRACT(brand_validation_result, '$.brand_color_matches') as matched_colors,
--     COUNT(*) as count
-- FROM campaigns
-- WHERE brand_validation_status = 'passed'
-- GROUP BY JSON_EXTRACT(brand_validation_result, '$.brand_color_matches')
-- ORDER BY count DESC
-- LIMIT 10;

-- Migration complete
SELECT 'Brand validation columns added successfully!' as status;

