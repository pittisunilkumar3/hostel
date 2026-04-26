-- ============================================================
-- 017_tax_system.sql
-- Tax system for hostel management
-- ============================================================

USE hostel_db;

-- Tax rates table (GST, VAT, Service Charge, etc.)
CREATE TABLE IF NOT EXISTS taxes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  description TEXT DEFAULT NULL,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tax configuration (system-wide settings)
CREATE TABLE IF NOT EXISTS tax_configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order taxes (applied taxes per booking)
CREATE TABLE IF NOT EXISTS order_taxes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  tax_id INT NOT NULL,
  tax_name VARCHAR(100) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  tax_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (tax_id) REFERENCES taxes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add tax columns to bookings table (safe check)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'sub_total');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN sub_total DOUBLE DEFAULT NULL AFTER total_amount, ADD COLUMN tax_amount DOUBLE DEFAULT 0 AFTER sub_total, ADD COLUMN discount_amount DOUBLE DEFAULT 0 AFTER tax_amount',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default tax configuration (ignore duplicates)
INSERT IGNORE INTO tax_configurations (config_key, config_value, is_active) VALUES
  ('tax_inclusive', '0', 1),
  ('tax_rounding', 'standard', 1),
  ('tax_display', 'itemized', 1),
  ('apply_tax_on_discount', '1', 1);

-- Insert sample taxes for India (GST)
INSERT IGNORE INTO taxes (name, rate, type, is_active, description, priority) VALUES
  ('CGST', 9.00, 'percentage', 1, 'Central Goods and Services Tax', 10),
  ('SGST', 9.00, 'percentage', 1, 'State Goods and Services Tax', 10),
  ('IGST', 18.00, 'percentage', 0, 'Integrated Goods and Services Tax (for inter-state)', 10),
  ('Service Charge', 5.00, 'percentage', 0, 'Service charge on room booking', 5),
  ('TCS', 1.00, 'percentage', 0, 'Tax Collected at Source', 1);
