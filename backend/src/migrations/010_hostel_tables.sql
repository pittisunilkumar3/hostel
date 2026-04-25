-- ============================================================
-- 010_hostel_tables.sql
-- Hostel-related tables: schedules, discounts, reviews
-- ============================================================

-- Hostel Schedules
CREATE TABLE IF NOT EXISTS hostel_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  day TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hostel Discounts
CREATE TABLE IF NOT EXISTS hostel_discounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  discount DECIMAL(5,2) NOT NULL,
  min_purchase DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hostel Reviews
CREATE TABLE IF NOT EXISTS hostel_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  user_id INT NOT NULL,
  booking_id INT DEFAULT NULL,
  rating DECIMAL(2,1) NOT NULL,
  comment TEXT DEFAULT NULL,
  reply TEXT DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
