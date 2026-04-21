-- Login Setup Settings (matching reference project pattern)
INSERT IGNORE INTO system_settings (setting_key, setting_value, is_active) VALUES
-- Login method toggles
('manual_login_status', '1', 1),
('otp_login_status', '0', 1),
('social_login_status', '0', 1),
('google_login_status', '0', 1),
('facebook_login_status', '0', 1),
('apple_login_status', '0', 1),
('email_verification_status', '0', 1),
('phone_verification_status', '0', 1),
-- Login URL settings
('admin_login_url', 'admin', 1),
('owner_login_url', 'owner', 1),
('user_login_url', 'user', 1);
