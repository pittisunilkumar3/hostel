-- Add advance deposit settings to hostels table
ALTER TABLE hostels
  ADD COLUMN advance_payment_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether advance deposit is required',
  ADD COLUMN advance_payment_amount DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'Advance deposit amount',
  ADD COLUMN advance_payment_period INT(11) NULL DEFAULT NULL COMMENT 'Number of periods for advance (e.g. 2 months)',
  ADD COLUMN advance_payment_period_type ENUM('day','week','month') NULL DEFAULT 'month' COMMENT 'Period type for advance calculation',
  ADD COLUMN advance_payment_description VARCHAR(500) NULL DEFAULT NULL COMMENT 'Custom description shown to users';

-- Add advance columns to bookings table
ALTER TABLE bookings
  ADD COLUMN advance_amount DECIMAL(12,2) NULL DEFAULT 0.00 COMMENT 'Advance deposit amount paid',
  ADD COLUMN advance_status ENUM('UNPAID','PARTIAL','PAID','REFUNDED','ADJUSTED') NULL DEFAULT 'UNPAID' COMMENT 'Advance payment status';
