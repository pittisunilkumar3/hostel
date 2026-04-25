-- ============================================================
-- 008_zones.sql
-- Zones table for area/location management
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
