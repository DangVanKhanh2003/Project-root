/**
 * i18n Completeness Validator
 * Kiểm tra đầy đủ các trang cho mỗi ngôn ngữ
 */

import * as path from 'node:path';
import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanLanguageDirectories, getPageTypes, scanLanguagePages } from '../utils/file-scanner.js';

export const i18nCompletenessValidator: Validator = {
  name: 'i18n Completeness',
  slug: 'i18n-completeness',
  description: 'Validates language directory completeness',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;
    const skipI18nPages = siteConfig.skipI18nPages || [];

    logger.info('Checking i18n completeness...');

    const pageTypes = await getPageTypes(targetDir);
    logger.info(`Found ${pageTypes.length} page types: ${pageTypes.join(', ')}`);

    const languages = await scanLanguageDirectories(targetDir);
    logger.info(`Found ${languages.length} languages: ${languages.join(', ')}`);

    if (languages.length === 0) {
      logger.info('No language directories found, skipping i18n completeness check.');
      return {
        name: i18nCompletenessValidator.name,
        slug: i18nCompletenessValidator.slug,
        passed: true,
        errorCount: 0,
        warningCount: 0,
        filesChecked: 0,
        duration: Date.now() - startTime,
      };
    }

    for (const lang of languages) {
      const langPages = await scanLanguagePages(targetDir, lang);
      const langPageTypes = langPages.map((p) => p.pageType).filter((p): p is string => !!p);
      filesChecked += langPages.length;

      for (const pageType of pageTypes) {
        if (skipI18nPages.includes(pageType)) {
          continue;
        }
        if (!langPageTypes.includes(pageType)) {
          logger.error({
            file: `pages/${lang}/`,
            location: `pages/${lang}/`,
            component: 'i18n Completeness',
            issue: `Missing page: ${pageType}.html`,
            reason: `Language ${lang} is missing the ${pageType} page that exists in other languages.`,
            fix: `Create pages/${lang}/${pageType}.html`,
          });
        }
      }

      for (const pageType of langPageTypes) {
        if (!pageTypes.includes(pageType)) {
          logger.warning({
            file: `pages/${lang}/${pageType}.html`,
            location: `pages/${lang}/`,
            component: 'i18n Completeness',
            issue: `Extra page not in root: ${pageType}.html`,
            reason: `This page exists in ${lang} but not as a root page type.`,
            fix: 'Either add this page type to root files or remove from language directory if not needed.',
          });
        }
      }

      if (!langPageTypes.includes('index')) {
        logger.error({
          file: `pages/${lang}/`,
          location: `pages/${lang}/`,
          component: 'i18n Completeness',
          issue: 'Missing index.html',
          reason: 'Each language directory should have an index.html page.',
          fix: `Create pages/${lang}/index.html`,
        });
      }
    }

    if (languages.length > 1) {
      const langPageCounts = new Map<string, number>();
      for (const lang of languages) {
        const langPages = await scanLanguagePages(targetDir, lang);
        langPageCounts.set(lang, langPages.length);
      }

      let maxPages = 0;
      let maxLang = '';
      for (const [lang, count] of langPageCounts) {
        if (count > maxPages) {
          maxPages = count;
          maxLang = lang;
        }
      }

      for (const [lang, count] of langPageCounts) {
        if (count < maxPages) {
          const diff = maxPages - count;
          logger.warning({
            file: `pages/${lang}/`,
            location: `pages/${lang}/`,
            component: 'i18n Completeness',
            issue: `${diff} fewer page(s) than '${maxLang}'`,
            currentValue: `${count} pages`,
            expectedValue: `${maxPages} pages (like ${maxLang})`,
            reason: 'All languages should ideally have the same number of pages for consistency.',
            fix: `Add missing pages to pages/${lang}/ or verify this is intentional.`,
          });
        }
      }
    }

    const stats = logger.getStats();
    return {
      name: i18nCompletenessValidator.name,
      slug: i18nCompletenessValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default i18nCompletenessValidator;