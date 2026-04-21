"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { API_URL } from "./auth";

type Translations = Record<string, string>;

interface I18nContextType {
  locale: string;
  setLocale: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  translations: Translations;
  languages: { code: string; name: string; direction: "ltr" | "rtl"; is_active: number; is_default: number }[];
  loading: boolean;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (k) => k,
  translations: {},
  languages: [],
  loading: true,
  dir: "ltr",
});

interface LangRow { code: string; name: string; direction: "ltr" | "rtl"; is_active: number; is_default: number; }

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, _setLocale] = useState("en");
  const [translations, setTranslations] = useState<Translations>({});
  const [languages, setLanguages] = useState<LangRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLanguages = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/languages`);
      const data = await res.json();
      if (data.success) {
        const active = data.data.filter((l: LangRow) => l.is_active);
        setLanguages(active);
        return active;
      }
    } catch (e) { console.error("Failed to load languages", e); }
    return [];
  }, []);

  const loadTranslations = useCallback(async (code: string) => {
    try {
      const res = await fetch(`${API_URL}/api/languages/${code}/translations`);
      const data = await res.json();
      if (data.success) {
        const map: Translations = {};
        for (const t of data.data) {
          map[t.translation_key] = t.translation_value || t.translation_key;
        }
        return map;
      }
    } catch (e) { console.error("Failed to load translations", e); }
    return {};
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const langs = await loadLanguages();
      // Check saved preference
      const saved = localStorage.getItem("locale");
      let targetCode = "en";

      if (saved) {
        // Use saved if it's active
        const found = langs.find((l: LangRow) => l.code === saved && l.is_active);
        if (found) targetCode = saved;
      }

      // If no valid saved, use default
      if (targetCode === "en") {
        const def = langs.find((l: LangRow) => l.is_default);
        if (def) targetCode = def.code;
      }

      const trans = await loadTranslations(targetCode);
      _setLocale(targetCode);
      setTranslations(trans);
      document.documentElement.lang = targetCode;
      const lang = langs.find((l: LangRow) => l.code === targetCode);
      document.documentElement.dir = lang?.direction || "ltr";
      setLoading(false);
    })();
  }, [loadLanguages, loadTranslations]);

  const setLocale = useCallback(async (code: string) => {
    _setLocale(code);
    localStorage.setItem("locale", code);
    const trans = await loadTranslations(code);
    setTranslations(trans);
    document.documentElement.lang = code;
    const lang = languages.find(l => l.code === code);
    document.documentElement.dir = lang?.direction || "ltr";
  }, [loadTranslations, languages]);

  const t = useCallback((key: string, fallback?: string) => {
    return translations[key] || fallback || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }, [translations]);

  const dir = (languages.find(l => l.code === locale)?.direction || "ltr") as "ltr" | "rtl";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations, languages, loading, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
