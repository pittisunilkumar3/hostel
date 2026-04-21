import db, { RowDataPacket, ResultSetHeader } from "../config/database";

export interface Language {
  id: number;
  code: string;
  name: string;
  direction: "ltr" | "rtl";
  is_active: number;
  is_default: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Translation {
  id: number;
  lang_code: string;
  translation_key: string;
  translation_value: string;
}

// ========== Language CRUD ==========

export const getAllLanguages = async (): Promise<Language[]> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM languages ORDER BY is_default DESC, sort_order ASC, id ASC");
  return rows as Language[];
};

export const getLanguageByCode = async (code: string): Promise<Language | null> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM languages WHERE code = ?", [code]);
  return rows.length > 0 ? (rows[0] as Language) : null;
};

export const getDefaultLanguage = async (): Promise<Language | null> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM languages WHERE is_default = 1 LIMIT 1");
  return rows.length > 0 ? (rows[0] as Language) : null;
};

export const addLanguage = async (data: { code: string; name: string; direction: "ltr" | "rtl" }): Promise<Language> => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO languages (code, name, direction, is_active, is_default) VALUES (?, ?, ?, 0, 0)",
    [data.code, data.name, data.direction]
  );

  // Copy English translations as starting point
  const [enRows] = await db.execute<RowDataPacket[]>("SELECT translation_key, translation_value FROM translations WHERE lang_code = 'en'");
  for (const row of enRows) {
    await db.execute(
      "INSERT IGNORE INTO translations (lang_code, translation_key, translation_value) VALUES (?, ?, ?)",
      [data.code, row.translation_key, row.translation_value || ""]
    );
  }

  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM languages WHERE id = ?", [result.insertId]);
  return rows[0] as Language;
};

export const updateLanguage = async (code: string, data: { direction?: "ltr" | "rtl" }): Promise<Language | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  if (data.direction !== undefined) { updates.push("direction = ?"); values.push(data.direction); }
  if (updates.length === 0) return getLanguageByCode(code);
  values.push(code);
  await db.execute(`UPDATE languages SET ${updates.join(", ")} WHERE code = ?`, values);
  return getLanguageByCode(code);
};

export const toggleLanguageStatus = async (code: string, isActive: boolean): Promise<Language | null> => {
  const lang = await getLanguageByCode(code);
  if (!lang) return null;
  if (lang.is_default && !isActive) return null; // Can't disable default
  await db.execute("UPDATE languages SET is_active = ? WHERE code = ?", [isActive ? 1 : 0, code]);
  return getLanguageByCode(code);
};

export const setDefaultLanguage = async (code: string): Promise<Language | null> => {
  const lang = await getLanguageByCode(code);
  if (!lang) return null;
  // Deactivate all defaults, then set this one
  await db.execute("UPDATE languages SET is_default = 0");
  await db.execute("UPDATE languages SET is_default = 1, is_active = 1 WHERE code = ?", [code]);
  return getLanguageByCode(code);
};

export const deleteLanguage = async (code: string): Promise<boolean> => {
  const lang = await getLanguageByCode(code);
  if (!lang || lang.is_default) return false;
  // Delete translations for this language
  await db.execute("DELETE FROM translations WHERE lang_code = ?", [code]);
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM languages WHERE code = ?", [code]);
  return result.affectedRows > 0;
};

// ========== Translations ==========

export const getTranslations = async (langCode: string, search?: string): Promise<Translation[]> => {
  let query = "SELECT * FROM translations WHERE lang_code = ?";
  const params: any[] = [langCode];
  if (search) {
    query += " AND (translation_key LIKE ? OR translation_value LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY translation_key ASC";
  const [rows] = await db.execute<RowDataPacket[]>(query, params);
  return rows as Translation[];
};

export const getTranslation = async (langCode: string, key: string): Promise<Translation | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM translations WHERE lang_code = ? AND translation_key = ?",
    [langCode, key]
  );
  return rows.length > 0 ? (rows[0] as Translation) : null;
};

export const updateTranslation = async (langCode: string, key: string, value: string): Promise<void> => {
  await db.execute(
    "INSERT INTO translations (lang_code, translation_key, translation_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE translation_value = ?",
    [langCode, key, value, value]
  );
};

export const deleteTranslation = async (langCode: string, key: string): Promise<void> => {
  await db.execute("DELETE FROM translations WHERE lang_code = ? AND translation_key = ?", [langCode, key]);
};

export const deleteLanguageTranslations = async (langCode: string): Promise<void> => {
  await db.execute("DELETE FROM translations WHERE lang_code = ?", [langCode]);
};

// ========== Get all translations for a language as key-value map ==========
export const getTranslationsMap = async (langCode: string): Promise<Record<string, string>> => {
  const translations = await getTranslations(langCode);
  const map: Record<string, string> = {};
  for (const t of translations) {
    map[t.translation_key] = t.translation_value || t.translation_key;
  }
  return map;
};

// ========== Auto-translate (simple key-to-label transform) ==========
export const autoTranslateKey = async (langCode: string, key: string): Promise<string> => {
  // Convert snake_case key to readable text
  const readable = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
  await updateTranslation(langCode, key, readable);
  return readable;
};

export const autoTranslateAll = async (langCode: string): Promise<number> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT translation_key FROM translations WHERE lang_code = ? AND (translation_value IS NULL OR translation_value = '' OR translation_value = translation_key)",
    [langCode]
  );
  let count = 0;
  for (const row of rows) {
    const readable = row.translation_key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).trim();
    await updateTranslation(langCode, row.translation_key, readable);
    count++;
  }
  return count;
};

// ========== Get translations for frontend (public API) ==========
export const getActiveTranslationsForFrontend = async (langCode?: string): Promise<Record<string, string>> => {
  if (!langCode) {
    const defaultLang = await getDefaultLanguage();
    langCode = defaultLang?.code || "en";
  }
  // Check if language is active
  const lang = await getLanguageByCode(langCode);
  if (!lang || !lang.is_active) {
    const defaultLang = await getDefaultLanguage();
    langCode = defaultLang?.code || "en";
  }
  return getTranslationsMap(langCode);
};
