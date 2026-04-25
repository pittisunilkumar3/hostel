-- ============================================================
-- 014_languages_translations.sql
-- Languages and translations tables
-- ============================================================

-- Languages
CREATE TABLE IF NOT EXISTS languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  direction ENUM('ltr','rtl') DEFAULT 'ltr',
  is_active TINYINT(1) DEFAULT 1,
  is_default TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Translations
CREATE TABLE IF NOT EXISTS translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lang_code VARCHAR(20) NOT NULL,
  translation_key VARCHAR(255) NOT NULL,
  translation_value TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lang_code) REFERENCES languages(code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
