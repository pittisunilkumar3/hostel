-- ============================================================
-- Migration 009: Reviews table for hostels
-- ============================================================

CREATE TABLE IF NOT EXISTS `hostel_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `hostel_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `booking_id` INT DEFAULT NULL,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 0,
  `comment` TEXT DEFAULT NULL,
  `reply` TEXT DEFAULT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=visible, 0=hidden',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_hostel_id` (`hostel_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_review_hostel` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed sample reviews for hostel id 3
INSERT INTO `hostel_reviews` (`hostel_id`, `user_id`, `rating`, `comment`, `status`, `created_at`) VALUES
(3, 1, 5.0, 'Excellent hostel! Clean rooms and friendly staff. Would highly recommend.', 1, NOW()),
(3, 1, 4.0, 'Good location and affordable pricing. WiFi could be faster.', 1, NOW()),
(3, 1, 3.0, 'Average experience. Rooms are okay but bathrooms need improvement.', 1, NOW()),
(3, 1, 5.0, 'Best hostel in the area. Great amenities and helpful management.', 1, NOW()),
(3, 1, 4.0, 'Nice place to stay. Good security and well-maintained rooms.', 1, NOW()),
(3, 1, 2.0, 'Below average. Expected better based on the photos.', 1, NOW()),
(3, 1, 4.5, 'Very comfortable stay. Would book again!', 1, NOW()),
(3, 1, 3.5, 'Decent hostel. Food options nearby are great.', 1, NOW());
