/**
 * I18n Translation Engine
 * Supports both SSR (Eleventy) and CSR (browser) environments
 */

import type {
  LanguageCode,
  TextDirection,
  TranslationObject,
  TranslationKey,
  TranslationVariables,
  LanguageInfo,
  I18nConfig
} from './types';

// ==========================================
// Constants
// ==========================================

/**
 * RTL languages (right-to-left)
 */
const RTL_LANGUAGES: LanguageCode[] = ['ar', 'ur'];

/**
 * Language metadata (19 languages)
 */
export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr' },
  my: { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', direction: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr' }
};

// ==========================================
// Global State (CSR only)
// ==========================================

let currentLanguage: LanguageCode = 'en';
let translations: Record<LanguageCode, TranslationObject> = {} as Record<LanguageCode, TranslationObject>;
let config: I18nConfig = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  debug: false
};

// Language change listeners (CSR only)
type LanguageChangeListener = (lang: LanguageCode) => void;
const languageChangeListeners: LanguageChangeListener[] = [];

// ==========================================
// Core Functions
// ==========================================

/**
 * Initialize i18n system (CSR)
 * @param options Configuration options
 */
export function initI18n(options: I18nConfig = {}): void {
  config = { ...config, ...options };
  currentLanguage = config.defaultLanguage || 'en';

  // Detect language from: localStorage → URL → browser → default
  const detectedLang = detectLanguage();
  if (detectedLang) {
    currentLanguage = detectedLang;
  }

  if (config.debug) {
    console.log('[i18n] Initialized with language:', currentLanguage);
  }
}

/**
 * Load translation data for a language
 * @param lang Language code
 * @param data Translation object
 */
export function loadTranslations(lang: LanguageCode, data: TranslationObject): void {
  translations[lang] = data;

  if (config.debug) {
    const keyCount = countKeys(data);
    console.log(`[i18n] Loaded ${keyCount} keys for language: ${lang}`);
  }
}

/**
 * Set current language (CSR)
 * @param lang Language code
 */
export function setLanguage(lang: LanguageCode): void {
  if (!LANGUAGES[lang]) {
    console.warn(`[i18n] Unknown language code: ${lang}. Falling back to ${config.fallbackLanguage}`);
    lang = config.fallbackLanguage as LanguageCode;
  }

  currentLanguage = lang;

  // Save to localStorage (CSR only)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('i18n-language', lang);
  }

  // Update HTML attributes
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', getDirection(lang));
  }

  // Notify listeners
  notifyLanguageChange(lang);

  if (config.debug) {
    console.log('[i18n] Language changed to:', lang);
  }
}

/**
 * Get current language
 */
export function getLanguage(): LanguageCode {
  return currentLanguage;
}

/**
 * Translate a key (main translation function)
 * @param key Translation key (dot notation)
 * @param variables Variables for interpolation
 * @param lang Optional language override (for SSR)
 */
export function t(
  key: TranslationKey,
  variables?: TranslationVariables,
  lang?: LanguageCode
): string {
  const targetLang = lang || currentLanguage;
  const langData = translations[targetLang];

  // Get translation value
  let value = getNestedValue(langData, key);

  // Fallback to English if key not found
  if (value === undefined && targetLang !== config.fallbackLanguage) {
    if (config.debug) {
      console.warn(`[i18n] Key not found in ${targetLang}: "${key}". Falling back to ${config.fallbackLanguage}.`);
    }
    value = getNestedValue(translations[config.fallbackLanguage as LanguageCode], key);
  }

  // Fallback to key itself if still not found
  if (value === undefined) {
    if (config.debug) {
      console.warn(`[i18n] Key not found: "${key}". Returning key as fallback.`);
    }
    return key;
  }

  // Interpolate variables
  if (variables && typeof value === 'string') {
    return interpolate(value, variables);
  }

  return value as string;
}

/**
 * Get text direction for a language
 * @param lang Language code
 */
export function getDirection(lang: LanguageCode = currentLanguage): TextDirection {
  return RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
}

/**
 * Get language info
 * @param lang Language code
 */
export function getLanguageInfo(lang: LanguageCode = currentLanguage): LanguageInfo {
  return LANGUAGES[lang];
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return Object.values(LANGUAGES);
}

/**
 * Check if language is RTL
 * @param lang Language code
 */
export function isRTL(lang: LanguageCode = currentLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}

// ==========================================
// Language Change Listeners (CSR)
// ==========================================

/**
 * Subscribe to language changes
 * @param listener Callback function
 * @returns Unsubscribe function
 */
export function onLanguageChange(listener: LanguageChangeListener): () => void {
  languageChangeListeners.push(listener);
  return () => {
    const index = languageChangeListeners.indexOf(listener);
    if (index > -1) {
      languageChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of language change
 */
function notifyLanguageChange(lang: LanguageCode): void {
  languageChangeListeners.forEach(listener => listener(lang));
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get nested value from object using dot notation
 * @param obj Translation object
 * @param path Dot notation path (e.g., "common.buttons.convert")
 */
function getNestedValue(obj: TranslationObject | undefined, path: string): string | undefined {
  if (!obj) return undefined;

  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate variables into translation string
 * @param template Template string with {variable} placeholders
 * @param variables Variables object
 */
function interpolate(template: string, variables: TranslationVariables): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Detect user's preferred language
 * Priority: localStorage → URL param → browser language → default
 */
function detectLanguage(): LanguageCode | null {
  // 1. Check localStorage (CSR only)
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('i18n-language');
    if (saved && LANGUAGES[saved as LanguageCode]) {
      return saved as LanguageCode;
    }
  }

  // 2. Check URL parameter (?lang=vi)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && LANGUAGES[urlLang as LanguageCode]) {
      return urlLang as LanguageCode;
    }
  }

  // 3. Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0]; // 'en-US' → 'en'
    if (LANGUAGES[browserLang as LanguageCode]) {
      return browserLang as LanguageCode;
    }
  }

  return null;
}

/**
 * Count total keys in translation object (for debug)
 */
function countKeys(obj: TranslationObject): number {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      count++;
    } else if (typeof obj[key] === 'object') {
      count += countKeys(obj[key] as TranslationObject);
    }
  }
  return count;
}

// ==========================================
// SSR Helpers (Eleventy)
// ==========================================

/**
 * Create translation function for SSR (Eleventy)
 * @param lang Language code
 * @param data Translation data
 */
export function createSSRTranslator(lang: LanguageCode, data: TranslationObject) {
  return (key: TranslationKey, variables?: TranslationVariables): string => {
    return t(key, variables, lang);
  };
}
