-- ============================================================
-- 025_zone_image.sql
-- Add image column to zones table for zone cover images
-- ============================================================

ALTER TABLE zones ADD COLUMN image VARCHAR(500) DEFAULT NULL COMMENT 'Zone cover image URL' AFTER display_name;
