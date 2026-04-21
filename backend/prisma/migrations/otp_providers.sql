-- =============================================
-- OTP Providers Migration
-- Run this SQL to create the otp_providers table
-- =============================================

CREATE TABLE IF NOT EXISTS `otp_providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Display name',
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique slug',
  `provider_type` ENUM('twilio','msg91','2factor','nexmo','alphanet') NOT NULL DEFAULT 'twilio',
  `description` TEXT COMMENT 'Short description',
  `color` VARCHAR(20) DEFAULT '#6366f1' COMMENT 'Card brand color',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=active, 0=inactive',
  `config` JSON DEFAULT NULL COMMENT 'Provider config as JSON',
  `sort_order` INT DEFAULT 0 COMMENT 'Display order',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default OTP providers
INSERT INTO `otp_providers` (`name`, `slug`, `provider_type`, `description`, `color`, `is_active`, `config`, `sort_order`) VALUES
('Twilio',        'twilio',   'twilio',   'Send OTP via Twilio SMS',       '#F22F46', 0, '{"sid":"","messaging_service_sid":"","token":"","from":"","otp_template":"Your otp is #OTP#."}', 1),
('2Factor',       '2factor',  '2factor',  'Send OTP via 2Factor.in gateway','#10B981', 0, '{"api_key":""}', 2),
('MSG91',         'msg91',    'msg91',    'Send OTP via MSG91 gateway',     '#3B82F6', 0, '{"template_id":"","auth_key":""}', 3),
('Nexmo (Vonage)','nexmo',    'nexmo',    'Send OTP via Nexmo/Vonage SMS',  '#8B5CF6', 0, '{"api_key":"","api_secret":"","token":"","from":"","otp_template":"Your otp is #OTP#."}', 4),
('Alphanet SMS',  'alphanet', 'alphanet', 'Send OTP via Alphanet SMS',      '#F59E0B', 0, '{"api_key":"","otp_template":"Your Security Pin is #OTP#"}', 5);
