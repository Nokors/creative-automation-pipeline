-- Add Dropbox upload tracking columns to campaigns table
-- Migration for Dropbox backup feature

-- Add dropbox_uploaded column to track upload status
ALTER TABLE campaigns
ADD COLUMN dropbox_uploaded ENUM('true', 'false') DEFAULT 'false';

-- Add dropbox_links column to store Dropbox paths and shared links
ALTER TABLE campaigns
ADD COLUMN dropbox_links JSON;

-- Update existing records to set default value
UPDATE campaigns
SET dropbox_uploaded = 'false'
WHERE dropbox_uploaded IS NULL;

-- Optional: Add an index if querying by dropbox_uploaded is frequent
CREATE INDEX idx_campaigns_dropbox_uploaded ON campaigns (dropbox_uploaded);

-- Example of how to check the data after migration
-- SELECT id, status, dropbox_uploaded, dropbox_links FROM campaigns WHERE status = 'completed' LIMIT 5;
-- SELECT dropbox_uploaded, COUNT(*) FROM campaigns GROUP BY dropbox_uploaded;

