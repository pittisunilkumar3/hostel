-- ============================================================
-- 012_payment_transactions.sql
-- Payment transactions table
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT DEFAULT NULL,
  user_id INT NOT NULL,
  gateway_slug VARCHAR(50) NOT NULL,
  gateway_mode ENUM('test','live') DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT NULL,
  status ENUM('pending','processing','success','failed','cancelled','refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255) DEFAULT NULL,
  gateway_reference VARCHAR(255) DEFAULT NULL,
  payment_data LONGTEXT DEFAULT NULL,
  callback_data LONGTEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
