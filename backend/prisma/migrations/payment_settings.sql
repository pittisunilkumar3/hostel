-- Payment Setup Settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, is_active) VALUES
('payment_cod_active', '1', 1),
('payment_digital_active', '0', 0),
('payment_offline_active', '0', 0),
('payment_partial_active', '0', 0);
