-- ============================================================
-- 015_loyalty_wallet.sql
-- Loyalty points and wallet tables
-- ============================================================

-- Loyalty Points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  points INT NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  description TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wallet Bonus Rules
CREATE TABLE IF NOT EXISTS wallet_bonus_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  min_add_amount DECIMAL(10,2) NOT NULL,
  max_bonus DECIMAL(10,2) DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  description TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
