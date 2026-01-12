/**
 * i18n Completeness Validator
 * Kiểm tra đầy đủ các trang cho mỗi ngôn ngữ
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getTargetDir } from '../config.js';
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanLanguageDirectories, getPageTypes, scanLanguagePages } from '../utils/file-scanner.js';

// Target directory determined at runtime via getTargetDir()

// Các trang không cần i18n (chỉ có bản English)
const SKIP_I18N_PAGES = [
  'about-us',
  'contact',
  'privacy-policy',
  'terms-condition',
];

export const i18nCompletenessValidator: Validator = {
  name: 'i18n Completeness',
  slug: 'i18n-completeness',
  description: 'Validates language directory completeness',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking i18n completeness...');

    // Get all page types from root
    const pageTypes = await getPageTypes(getTargetDir());
    logger.info(`Found ${pageTypes.length} page types: ${pageTypes.join(', ')}`);

    // Get all language directories
    const languages = await scanLanguageDirectories(getTargetDir());
    logger.info(`Found ${languages.length} languages: ${languages.join(', ')}`);

    if (languages.length === 0) {
      logger.warning({
        file: 'pages/',
        location: 'pages directory',
        component: 'i18n Structure',
        issue: 'No language directories found',
        reason: 'Multi-language sites should have pages/{lang}/ directories',
        fix: 'Create language directories like pages/en/, pages/vi/, etc.',
      });

      return {
        name: i18nCompletenessValidator.name,
        slug: i18nCompletenessValidator.slug,
        passed: true,
        errorCount: 0,
        warningCount: 1,
        filesChecked: 0,
        duration: Date.now() - startTime,
      };
    }

    // Check each language has all page types
    for (const lang of languages) {
      const langDir = path.join(getTargetDir(), 'pages', lang);
      const langPages = await scanLanguagePages(getTargetDir(), lang);
      const langPageTypes = langPages.map((p) => p.pageType).filter(Boolean);

      filesChecked += langPages.length;

      // Check for missing pages (bỏ qua các trang không cần i18n)
      for (const pageType of pageTypes) {
        // Skip các trang không cần dịch
        if (SKIP_I18N_PAGES.includes(pageType)) {
          continue;
        }

        if (!langPageTypes.includes(pageType)) {
          logger.error({
            file: `pages/${lang}/`,
            location: `pages/${lang}/`,
            component: 'i18n Completeness',
            issue: `Missing page: ${pageType}.html`,
            reason: `Language ${lang} is missing the ${pageType} page that exists in other languages`,
            fix: `Create pages/${lang}/${pageType}.html`,
          });
        }
      }

      // Check for extra pages (pages that don't exist in root)
      for (const pageType of langPageTypes) {
        if (pageType && !pageTypes.includes(pageType)) {
          logger.warning({
            file: `pages/${lang}/${pageType}.html`,
            location: `pages/${lang}/`,
            component: 'i18n Completeness',
            issue: `Extra page not in root: ${pageType}.html`,
            reason: `This page exists in ${lang} but not as a root page`,
            fix: 'Either add this page type to root or remove from language directory',
          });
        }
      }

      // Check index.html exists
      const hasIndex = langPageTypes.includes('index');
      if (!hasIndex) {
        logger.error({
          file: `pages/${lang}/`,
          location: `pages/${lang}/`,
          component: 'i18n Completeness',
          issue: 'Missing index.html',
          reason: 'Each language should have an index page',
          fix: `Create pages/${lang}/index.html`,
        });
      }
    }

    // Check consistency across languages
    if (languages.length > 1) {
      const langPageCounts = new Map<string, number>();

      for (const lang of languages) {
        const langPages = await scanLanguagePages(getTargetDir(), lang);
        langPageCounts.set(lang, langPages.length);
      }

      // Find the language with most pages
      let maxPages = 0;
      let maxLang = '';
      for (const [lang, count] of langPageCounts) {
        if (count > maxPages) {
          maxPages = count;
          maxLang = lang;
        }
      }

      // Report languages with fewer pages
      for (const [lang, count] of langPageCounts) {
        if (count < maxPages) {
          const diff = maxPages - count;
          logger.warning({
            file: `pages/${lang}/`,
            location: `pages/${lang}/`,
            component: 'i18n Completeness',
            issue: `${diff} fewer pages than ${maxLang}`,
            currentValue: `${count} pages`,
            expectedValue: `${maxPages} pages (like ${maxLang})`,
            reason: 'All languages should have the same pages for consistency',
            fix: `Add missing pages to pages/${lang}/`,
          });
        }
      }
    }

    const stats = logger.getStats();
    const duration = Date.now() - startTime;

    return {
      name: i18nCompletenessValidator.name,
      slug: i18nCompletenessValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default i18nCompletenessValidator;
