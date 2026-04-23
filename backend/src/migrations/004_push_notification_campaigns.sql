-- Migration: 004_push_notification_campaigns.sql
-- Created: 2026-04-24
-- Description: Push notification campaigns table

CREATE TABLE IF NOT EXISTS push_notification_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  zone VARCHAR(50) DEFAULT 'all',
  target ENUM('customer','owner','all') NOT NULL DEFAULT 'all',
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
