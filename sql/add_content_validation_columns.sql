-- Migration: Add content validation columns to campaigns table
-- This adds support for tracking content validation status

ALTER TABLE campaigns 
ADD COLUMN content_validation_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN content_validation_message TEXT DEFAULT NULL;

-- Update existing campaigns to have 'not_validated' status
UPDATE campaigns 
SET content_validation_status = 'not_validated',
    content_validation_message = 'Validation status not tracked for campaigns created before this feature'
WHERE content_validation_status IS NULL;

-- Add index for faster queries on validation status
CREATE INDEX idx_campaigns_validation_status ON campaigns(content_validation_status);

-- Verify migration
SELECT 
    COUNT(*) as total_campaigns,
    content_validation_status,
    COUNT(*) as count_by_status
FROM campaigns
GROUP BY content_validation_status;

