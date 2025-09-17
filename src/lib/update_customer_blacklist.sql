-- Add isBlacklisted column to customer table
-- Run this SQL script to update the customer table schema

USE trustwin;

-- Add isBlacklisted column with default value FALSE
ALTER TABLE `customer`
ADD COLUMN `isBlacklisted` BOOLEAN NOT NULL DEFAULT FALSE
AFTER `status`;

-- Optional: Create an index on isBlacklisted for better query performance
ALTER TABLE `customer`
ADD INDEX `idx_isBlacklisted` (`isBlacklisted`);

-- Optional: Create an index on nic for faster lookups when checking blacklist status
ALTER TABLE `customer`
ADD INDEX `idx_nic` (`nic`);

COMMIT;