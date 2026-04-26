-- ============================================================
-- Migration 021: Subscription Plans & Hostel Subscriptions
-- ============================================================

-- Table 1: subscription_plans (admin creates plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  description         TEXT,
  plan_type           ENUM('monthly','quarterly','half_yearly','yearly') NOT NULL,
  amount              DECIMAL(12,2) NOT NULL,
  discount_percent    DECIMAL(5,2) DEFAULT 0,
  grace_period_days   INT DEFAULT 7,
  features            TEXT,
  is_active           TINYINT(1) DEFAULT 1,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 2: hostel_subscriptions (owner subscribes to a plan)
CREATE TABLE IF NOT EXISTS hostel_subscriptions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id           INT NOT NULL,
  plan_id             INT NOT NULL,
  owner_id            INT NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  amount_paid         DECIMAL(12,2) NOT NULL,
  status              ENUM('active','expired','cancelled','pending') DEFAULT 'pending',
  payment_status      ENUM('pending','paid','failed') DEFAULT 'pending',
  payment_method      VARCHAR(50),
  transaction_id      VARCHAR(255),
  auto_renew          TINYINT(1) DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_hostel_id (hostel_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
