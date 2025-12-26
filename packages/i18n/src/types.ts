/**
 * I18n System Types
 * Type definitions for internationalization system
 */

/**
 * Supported language codes (19 languages)
 */
export type LanguageCode =
  | 'en' // English (default)
  | 'ar' // Arabic (RTL)
  | 'bn' // Bengali
  | 'de' // German
  | 'es' // Spanish
  | 'fr' // French
  | 'hi' // Hindi
  | 'id' // Indonesian
  | 'it' // Italian
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ms' // Malay
  | 'my' // Burmese
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'th' // Thai
  | 'tr' // Turkish
  | 'ur' // Urdu (RTL)
  | 'vi'; // Vietnamese

/**
 * Text direction for language
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Translation object structure (nested keys)
 */
export type TranslationObject = {
  [key: string]: string | TranslationObject;
};

/**
 * Flat translation keys (for type safety)
 */
export type TranslationKey = string;

/**
 * Variables for interpolation
 */
export type TranslationVariables = Record<string, string | number>;

/**
 * Language metadata
 */
export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: TextDirection;
}

/**
 * I18n configuration options
 */
export interface I18nConfig {
  defaultLanguage?: LanguageCode;
  fallbackLanguage?: LanguageCode;
  debug?: boolean;
}

/**
 * Translation function type
 */
export type TranslateFunction = (
  key: TranslationKey,
  variables?: TranslationVariables
) => string;
