-- ============================================================
-- MIGRATION 026: Enhanced bookings for hourly/daily/monthly
-- Adds booking_type, duration, guest info, hostel_id, etc.
-- ============================================================

USE hostel_db;

-- Add hostel_id to bookings
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'hostel_id');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN hostel_id INT AFTER student_id',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add booking_type column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_type');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN booking_type ENUM(''hourly'',''daily'',''monthly'') DEFAULT ''monthly'' AFTER hostel_id',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add duration (number of hours/days/months)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'duration');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN duration INT DEFAULT 1 AFTER booking_type',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add number of guests
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'guests');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN guests INT DEFAULT 1 AFTER duration',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add guest name
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'guest_name');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN guest_name VARCHAR(255) DEFAULT NULL AFTER guests',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add guest phone
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'guest_phone');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(20) DEFAULT NULL AFTER guest_name',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add guest email
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'guest_email');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN guest_email VARCHAR(255) DEFAULT NULL AFTER guest_phone',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add special requests
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'special_requests');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN special_requests TEXT DEFAULT NULL AFTER guest_email',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unit_price (price per unit at time of booking)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'unit_price');
SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN unit_price DOUBLE DEFAULT 0 AFTER total_amount',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for hostel_id
-- SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
--   WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND CONSTRAINT_NAME = 'bookings_hostel_id_foreign');
-- SET @alter_sql = IF(@fk_exists = 0,
--   'ALTER TABLE bookings ADD FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL',
--   'SELECT 1');
-- PREPARE stmt FROM @alter_sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

CREATE INDEX IF NOT EXISTS idx_bookings_hostel ON bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
