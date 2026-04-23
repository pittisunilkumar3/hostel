-- Migration: 003_push_notifications.sql
-- Created: 2026-04-24
-- Description: Push notifications table and FCM token on users

-- Add fcm_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT DEFAULT NULL;

-- Push notifications history table
CREATE TABLE IF NOT EXISTS push_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  data JSON DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  type VARCHAR(50) DEFAULT 'general',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
