-- ============================================
-- WALLET SYSTEM TABLES
-- For Hostel Booking Platform
-- ============================================

-- 1. Customer Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  transaction_id VARCHAR(36) NOT NULL UNIQUE,
  credit DECIMAL(12,2) DEFAULT 0.00,
  debit DECIMAL(12,2) DEFAULT 0.00,
  admin_bonus DECIMAL(12,2) DEFAULT 0.00,
  balance DECIMAL(12,2) DEFAULT 0.00,
  transaction_type ENUM('add_fund', 'add_fund_by_admin', 'booking_payment', 'booking_refund', 'loyalty_point', 'referrer', 'cashback') NOT NULL,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Owner Wallet (Hostel Owner Earnings)
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

-- 3. Owner Withdraw Requests
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

-- 4. Admin Wallet (Platform Revenue)
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

-- 5. Wallet Bonus Rules
CREATE TABLE IF NOT EXISTS wallet_bonus_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bonus_type ENUM('percentage', 'amount') DEFAULT 'amount',
  bonus_amount DECIMAL(12,2) NOT NULL,
  min_add_amount DECIMAL(12,2) DEFAULT 0.00,
  max_bonus_amount DECIMAL(12,2) DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  status TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Wallet Payments (Payment Gateway Records)
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

-- 7. Withdrawal Methods (for owners)
CREATE TABLE IF NOT EXISTS withdrawal_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  method_name VARCHAR(100) NOT NULL,
  method_fields JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Owner Withdrawal Methods (saved by owners)
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

-- 9. Account Transactions (for tracking cash flow)
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

-- Add wallet_balance column to users table if not exists
-- Note: MySQL doesn't support IF NOT EXISTS for ADD COLUMN, use stored procedure or check manually
-- ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12,2) DEFAULT 0.00;
-- ALTER TABLE users ADD COLUMN loyalty_points INT DEFAULT 0;

-- Insert default withdrawal methods
INSERT INTO withdrawal_methods (method_name, method_fields) VALUES
('Bank Transfer', '{"bank_name": {"label": "Bank Name", "type": "text", "required": true}, "account_number": {"label": "Account Number", "type": "text", "required": true}, "account_holder": {"label": "Account Holder Name", "type": "text", "required": true}, "ifsc_code": {"label": "IFSC Code", "type": "text", "required": true}}'),
('PayPal', '{"email": {"label": "PayPal Email", "type": "email", "required": true}}'),
('UPI', '{"upi_id": {"label": "UPI ID", "type": "text", "required": true}}');

-- Insert default wallet settings in business_settings if not exists
INSERT IGNORE INTO business_settings (`key`, value) VALUES
('wallet_status', '1'),
('wallet_add_refund', '1'),
('loyalty_point_status', '1'),
('loyalty_point_exchange_rate', '10'),
('loyalty_point_item_purchase_point', '5'),
('min_owner_withdraw_amount', '100'),
('owner_commission_rate', '10');
