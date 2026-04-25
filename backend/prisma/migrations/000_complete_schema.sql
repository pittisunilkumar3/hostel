-- ============================================================
-- COMPLETE MIGRATION FILE FOR ALL TABLES
-- Created: 2026-04-26
-- Database: hostel_db
-- ============================================================

USE hostel_db;

-- ============================================================
-- 1. CORE TABLES (from 001_init.sql)
-- ============================================================

-- Users table (Super Admin, Hostel Owner, Customer)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'OWNER', 'CUSTOMER') DEFAULT 'CUSTOMER',
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  hostel_name VARCHAR(255) DEFAULT NULL,
  hostel_address TEXT DEFAULT NULL,
  id_proof VARCHAR(255) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  google_id VARCHAR(255) DEFAULT NULL,
  otp_code VARCHAR(10) DEFAULT NULL,
  otp_expires DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  zone_id INT DEFAULT NULL,
  fcm_token TEXT DEFAULT NULL,
  email_verified_at DATETIME(3) DEFAULT NULL,
  email_verification_token VARCHAR(255) DEFAULT NULL,
  login_medium VARCHAR(50) DEFAULT NULL,
  social_id VARCHAR(255) DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  is_phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  loyalty_points INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  floor INT NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  current_occupancy INT NOT NULL DEFAULT 0,
  type ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY') NOT NULL DEFAULT 'SINGLE',
  status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  price_per_month DOUBLE NOT NULL,
  amenities TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_id INT NOT NULL,
  check_in DATETIME(3) NOT NULL,
  check_out DATETIME(3) DEFAULT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  payment_status ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  total_amount DOUBLE NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. ZONES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  display_name VARCHAR(255) DEFAULT NULL,
  coordinates TEXT DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  minimum_service_charge DECIMAL(16,3) DEFAULT NULL,
  per_km_service_charge DECIMAL(16,3) DEFAULT NULL,
  maximum_service_charge DECIMAL(23,3) DEFAULT NULL,
  increased_service_fee DECIMAL(8,2) DEFAULT NULL,
  increased_service_fee_status TINYINT(1) DEFAULT NULL,
  increase_service_charge_message VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. HOSTELS TABLE (with commission fields)
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
  
  -- SEO Fields
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
  
  -- QR Code Fields
  qr_title VARCHAR(255) DEFAULT NULL,
  qr_description TEXT DEFAULT NULL,
  qr_phone VARCHAR(50) DEFAULT NULL,
  qr_website VARCHAR(255) DEFAULT NULL,
  qr_code_data TEXT DEFAULT NULL,
  
  -- Booking Settings
  booking_type_delivery TINYINT(1) NOT NULL DEFAULT 0,
  booking_type_walkin TINYINT(1) NOT NULL DEFAULT 0,
  booking_type_dinein TINYINT(1) NOT NULL DEFAULT 0,
  instant_booking TINYINT(1) NOT NULL DEFAULT 0,
  scheduled_booking TINYINT(1) NOT NULL DEFAULT 0,
  minimum_booking_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  schedule_booking_duration INT NOT NULL DEFAULT 0,
  schedule_booking_duration_unit ENUM('min','hour','day') NOT NULL DEFAULT 'min',
  
  -- Check-in Settings
  free_checkin TINYINT(1) NOT NULL DEFAULT 0,
  free_checkin_distance_status TINYINT(1) NOT NULL DEFAULT 0,
  free_checkin_distance_value DECIMAL(10,3) DEFAULT NULL,
  minimum_checkin_charge DECIMAL(12,2) DEFAULT NULL,
  per_km_checkin_charge DECIMAL(12,2) DEFAULT NULL,
  maximum_checkin_charge DECIMAL(12,2) DEFAULT NULL,
  
  -- GST Settings
  gst_status TINYINT(1) NOT NULL DEFAULT 0,
  gst_code VARCHAR(50) DEFAULT NULL,
  
  -- Food Preferences (for hostel context: meal plans)
  veg TINYINT(1) NOT NULL DEFAULT 0,
  non_veg TINYINT(1) NOT NULL DEFAULT 0,
  halal_status TINYINT(1) NOT NULL DEFAULT 0,
  cutlery TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Extra Packaging
  extra_packaging_active TINYINT(1) NOT NULL DEFAULT 0,
  extra_packaging_amount DECIMAL(12,2) DEFAULT NULL,
  extra_packaging_required TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Customer Settings
  customer_date_order_status TINYINT(1) NOT NULL DEFAULT 0,
  customer_order_date_days INT NOT NULL DEFAULT 0,
  
  -- Tags & Characteristics
  tags TEXT DEFAULT NULL,
  characteristics TEXT DEFAULT NULL,
  
  -- Schedule Settings
  always_open TINYINT(1) NOT NULL DEFAULT 0,
  same_time_every_day TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Commission Settings (NEW)
  business_model ENUM('commission','subscription') DEFAULT 'commission',
  commission_rate DECIMAL(5,2) DEFAULT 12.00,
  commission_on_delivery DECIMAL(5,2) DEFAULT 0.00,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. HOSTEL SCHEDULES TABLE
