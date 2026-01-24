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
    supportedLanguages: ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh'],
    skipI18nPages: ['contact', 'privacy-policy', 'terms-of-use'],
  },
  '4kvideopro': {
    baseUrl: 'https://4kvideopro.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh'],
    skipI18nPages: ['contact', 'privacy-policy', 'terms-of-use'],
  },
  ytmp3fast: {
    baseUrl: 'https://ytmp3fast.com', // Placeholder
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'de', 'fr', 'pt', 'it', 'ru', 'id', 'tr', 'vi'],
    skipI18nPages: ['contact', 'privacy', 'terms'],
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
