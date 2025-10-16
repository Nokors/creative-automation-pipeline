-- Add auto_upload_to_dropbox column to campaigns table
-- Migration for automatic Dropbox upload feature

-- Add auto_upload_to_dropbox column to track if campaign should auto-upload to Dropbox
ALTER TABLE campaigns
ADD COLUMN auto_upload_to_dropbox ENUM('true', 'false') DEFAULT 'false' AFTER generate_by_ai;

-- Update existing records to set default value
UPDATE campaigns
SET auto_upload_to_dropbox = 'false'
WHERE auto_upload_to_dropbox IS NULL;

-- Optional: Add an index if querying by auto_upload_to_dropbox is frequent
CREATE INDEX idx_campaigns_auto_upload_dropbox ON campaigns (auto_upload_to_dropbox);

-- Example of how to check the data after migration
-- SELECT id, description, generate_by_ai, auto_upload_to_dropbox, dropbox_uploaded FROM campaigns LIMIT 5;
-- SELECT auto_upload_to_dropbox, COUNT(*) FROM campaigns GROUP BY auto_upload_to_dropbox;

-- Verify the column was added
-- DESCRIBE campaigns;

