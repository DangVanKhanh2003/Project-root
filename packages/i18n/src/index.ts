/**
 * @downloader/i18n - Internationalization System
 * Supports 19 languages with SSR and CSR compatibility
 */

// Export engine functions
export {
  initI18n,
  loadTranslations,
  navigateToLanguage,
  getLanguage,
  t,
  getDirection,
  getLanguageInfo,
  getSupportedLanguages,
  isRTL,
  onLanguageChange,
  createSSRTranslator,
  LANGUAGES
} from './engine';

// Export types
export type {
  LanguageCode,
  TextDirection,
  TranslationObject,
  TranslationKey,
  TranslationVariables,
  LanguageInfo,
  I18nConfig,
  TranslateFunction
} from './types';

// Export locale data (for tree-shaking)
import en from './locales/en.json';
import ar from './locales/ar.json';
import bn from './locales/bn.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import id from './locales/id.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ms from './locales/ms.json';
import my from './locales/my.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import tr from './locales/tr.json';
import ur from './locales/ur.json';
import vi from './locales/vi.json';

export const locales = {
  en,
  ar,
  bn,
  de,
  es,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  ms,
  my,
  pt,
  ru,
  th,
  tr,
  ur,
  vi
};
