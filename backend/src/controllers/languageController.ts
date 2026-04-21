import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

// GET /api/languages
export async function getLanguagesController() {
  try {
    const { getAllLanguages } = await import("../services/languageService");
    return successResponse(await getAllLanguages(), "Languages fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// POST /api/languages — add new language
export async function addLanguageController(request: NextRequest) {
  try {
    const { code, direction } = await request.json();
    if (!code) return errorResponse("Language code required", 400);

    const LANGUAGE_NAMES: Record<string, string> = {
      "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian",
      "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian",
      "bg": "Bulgarian", "ca": "Catalan", "zh": "Chinese", "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)",
      "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch", "en": "English",
      "et": "Estonian", "fi": "Finnish", "fr": "French", "gl": "Galician", "ka": "Georgian",
      "de": "German", "el": "Greek", "gu": "Gujarati", "he": "Hebrew", "hi": "Hindi",
      "hu": "Hungarian", "is": "Icelandic", "id": "Indonesian", "it": "Italian", "ja": "Japanese",
      "kn": "Kannada", "kk": "Kazakh", "ko": "Korean", "ky": "Kyrgyz", "lo": "Lao",
      "lv": "Latvian", "lt": "Lithuanian", "mk": "Macedonian", "ms": "Malay", "ml": "Malayalam",
      "mr": "Marathi", "mn": "Mongolian", "ne": "Nepali", "no": "Norwegian", "fa": "Persian",
      "pl": "Polish", "pt": "Portuguese", "pt-BR": "Portuguese (Brazil)", "pa": "Punjabi",
      "ro": "Romanian", "ru": "Russian", "sr": "Serbian", "si": "Sinhala", "sk": "Slovak",
      "sl": "Slovenian", "es": "Spanish", "sw": "Swahili", "sv": "Swedish", "tl": "Tagalog",
      "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish", "uk": "Ukrainian",
      "ur": "Urdu", "uz": "Uzbek", "vi": "Vietnamese", "cy": "Welsh", "zu": "Zulu",
    };

    const { addLanguage } = await import("../services/languageService");
    const lang = await addLanguage({
      code,
      name: LANGUAGE_NAMES[code] || code.toUpperCase(),
      direction: direction === "rtl" ? "rtl" : "ltr",
    });
    return successResponse(lang, "Language added");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// PUT /api/languages/[code] — update direction
export async function updateLanguageController(request: NextRequest, code: string) {
  try {
    const { direction } = await request.json();
    const { updateLanguage } = await import("../services/languageService");
    const lang = await updateLanguage(code, { direction });
    if (!lang) return errorResponse("Language not found", 404);
    return successResponse(lang, "Language updated");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// PATCH /api/languages/[code]/toggle — toggle active status
export async function toggleLanguageController(request: NextRequest, code: string) {
  try {
    const { is_active } = await request.json();
    const { toggleLanguageStatus } = await import("../services/languageService");
    const lang = await toggleLanguageStatus(code, !!is_active);
    if (!lang) return errorResponse("Cannot update default language status", 403);
    return successResponse(lang, `Language ${is_active ? "activated" : "deactivated"}`);
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// PATCH /api/languages/[code]/default — set as default
export async function setDefaultLanguageController(code: string) {
  try {
    const { setDefaultLanguage } = await import("../services/languageService");
    const lang = await setDefaultLanguage(code);
    if (!lang) return errorResponse("Language not found", 404);
    return successResponse(lang, "Default language changed");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// DELETE /api/languages/[code]
export async function deleteLanguageController(code: string) {
  try {
    const { deleteLanguage } = await import("../services/languageService");
    const ok = await deleteLanguage(code);
    if (!ok) return errorResponse("Cannot delete default language or not found", 403);
    return successResponse(null, "Language deleted");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// GET /api/languages/[code]/translations
export async function getTranslationsController(code: string, request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const { getTranslations } = await import("../services/languageService");
    const translations = await getTranslations(code, search);
    return successResponse(translations, "Translations fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// PUT /api/languages/[code]/translations — update single translation
export async function updateTranslationController(request: NextRequest, code: string) {
  try {
    const { key, value } = await request.json();
    if (!key) return errorResponse("Translation key required", 400);
    const { updateTranslation } = await import("../services/languageService");
    await updateTranslation(code, key, value || "");
    return successResponse(null, "Translation saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// POST /api/languages/[code]/auto-translate — auto translate one key
export async function autoTranslateController(request: NextRequest, code: string) {
  try {
    const { key } = await request.json();
    if (!key) return errorResponse("Key required", 400);
    const { autoTranslateKey } = await import("../services/languageService");
    const translated = await autoTranslateKey(code, key);
    return successResponse({ key, value: translated }, "Auto-translated");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// POST /api/languages/[code]/auto-translate-all — auto translate all untranslated
export async function autoTranslateAllController(code: string) {
  try {
    const { autoTranslateAll } = await import("../services/languageService");
    const count = await autoTranslateAll(code);
    return successResponse({ count }, `Auto-translated ${count} strings`);
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// GET /api/languages/active-translations — public: get translations for current language
export async function getActiveTranslationsController(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || undefined;
    const { getActiveTranslationsForFrontend } = await import("../services/languageService");
    const translations = await getActiveTranslationsForFrontend(lang);
    return successResponse(translations, "Translations loaded");
  } catch (error: any) { return errorResponse(error.message, 500); }
}
