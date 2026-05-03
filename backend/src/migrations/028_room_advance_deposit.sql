-- Add advance deposit columns to rooms table (per-room deposit)
ALTER TABLE rooms
  ADD COLUMN advance_payment_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether advance deposit is required for this room',
  ADD COLUMN advance_payment_amount DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'Advance deposit amount for this room',
  ADD COLUMN advance_payment_period INT(11) NULL DEFAULT NULL COMMENT 'Number of periods for advance (e.g. 2 months)',
  ADD COLUMN advance_payment_period_type ENUM('day','week','month') NULL DEFAULT 'month' COMMENT 'Period type for advance',
  ADD COLUMN advance_payment_description VARCHAR(500) NULL DEFAULT NULL COMMENT 'Custom description shown to users';

-- Note: We keep hostel-level advance_payment columns for backward compatibility,
-- but room-level settings take priority when set.
