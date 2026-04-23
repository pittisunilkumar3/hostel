-- Migration: 007_firebase_otp_verification.sql
-- Created: 2026-04-24
-- Description: Phone/Email verification and password reset tables with OTP tracking
--              (adapted from reference Laravel project)

-- Phone verifications table (OTP sent to phone numbers)
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
  UNIQUE KEY unique_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Email verifications table (verification tokens sent to email)
CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) DEFAULT NULL,
  token VARCHAR(255) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password resets table (OTP-based password reset with tracking)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  token VARCHAR(255) NOT NULL,
  otp_hit_count TINYINT NOT NULL DEFAULT 0,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  is_temp_blocked TINYINT(1) NOT NULL DEFAULT 0,
  temp_block_time DATETIME(3) DEFAULT NULL,
  created_by VARCHAR(50) DEFAULT 'user',
  created_at DATETIME(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at DATETIME(3) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_medium VARCHAR(50) DEFAULT 'manual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TINYINT(1) NOT NULL DEFAULT 1;
