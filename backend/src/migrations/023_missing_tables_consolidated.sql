-- ============================================================
-- MIGRATION 023: Create ALL missing tables
-- Created: 2026-04-27
-- Description: Consolidates all missing tables from various
--              scripts and partial migrations into one clean file
-- Tables: 14 missing tables
-- ============================================================

USE hostel_db;

-- ============================================================
-- 1. TAX SYSTEM TABLES (from 017_tax_system.sql)
-- ============================================================

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
  FOREIGN KEY (tax_id) REFERENCES taxes(id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id),
  INDEX idx_tax_id (tax_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. SUBSCRIPTION TABLES (from 021_subscription_plans.sql)
-- ============================================================

-- Subscription plans (admin creates plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_type ENUM('monthly','quarterly','half_yearly','yearly') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  grace_period_days INT DEFAULT 7,
  features TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hostel subscriptions (owner subscribes to a plan)
CREATE TABLE IF NOT EXISTS hostel_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  plan_id INT NOT NULL,
  owner_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL,
  status ENUM('active','expired','cancelled','pending') DEFAULT 'pending',
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  auto_renew TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_hostel_id (hostel_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. FLOOR & ROOM MANAGEMENT (from 022_floor_room_management.sql)
-- ============================================================

-- Floors table
CREATE TABLE IF NOT EXISTS floors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  floor_number INT NOT NULL,
  floor_name VARCHAR(100) NOT NULL,
  description TEXT,
  amenities JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  UNIQUE KEY unique_floor_hostel (hostel_id, floor_number),
  INDEX idx_hostel_id (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. LOYALTY POINT TRANSACTIONS (from 020_missing_tables.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS loyalty_point_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  transaction_id VARCHAR(36) NOT NULL UNIQUE,
  credit INT DEFAULT 0,
  debit INT DEFAULT 0,
  balance INT DEFAULT 0,
  transaction_type VARCHAR(50) NOT NULL,
  reference VARCHAR(191) DEFAULT NULL,
  reference_id VARCHAR(191) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. WALLET SYSTEM TABLES (from create-wallet-tables-v2.ts)
-- ============================================================

-- Owner Wallets
CREATE TABLE IF NOT EXISTS owner_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL UNIQUE,
  total_earning DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  pending_withdraw DECIMAL(12,2) DEFAULT 0.00,
  collected_cash DECIMAL(12,2) DEFAULT 0.00,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Wallets
CREATE TABLE IF NOT EXISTS admin_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL UNIQUE,
  total_commission_earning DECIMAL(12,2) DEFAULT 0.00,
  digital_received DECIMAL(12,2) DEFAULT 0.00,
  manual_received DECIMAL(12,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Withdraw Requests
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  withdrawal_method_id INT,
  withdrawal_method_fields JSON,
  approved TINYINT DEFAULT 0 COMMENT '0=pending, 1=approved, 2=rejected',
  transaction_note TEXT,
  type ENUM('manual', 'adjustment', 'disbursement') DEFAULT 'manual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id),
  INDEX idx_approved (approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wallet Payments (for adding funds)
CREATE TABLE IF NOT EXISTS wallet_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(100),
  payment_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  transaction_ref VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Withdrawal Methods
CREATE TABLE IF NOT EXISTS withdrawal_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  method_name VARCHAR(100) NOT NULL,
  method_fields JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Owner Withdrawal Methods
CREATE TABLE IF NOT EXISTS owner_withdrawal_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  withdrawal_method_id INT NOT NULL,
  method_name VARCHAR(100),
  method_fields JSON,
  is_default TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (withdrawal_method_id) REFERENCES withdrawal_methods(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Transactions
CREATE TABLE IF NOT EXISTS account_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_type ENUM('owner', 'admin') NOT NULL,
  from_id INT NOT NULL,
  created_by ENUM('owner', 'admin') NOT NULL,
  method VARCHAR(100),
  ref VARCHAR(255),
  amount DECIMAL(12,2) DEFAULT 0.00,
  current_balance DECIMAL(12,2) DEFAULT 0.00,
  type ENUM('cash_in', 'cash_out', 'collected') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_from_type_id (from_type, from_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. ALTER EXISTING TABLES (safe alterations)
-- ============================================================

-- Add floor_id and hostel_id to rooms table if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'hostel_id');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN hostel_id INT AFTER id, ADD FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'floor_id');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN floor_id INT AFTER hostel_id, ADD FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add tax columns to bookings table
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hostel_db' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'sub_total');

SET @alter_sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN sub_total DOUBLE DEFAULT NULL AFTER total_amount, ADD COLUMN tax_amount DOUBLE DEFAULT 0 AFTER sub_total, ADD COLUMN discount_amount DOUBLE DEFAULT 0 AFTER tax_amount',
  'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 7. SEED DEFAULT DATA
-- ============================================================

-- Insert default withdrawal methods
INSERT IGNORE INTO withdrawal_methods (id, method_name, method_fields) VALUES
(1, 'Bank Transfer', '{"bank_name": {"label": "Bank Name", "type": "text", "required": true}, "account_number": {"label": "Account Number", "type": "text", "required": true}, "account_holder": {"label": "Account Holder Name", "type": "text", "required": true}, "ifsc_code": {"label": "IFSC Code", "type": "text", "required": true}}'),
(2, 'PayPal', '{"email": {"label": "PayPal Email", "type": "email", "required": true}}'),
(3, 'UPI', '{"upi_id": {"label": "UPI ID", "type": "text", "required": true}}');

-- Insert default tax configuration
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

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Run this to verify all tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'hostel_db' ORDER BY table_name;

-- ============================================================
-- TOTAL TABLES AFTER THIS MIGRATION: 53
-- ============================================================
