-- Migration: 006_advertisements.sql
-- Created: 2026-04-24
-- Description: Advertisements table for hostel/video promotions

CREATE TABLE IF NOT EXISTS advertisements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  add_type ENUM('restaurant_promotion','video_promotion') NOT NULL DEFAULT 'restaurant_promotion',
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
