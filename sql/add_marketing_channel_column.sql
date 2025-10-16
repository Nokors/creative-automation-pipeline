-- Add marketing_channel column to campaigns table
-- Migration for marketing channel type feature

-- Add marketing_channel column to track the campaign's distribution channel
ALTER TABLE campaigns
ADD COLUMN marketing_channel VARCHAR(100) AFTER products_description;

-- Optional: Add an index if querying by marketing_channel is frequent
CREATE INDEX idx_campaigns_marketing_channel ON campaigns (marketing_channel);

-- Update existing records to set a default value if needed
-- UPDATE campaigns SET marketing_channel = 'other' WHERE marketing_channel IS NULL;

-- Example of how to check the data after migration
-- SELECT id, description, marketing_channel FROM campaigns LIMIT 10;
-- SELECT marketing_channel, COUNT(*) FROM campaigns GROUP BY marketing_channel;

-- Verify the column was added
-- DESCRIBE campaigns;

