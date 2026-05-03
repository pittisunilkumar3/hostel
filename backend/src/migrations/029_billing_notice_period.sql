-- Bill generation + Notice period system

-- Add notice period to hostels (owner sets how many days notice a guest must give)
ALTER TABLE hostels
  ADD COLUMN notice_period_days INT(11) NOT NULL DEFAULT 30 COMMENT 'Number of days notice required before vacating';

-- Add billing cycle tracking to bookings
ALTER TABLE bookings
  ADD COLUMN billing_start_date DATE NULL DEFAULT NULL COMMENT 'When the current billing cycle started',
  ADD COLUMN next_bill_date DATE NULL DEFAULT NULL COMMENT 'When the next bill is due',
  ADD COLUMN billing_cycle INT(11) NOT NULL DEFAULT 1 COMMENT 'Current billing cycle number (1=first, 2=second...)';

-- Add notice period tracking to bookings
ALTER TABLE bookings
  ADD COLUMN notice_given_at DATETIME(3) NULL DEFAULT NULL COMMENT 'When the customer gave notice to vacate',
  ADD COLUMN notice_vacate_date DATE NULL DEFAULT NULL COMMENT 'The date customer plans to vacate (notice_given_at + notice_period)',
  ADD COLUMN notice_status ENUM('NONE','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'NONE' COMMENT 'Status of notice request';
