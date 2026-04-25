-- ============================================================
-- Migration 010: Hostel discounts table
-- ============================================================

CREATE TABLE IF NOT EXISTS `hostel_discounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `hostel_id` INT NOT NULL,
  `discount` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'Discount percentage',
  `min_purchase` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Minimum booking amount',
  `max_discount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Maximum discount cap',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `start_time` TIME NOT NULL DEFAULT '00:00:00',
  `end_time` TIME NOT NULL DEFAULT '23:59:59',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_hostel_discount` (`hostel_id`),
  KEY `idx_hostel_id` (`hostel_id`),
  CONSTRAINT `fk_discount_hostel` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed a sample discount for hostel id 3
INSERT INTO `hostel_discounts` (`hostel_id`, `discount`, `min_purchase`, `max_discount`, `start_date`, `end_date`, `start_time`, `end_time`, `status`) VALUES
(3, 15.00, 5000.00, 2000.00, '2026-04-01', '2026-06-30', '00:00:00', '23:59:59', 1);
