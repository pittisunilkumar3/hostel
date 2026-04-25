-- Migration: 011_hostel_business_management.sql
-- Description: Add business management columns to hostels table + schedules table

USE hostel_db;

-- Add business management columns to hostels table
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS booking_type_delivery TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS booking_type_walkin TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS booking_type_dinein TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS instant_booking TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS scheduled_booking TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS minimum_booking_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS schedule_booking_duration INT NOT NULL DEFAULT 30;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS schedule_booking_duration_unit ENUM('min','hour','day') NOT NULL DEFAULT 'day';

-- Delivery / Check-in Setup
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS free_checkin TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS free_checkin_distance_status TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS free_checkin_distance_value DECIMAL(10,3) DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS minimum_checkin_charge DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS per_km_checkin_charge DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS maximum_checkin_charge DECIMAL(12,2) DEFAULT NULL;

-- GST / Tax Setup
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS gst_status TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS gst_code VARCHAR(50) DEFAULT NULL;

-- Other flags
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS veg TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS non_veg TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS halal_status TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS cutlery TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS extra_packaging_active TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS extra_packaging_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS extra_packaging_required TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS customer_date_order_status TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS customer_order_date_days INT NOT NULL DEFAULT 30;

-- Tags and characteristics
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT NULL;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS characteristics TEXT DEFAULT NULL;

-- Opening/Closing status
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS always_open TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS same_time_every_day TINYINT(1) NOT NULL DEFAULT 0;

-- Hostel Schedules Table (operating hours per day)
CREATE TABLE IF NOT EXISTS hostel_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  day TINYINT NOT NULL COMMENT '0=Sunday,1=Monday,...,6=Saturday',
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_hostel_day (hostel_id, day),
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default schedules for hostel_id=3 (Mon-Sat 8AM-10PM, Sunday 9AM-9PM)
INSERT IGNORE INTO hostel_schedules (hostel_id, day, opening_time, closing_time) VALUES
(3, 1, '08:00:00', '22:00:00'),
(3, 2, '08:00:00', '22:00:00'),
(3, 3, '08:00:00', '22:00:00'),
(3, 4, '08:00:00', '22:00:00'),
(3, 5, '08:00:00', '22:00:00'),
(3, 6, '08:00:00', '22:00:00'),
(3, 0, '09:00:00', '21:00:00');
