-- Migration: Floor & Room Management System
-- Description: Creates floors table and enhances rooms table

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  floor_number INT NOT NULL,
  floor_name VARCHAR(100) NOT NULL,
  description TEXT,
  amenities JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  UNIQUE KEY unique_floor_hostel (hostel_id, floor_number)
);

-- Add new columns to rooms table
ALTER TABLE rooms
  ADD COLUMN hostel_id INT AFTER id,
  ADD COLUMN floor_id INT AFTER hostel_id,
  ADD COLUMN furnishing JSON AFTER amenities,
  ADD COLUMN dimensions JSON AFTER furnishing,
  ADD COLUMN images JSON AFTER description,
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER status;

-- Add foreign keys
ALTER TABLE rooms
  ADD FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  ADD FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_floors_hostel ON floors(hostel_id);
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_rooms_hostel ON rooms(hostel_id);
