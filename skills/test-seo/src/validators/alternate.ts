/**
 * Alternate (Hreflang) Tag Validator
 * Kiểm tra hreflang tags cho đa ngôn ngữ
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles, scanLanguageDirectories } from '../utils/file-scanner.js';
import { parseHtmlFile, extractAlternateTags } from '../utils/html-parser.js';

export const alternateValidator: Validator = {
  name: 'Alternate (Hreflang) Tags',
  slug: 'alternate',
  description: 'Validates hreflang tags for multilingual SEO',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;
    const skipHreflangPages = siteConfig.skipI18nPages || ['404'];

    logger.info(`Scanning for hreflang alternate tags in: ${targetDir}`);

    // Get available languages in project
    const availableLanguages = await scanLanguageDirectories(targetDir);
    logger.info(`Found ${availableLanguages.length} language directories`);

    const files = await scanHtmlFiles({
      rootDir: targetDir,
      include: ['**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**'],
    });

    for (const file of files) {
      // Skip pages that don't need hreflang
      if (file.pageType && skipHreflangPages.includes(file.pageType)) {
        continue;
      }

      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const alternates = extractAlternateTags(parsed);

        // Check 1: Has any alternate tags
        if (alternates.length === 0 && availableLanguages.length > 1) {
          logger.warning({
            file: file.relativePath,
            location: '<head> section',
            component: 'Hreflang tags',
            issue: 'No hreflang alternate tags found',
            reason: 'Hreflang tags help search engines serve the correct language version to users',
            fix: 'Add <link rel="alternate" hreflang="xx" href="..." /> for each language version',
          });
          continue;
        }

        // Check 2: Has x-default
        const hasXDefault = alternates.some((alt) => alt.hreflang === 'x-default');
        if (!hasXDefault && availableLanguages.length > 1) {
          logger.warning({
            file: file.relativePath,
            location: '<head> section',
            component: 'Hreflang tags',
            issue: 'Missing x-default hreflang',
            reason: 'x-default tells search engines which version to show for unmatched languages',
            fix: 'Add <link rel="alternate" hreflang="x-default" href="..." />',
          });
        }

        // Check 3: Self-referencing hreflang
        if (file.language) {
          const hasSelfRef = alternates.some((alt) => alt.hreflang === file.language);
          if (!hasSelfRef) {
            logger.warning({
              file: file.relativePath,
              location: '<head> section',
              component: 'Hreflang tags',
              issue: `Missing self-referencing hreflang for ${file.language}`,
              reason: 'Each page should include a hreflang tag pointing to itself',
              fix: `Add <link rel="alternate" hreflang="${file.language}" href="..." />`,
            });
          }
        }

        // Check 4: Hreflang format validation
        for (const alt of alternates) {
          const regionMatch = alt.hreflang.match(/^[a-z]{2}-([a-z]{2})$/);
          if (regionMatch) {
            logger.error({
              file: file.relativePath,
              location: '<link rel="alternate">',
              component: 'Hreflang tags',
              issue: `Invalid hreflang format: ${alt.hreflang}`,
              currentValue: alt.hreflang,
              expectedValue: `${alt.hreflang.split('-')[0]}-${regionMatch[1].toUpperCase()}`,
              reason: 'Region codes in hreflang should be uppercase (e.g., es-MX, not es-mx)',
              fix: `Change to ${alt.hreflang.split('-')[0]}-${regionMatch[1].toUpperCase()}`,
            });
          }

          if (!alt.href || alt.href.trim() === '') {
            logger.error({
              file: file.relativePath,
              location: '<link rel="alternate">',
              component: 'Hreflang tags',
              issue: `Empty href for hreflang="${alt.hreflang}"`,
              reason: 'Hreflang tags must have a valid href attribute',
              fix: 'Add the correct URL to the href attribute',
            });
          }

          if (alt.href && !alt.href.startsWith('http')) {
            logger.error({
              file: file.relativePath,
              location: '<link rel="alternate">',
              component: 'Hreflang tags',
              issue: `Relative URL in hreflang: ${alt.href}`,
              currentValue: alt.href,
              reason: 'Hreflang URLs must be absolute URLs',
              fix: 'Convert to absolute URL starting with https://',
            });
          }

          if (alt.href && alt.href.endsWith('.html')) {
            logger.warning({
              file: file.relativePath,
              location: '<link rel="alternate">',
              component: 'Hreflang tags',
              issue: `Hreflang URL contains .html extension`,
              currentValue: alt.href,
              reason: 'Clean URLs without .html are preferred',
              fix: 'Remove .html extension from URL',
            });
          }
        }

        // Check 5: Coverage
        if (availableLanguages.length > 1) {
          const hreflangLangs = alternates.map((alt) => alt.hreflang.split('-')[0]);
          for (const lang of availableLanguages) {
            if (!hreflangLangs.includes(lang)) {
              logger.warning({
                file: file.relativePath,
                location: '<head> section',
                component: 'Hreflang tags',
                issue: `Missing hreflang for language: ${lang}`,
                reason: `Language ${lang} exists in project but no hreflang tag found`,
                fix: `Add <link rel="alternate" hreflang="${lang}" href="..." />`,
              });
            }
          }
        }

      } catch (error) {
        logger.error({
          file: file.relativePath,
          component: 'File parsing',
          issue: `Failed to parse HTML file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    const stats = logger.getStats();
    return {
      name: alternateValidator.name,
      slug: alternateValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default alternateValidator;