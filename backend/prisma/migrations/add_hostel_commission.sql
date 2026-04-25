-- Add per-hostel commission and business model fields
-- This allows each hostel to have its own commission rate set by the admin

ALTER TABLE hostels
ADD COLUMN business_model ENUM('commission', 'subscription') DEFAULT 'commission' AFTER custom_fields,
ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 12.00 AFTER business_model,
ADD COLUMN commission_on_delivery DECIMAL(5,2) DEFAULT 0.00 AFTER commission_rate;

-- Update existing hostels to use the global default commission
UPDATE hostels SET business_model = 'commission', commission_rate = 12.00 WHERE business_model IS NULL;
