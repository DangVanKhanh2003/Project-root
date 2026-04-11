/**
 * Site-Specific Configurations
 *
 * Each key in the `sites` object is a `siteId`, which should match the
 * directory name in the `apps/` directory.
 */

export interface SiteConfig {
  /** The base URL of the site for generating canonical URLs. */
  baseUrl: string;
  /** The default language of the site. */
  defaultLanguage: string;
  /** A list of supported language codes. */
  supportedLanguages: readonly string[];
  /** Pages that should not be checked for i18n completeness. */
  skipI18nPages?: readonly string[];
}

export const sites: Record<string, SiteConfig> = {
  y2matepro: {
    baseUrl: 'https://y2matepro.com',
    defaultLanguage: 'en',
    supportedLanguages: [
      'en', 'vi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko',
      'ar', 'hi', 'th', 'id', 'ms', 'tr', 'bn', 'ur', 'my',
    ],
    skipI18nPages: ['about-us', 'contact', 'privacy-policy', 'terms-condition'],
  },
  '4k-downloader': {
    baseUrl: 'https://4k-downloader.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja'],
    skipI18nPages: ['contact', 'copyright-claims', 'privacy-policy', 'terms-of-use'],
  },
  '4kvideopro': {
    baseUrl: 'https://4kvideopro.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja'],
    skipI18nPages: ['contact', 'copyright-claims', 'privacy-policy', 'terms-of-use'],
  },
  ytmp3fast: {
    baseUrl: 'https://ytmp3fast.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: ['contact', 'privacy', 'terms'],
  },
  'clone-7': {
    baseUrl: 'https://clone-7.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: ['contact', 'copyright-claims', 'privacy-policy', 'terms-of-use'],
  },
  'clone_ytmp3_6': {
    baseUrl: 'https://clone-ytmp3-6.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: ['about', 'contact', 'copyright-claims', 'privacy-policy', 'terms-of-use'],
  },
  mp3fast: {
    baseUrl: 'https://mp3fast.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'y2matevc': {
    baseUrl: 'https://y2matevc.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'yt-downloader': {
    baseUrl: 'https://yt-downloader.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'yt-gold': {
    baseUrl: 'https://yt-gold.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'ytmp3-clone-3': {
    baseUrl: 'https://ytmp3-clone-3.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'ytmp3-clone-5': {
    baseUrl: 'https://ytmp3-clone-5.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'ytmp3.my': {
    baseUrl: 'https://ytmp3.my', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: [],
  },
  'ssvid.cc': {
    baseUrl: 'https://ssvid.cc',
    defaultLanguage: 'en',
    supportedLanguages: ['ar', 'bn', 'de', 'en', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'ms', 'my', 'pt', 'ru', 'th', 'tr', 'ur', 'vi'],
    skipI18nPages: [],
  },
  // Add other site configurations here as needed
};

/**
 * Retrieves the configuration for a given siteId.
 * @param siteId The ID of the site (e.g., 'y2matepro').
 * @returns The configuration for the site.
 * @throws An error if the site configuration is not found.
 */
export function getSiteConfig(siteId: string): SiteConfig {
  const config = sites[siteId];
  if (!config) {
    throw new Error(`Configuration for site "${siteId}" not found in sites.config.ts`);
  }
  return config;
}