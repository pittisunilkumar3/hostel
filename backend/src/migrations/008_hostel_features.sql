-- Migration: 008_hostel_features.sql
-- Created: 2026-04-25
-- Description: Add meta_data, qr_code, business_settings for hostels + conversations linking

USE hostel_db;

-- Add meta_data and qr_code columns to hostels table
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_image VARCHAR(500) DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_index ENUM('index','noindex') NOT NULL DEFAULT 'index';
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_no_follow TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_no_image_index TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_no_archive TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_no_snippet TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_max_snippet INT DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_max_video_preview INT DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS meta_max_image_preview ENUM('large','medium','small') DEFAULT NULL;

-- QR Code data for hostels
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS qr_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS qr_description TEXT DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS qr_phone VARCHAR(50) DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS qr_website VARCHAR(255) DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS qr_code_data TEXT DEFAULT NULL;

-- Business Settings per hostel
CREATE TABLE IF NOT EXISTS business_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY unique_hostel_key (hostel_id, `key`),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  INDEX idx_hostel_id (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conversations linked to hostels (add hostel_id to existing conversations)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS hostel_id INT DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS owner_id INT DEFAULT NULL;
ALTER TABLE conversations ADD FOREIGN KEY IF NOT EXISTS (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL;

-- Seed default business settings for existing hostels
INSERT IGNORE INTO business_settings (hostel_id, `key`, value)
SELECT h.id, bs.`key`, bs.value
FROM hostels h
CROSS JOIN (
  SELECT 'commission_rate' as `key`, '10' as value
  UNION ALL SELECT 'min_withdraw', '500'
  UNION ALL SELECT 'max_withdraw', '50000'
  UNION ALL SELECT 'auto_approve_bookings', '0'
  UNION ALL SELECT 'allow_discount', '1'
  UNION ALL SELECT 'cancellation_window_hours', '24'
  UNION ALL SELECT 'refund_policy', 'partial'
  UNION ALL SELECT 'tax_enabled', '0'
  UNION ALL SELECT 'tax_rate', '0'
  UNION ALL SELECT 'platform_fee', '0'
) bs;
