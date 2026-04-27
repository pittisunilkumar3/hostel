-- ============================================================
-- MIGRATION 024: Fix rooms table - add missing columns
-- Created: 2026-04-27
-- Description: Adds missing columns to rooms table for 
--              floor/room management feature
-- ============================================================

USE hostel_db;

-- Add pricing_type column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'pricing_type');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN pricing_type VARCHAR(20) DEFAULT ''monthly'' AFTER status',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add price_per_hour column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'price_per_hour');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN price_per_hour DOUBLE DEFAULT NULL AFTER price_per_month',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add price_per_day column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'price_per_day');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN price_per_day DOUBLE DEFAULT NULL AFTER price_per_hour',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add custom_pricing column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'custom_pricing');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN custom_pricing JSON DEFAULT NULL AFTER price_per_day',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add furnishing column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'furnishing');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN furnishing JSON DEFAULT NULL AFTER amenities',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add dimensions column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'dimensions');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN dimensions JSON DEFAULT NULL AFTER furnishing',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add images column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'images');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN images JSON DEFAULT NULL AFTER description',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_active column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'is_active');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER images',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Fix the type enum to include all room types
-- ============================================================

-- Alter the type column to support more room types
ALTER TABLE rooms MODIFY COLUMN type ENUM(
  'SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 
  'FIVE_BED', 'SIX_BED', 'SEVEN_BED', 'EIGHT_BED', 
  'NINE_BED', 'TEN_BED', 'DORMITORY'
) NOT NULL DEFAULT 'SINGLE';

-- ============================================================
-- Verification
-- ============================================================
-- Run: DESCRIBE rooms; to verify all columns are added
