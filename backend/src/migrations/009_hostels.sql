-- ============================================================
-- 009_hostels.sql
-- Hostels table with all fields including commission
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
  
  -- Food Preferences
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
  
  -- Commission Settings
  business_model ENUM('commission','subscription') DEFAULT 'commission',
  commission_rate DECIMAL(5,2) DEFAULT 12.00,
  commission_on_delivery DECIMAL(5,2) DEFAULT 0.00,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