-- ============================================================

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

-- ============================================================
-- 5. HOSTEL DISCOUNTS TABLE
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
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. HOSTEL REVIEWS TABLE
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. BUSINESS SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS business_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. SYSTEM SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. NOTIFICATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  sub_title VARCHAR(255) DEFAULT NULL,
  `key` VARCHAR(100) NOT NULL,
  type ENUM('ADMIN','OWNER','CUSTOMER') NOT NULL,
  mail_status ENUM('ACTIVE','INACTIVE','DISABLE') NOT NULL DEFAULT 'INACTIVE',
  sms_status ENUM('ACTIVE','INACTIVE','DISABLE') NOT NULL DEFAULT 'INACTIVE',
  push_notification_status ENUM('ACTIVE','INACTIVE','DISABLE') NOT NULL DEFAULT 'INACTIVE',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL,
  message TEXT DEFAULT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  user_type VARCHAR(20) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. PUSH NOTIFICATIONS TABLES
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
-- 11. PROMOTIONS TABLES
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
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
-- 12. ADVERTISEMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS advertisements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  add_type ENUM('restaurant_promotion','video_promotion') NOT NULL,
  owner_id INT DEFAULT NULL,
  owner_name VARCHAR(255) DEFAULT NULL,
  priority INT DEFAULT NULL,
  profile_image TEXT DEFAULT NULL,
  cover_image TEXT DEFAULT NULL,
  video_attachment TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('pending','approved','paused','denied','expired') NOT NULL DEFAULT 'pending',
  is_paid TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 13. VERIFICATION TABLES
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
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) DEFAULT NULL,
  token VARCHAR(255) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 14. HELP & SUPPORT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  reply TEXT DEFAULT NULL,
  seen TINYINT(1) DEFAULT 0,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  last_message TEXT DEFAULT NULL,
  unread_count INT DEFAULT 0,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  hostel_id INT DEFAULT NULL,
  owner_id INT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversation_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  sender_type ENUM('user','admin','owner') NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 15. EMAIL TEMPLATES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) DEFAULT NULL,
  body TEXT DEFAULT NULL,
  body_2 TEXT DEFAULT NULL,
  icon VARCHAR(255) DEFAULT NULL,
  logo VARCHAR(255) DEFAULT NULL,
  banner_image VARCHAR(255) DEFAULT NULL,
  button_name VARCHAR(100) DEFAULT NULL,
  button_url VARCHAR(500) DEFAULT NULL,
  footer_text VARCHAR(255) DEFAULT NULL,
  copyright_text VARCHAR(100) DEFAULT NULL,
  email_type VARCHAR(100) DEFAULT NULL,
  template_type VARCHAR(50) DEFAULT NULL,
  email_template VARCHAR(10) DEFAULT NULL,
  privacy TINYINT(1) DEFAULT NULL,
  refund TINYINT(1) DEFAULT NULL,
  cancelation TINYINT(1) DEFAULT NULL,
  contact TINYINT(1) DEFAULT NULL,
  facebook TINYINT(1) DEFAULT NULL,
  instagram TINYINT(1) DEFAULT NULL,
  twitter TINYINT(1) DEFAULT NULL,
  linkedin TINYINT(1) DEFAULT NULL,
  pinterest TINYINT(1) DEFAULT NULL,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 16. OTP PROVIDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS otp_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  provider_type ENUM('twilio','msg91','textlocal','vonage','custom','firebase','2factor','alphanet','nexmo') NOT NULL,
  description TEXT DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  color VARCHAR(20) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  config LONGTEXT DEFAULT NULL,
  sort_order INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 17. PAYMENT TABLES
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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- ============================================================
-- 18. BANNERS TABLE
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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 19. CMS PAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS cms_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 20. ANALYTICS TABLE
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
-- 21. LANGUAGES TABLE
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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 22. TRANSLATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lang_code VARCHAR(20) NOT NULL,
  translation_key VARCHAR(255) NOT NULL,
  translation_value TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lang_code) REFERENCES languages(code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 23. SOCIAL MEDIA LINKS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS social_media_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  link VARCHAR(500) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 24. SUBSCRIBERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  status TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 25. PAGE SEO DATA TABLE
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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 26. LOYALTY POINTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS loyalty_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  points INT NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  description TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 27. WALLET TABLES
-- ============================================================

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

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  description TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
