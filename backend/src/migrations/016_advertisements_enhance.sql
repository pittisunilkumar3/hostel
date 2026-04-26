-- Migration: 016_advertisements_enhance.sql
-- Created: 2026-04-26
-- Description: Enhance advertisements table with missing columns and indexes

-- Add missing columns (ignore errors if column already exists)
ALTER TABLE advertisements ADD COLUMN pause_note TEXT DEFAULT NULL AFTER status;
ALTER TABLE advertisements ADD COLUMN cancellation_note TEXT DEFAULT NULL AFTER pause_note;
ALTER TABLE advertisements ADD COLUMN is_updated TINYINT(1) NOT NULL DEFAULT 0 AFTER cancellation_note;
ALTER TABLE advertisements ADD COLUMN created_by_type VARCHAR(50) DEFAULT NULL COMMENT 'admin or owner' AFTER is_updated;
ALTER TABLE advertisements ADD COLUMN created_by_id INT DEFAULT NULL COMMENT 'user id who created' AFTER created_by_type;

-- Add indexes (ignore errors if index already exists)
ALTER TABLE advertisements ADD INDEX idx_status (status);
ALTER TABLE advertisements ADD INDEX idx_active (active);
ALTER TABLE advertisements ADD INDEX idx_owner_id (owner_id);
ALTER TABLE advertisements ADD INDEX idx_is_paid (is_paid);
ALTER TABLE advertisements ADD INDEX idx_start_date (start_date);
ALTER TABLE advertisements ADD INDEX idx_end_date (end_date);
ALTER TABLE advertisements ADD INDEX idx_add_type (add_type);
ALTER TABLE advertisements ADD INDEX idx_priority (priority);

-- Update existing admin-created records to set created_by_type
UPDATE advertisements SET created_by_type = 'admin' WHERE created_by_type IS NULL;
