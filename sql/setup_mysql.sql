-- MySQL Database Setup Script
-- Run this script to create the database and user for the Campaign API

-- Create database
CREATE DATABASE IF NOT EXISTS campaigns_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change password in production)
CREATE USER IF NOT EXISTS 'campaign_user'@'localhost' IDENTIFIED BY 'your_password';
CREATE USER IF NOT EXISTS 'campaign_user'@'%' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON campaigns_db.* TO 'campaign_user'@'localhost';
GRANT ALL PRIVILEGES ON campaigns_db.* TO 'campaign_user'@'%';

-- Apply privileges
FLUSH PRIVILEGES;

-- Use the database
USE campaigns_db;

-- Show database info
SELECT 'Database setup complete!' AS status;
SHOW DATABASES LIKE 'campaigns_db';

