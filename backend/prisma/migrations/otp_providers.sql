-- =============================================
-- OTP Providers Migration
-- Run this SQL to create the otp_providers table
-- =============================================

CREATE TABLE IF NOT EXISTS `otp_providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Display name e.g. Twilio, MSG91',
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique slug e.g. twilio, msg91',
  `provider_type` ENUM('twilio', 'msg91', 'textlocal', 'vonage', 'custom', 'firebase') NOT NULL DEFAULT 'twilio',
  `description` TEXT COMMENT 'Short description of the provider',
  `logo_url` VARCHAR(500) DEFAULT NULL COMMENT 'URL or path to provider logo',
  `color` VARCHAR(20) DEFAULT '#6366f1' COMMENT 'Brand color for the card',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=active, 0=inactive',
  `config` JSON DEFAULT NULL COMMENT 'Provider-specific config as JSON',
  `sort_order` INT DEFAULT 0 COMMENT 'Display order',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default OTP providers
INSERT INTO `otp_providers` (`name`, `slug`, `provider_type`, `description`, `logo_url`, `color`, `is_active`, `config`, `sort_order`) VALUES
('Twilio', 'twilio', 'twilio', 'Send OTP via Twilio SMS/WhatsApp', NULL, '#F22F46', 0, '{"account_sid":"","auth_token":"","phone_number":""}', 1),
('MSG91', 'msg91', 'msg91', 'Send OTP via MSG91 gateway', NULL, '#3B82F6', 0, '{"auth_key":"","sender_id":"","template_id":""}', 2),
('TextLocal', 'textlocal', 'textlocal', 'Send OTP via TextLocal SMS', NULL, '#10B981', 0, '{"username":"","hash_key":"","sender_id":""}', 3),
('Vonage (Nexmo)', 'vonage', 'vonage', 'Send OTP via Vonage/Nexmo', NULL, '#8B5CF6', 0, '{"api_key":"","api_secret":"","from_number":""}', 4),
('Firebase Auth', 'firebase', 'firebase', 'Google Firebase Phone Authentication', NULL, '#FFA000', 0, '{"api_key":"","project_id":""}', 5),
('Custom Gateway', 'custom', 'custom', 'Connect your own OTP gateway via API', NULL, '#64748B', 0, '{"api_url":"","api_key":"","method":"POST","header_name":"","header_value":""}', 6);
