-- ============================================================
-- MIGRATION: Create all missing tables
-- Date: 2026-04-26
-- Tables: 16 missing tables
-- ============================================================

USE hostel_db;

-- ============================================================
-- 1. HOSTELS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hostels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  zone_id INT DEFAULT NULL,
  latitude DOUBLE DEFAULT NULL,
  longitude DOUBLE DEFAULT NULL,
  logo LONGTEXT DEFAULT NULL,
  cover_photo LONGTEXT DEFAULT NULL,
  total_rooms INT DEFAULT NULL,
  total_beds INT DEFAULT NULL,
  min_stay_days INT DEFAULT NULL,
  check_in_time VARCHAR(10) DEFAULT NULL,
  check_out_time VARCHAR(10) DEFAULT NULL,
  amenities TEXT DEFAULT NULL,
  custom_fields TEXT DEFAULT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  rejection_reason TEXT DEFAULT NULL,
  submitted_at DATETIME DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  meta_title VARCHAR(255) DEFAULT NULL,
  meta_description TEXT DEFAULT NULL,
  meta_image VARCHAR(500) DEFAULT NULL,
  meta_index ENUM('index','noindex') NOT NULL DEFAULT 'index',
  meta_no_follow TINYINT(1) NOT NULL DEFAULT 0,
  meta_no_image_index TINYINT(1) NOT NULL DEFAULT 0,
  meta_no_archive TINYINT(1) NOT NULL DEFAULT 0,
  meta_no_snippet TINYINT(1) NOT NULL DEFAULT 0,
  meta_max_snippet INT DEFAULT NULL,
  meta_max_video_preview INT DEFAULT NULL,
  meta_max_image_preview ENUM('large','medium','small') DEFAULT NULL,
  qr_title VARCHAR(255) DEFAULT NULL,
  qr_description TEXT DEFAULT NULL,
  qr_phone VARCHAR(50) DEFAULT NULL,
  qr_website VARCHAR(255) DEFAULT NULL,
  qr_code_data TEXT DEFAULT NULL,
  booking_type_delivery TINYINT(1) NOT NULL DEFAULT 0,
  booking_type_walkin TINYINT(1) NOT NULL DEFAULT 0,
  booking_type_dinein TINYINT(1) NOT NULL DEFAULT 0,
  instant_booking TINYINT(1) NOT NULL DEFAULT 0,
  scheduled_booking TINYINT(1) NOT NULL DEFAULT 0,
  minimum_booking_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  schedule_booking_duration INT NOT NULL DEFAULT 0,
  schedule_booking_duration_unit ENUM('min','hour','day') NOT NULL DEFAULT 'min',
  free_checkin TINYINT(1) NOT NULL DEFAULT 0,
  free_checkin_distance_status TINYINT(1) NOT NULL DEFAULT 0,
  free_checkin_distance_value DECIMAL(10,3) DEFAULT NULL,
  minimum_checkin_charge DECIMAL(12,2) DEFAULT NULL,
  per_km_checkin_charge DECIMAL(12,2) DEFAULT NULL,
  maximum_checkin_charge DECIMAL(12,2) DEFAULT NULL,
  gst_status TINYINT(1) NOT NULL DEFAULT 0,
  gst_code VARCHAR(50) DEFAULT NULL,
  veg TINYINT(1) NOT NULL DEFAULT 0,
  non_veg TINYINT(1) NOT NULL DEFAULT 0,
  halal_status TINYINT(1) NOT NULL DEFAULT 0,
  cutlery TINYINT(1) NOT NULL DEFAULT 0,
  extra_packaging_active TINYINT(1) NOT NULL DEFAULT 0,
  extra_packaging_amount DECIMAL(12,2) DEFAULT NULL,
  extra_packaging_required TINYINT(1) NOT NULL DEFAULT 0,
  customer_date_order_status TINYINT(1) NOT NULL DEFAULT 0,
  customer_order_date_days INT NOT NULL DEFAULT 0,
  tags TEXT DEFAULT NULL,
  characteristics TEXT DEFAULT NULL,
  always_open TINYINT(1) NOT NULL DEFAULT 0,
  same_time_every_day TINYINT(1) NOT NULL DEFAULT 0,
  business_model ENUM('commission','subscription') DEFAULT 'commission',
  commission_rate DECIMAL(5,2) DEFAULT 12.00,
  commission_on_delivery DECIMAL(5,2) DEFAULT 0.00,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
  INDEX idx_owner_id (owner_id),
  INDEX idx_zone_id (zone_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. HOSTEL SCHEDULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hostel_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  day TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  INDEX idx_hostel_id (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. HOSTEL DISCOUNTS TABLE
-- ============================================================
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
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  INDEX idx_hostel_id (hostel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. HOSTEL REVIEWS TABLE
-- ============================================================
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_hostel_id (hostel_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. PUSH NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS push_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  data LONGTEXT DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  type VARCHAR(50) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. PUSH NOTIFICATION CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS push_notification_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  zone VARCHAR(50) DEFAULT NULL,
  target ENUM('customer','owner','all') NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  coupon_type ENUM('default','zone_wise','first_order','free_delivery','room_wise') NOT NULL,
  discount_type ENUM('percent','amount') NOT NULL,
  discount DECIMAL(12,2) NOT NULL,
  max_discount DECIMAL(12,2) NOT NULL,
  min_purchase DECIMAL(12,2) NOT NULL,
  limit_for_same_user INT NOT NULL DEFAULT 1,
  total_uses INT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  expire_date DATE NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. CASHBACK OFFERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cashback_offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cashback_type ENUM('percentage','amount') NOT NULL,
  cashback_amount DECIMAL(12,2) NOT NULL,
  max_discount DECIMAL(12,2) NOT NULL,
  min_purchase DECIMAL(12,2) NOT NULL,
  same_user_limit INT NOT NULL DEFAULT 1,
  total_used INT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. LANGUAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  direction ENUM('ltr','rtl') DEFAULT 'ltr',
  is_active TINYINT(1) DEFAULT 1,
  is_default TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. TRANSLATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lang_code VARCHAR(20) NOT NULL,
  translation_key VARCHAR(255) NOT NULL,
  translation_value TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lang_code) REFERENCES languages(code) ON DELETE CASCADE,
  INDEX idx_lang_code (lang_code),
  INDEX idx_translation_key (translation_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 12. SUBSCRIBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  status TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 13. PAGE SEO DATA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS page_seo_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  meta_data LONGTEXT DEFAULT NULL,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_name (page_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 14. ANALYTIC SCRIPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS analytic_scripts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) DEFAULT NULL,
  script_id TEXT DEFAULT NULL,
  script LONGTEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 15. PAYMENT GATEWAYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_gateways (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 0,
  mode ENUM('test','live') DEFAULT 'test',
  gateway_title VARCHAR(100) DEFAULT NULL,
  logo VARCHAR(255) DEFAULT NULL,
  config LONGTEXT DEFAULT NULL,
  sort_order INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 16. PAYMENT TRANSACTIONS TABLE
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 17. LOYALTY POINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  points INT NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  description TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 18. LOYALTY POINT TRANSACTIONS TABLE
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
  INDEX idx_transaction_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 19. BANNERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type ENUM('room_wise','zone_wise') NOT NULL,
  image TEXT DEFAULT NULL,
  data VARCHAR(255) DEFAULT NULL,
  zone_id INT DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_zone_id (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 20. PHONE VERIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS phone_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  otp_hit_count TINYINT NOT NULL DEFAULT 0,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  is_temp_blocked TINYINT(1) NOT NULL DEFAULT 0,
  temp_block_time DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 21. EMAIL VERIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) DEFAULT NULL,
  token VARCHAR(255) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 22. PASSWORD RESETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  token VARCHAR(255) NOT NULL,
  otp_hit_count TINYINT NOT NULL DEFAULT 0,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  is_temp_blocked TINYINT(1) NOT NULL DEFAULT 0,
  temp_block_time DATETIME(3) DEFAULT NULL,
  created_by VARCHAR(50) DEFAULT NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_email (email),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
