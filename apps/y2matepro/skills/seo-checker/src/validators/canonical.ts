/**
 * Canonical Tag Validator
 * Kiểm tra canonical tags trong HTML files
 */

import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractCanonical } from '../utils/html-parser.js';

const ROOT_DIR = process.cwd();
const BASE_URL = 'https://y2matepro.com';

export const canonicalValidator: Validator = {
  name: 'Canonical Tags',
  slug: 'canonical',
  description: 'Validates that all HTML pages have proper canonical tags',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Scanning HTML files for canonical tags...');

    const files = await scanHtmlFiles({
      rootDir: ROOT_DIR,
      include: ['**/*.html', 'pages/**/*.html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/_11ty-output/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const canonical = extractCanonical(parsed);

        // Check 1: Canonical tag exists
        if (!canonical.exists) {
          logger.error({
            file: file.relativePath,
            location: '<head> section',
            component: 'Canonical URL tag',
            issue: 'Missing canonical tag',
            reason: 'Search engines need canonical tags to understand the preferred URL for this page',
            fix: `Add <link rel="canonical" href="${getExpectedCanonical(file.relativePath)}" />`,
          });
          continue;
        }

        // Check 2: Canonical has href
        if (!canonical.href) {
          logger.error({
            file: file.relativePath,
            location: '<link rel="canonical">',
            component: 'Canonical URL tag',
            issue: 'Canonical tag missing href attribute',
            reason: 'Canonical tag must have a valid href to be effective',
            fix: `Add href="${getExpectedCanonical(file.relativePath)}" to the canonical tag`,
          });
          continue;
        }

        // Check 3: Canonical URL format
        const expectedCanonical = getExpectedCanonical(file.relativePath);
        if (canonical.href !== expectedCanonical) {
          // Warning if different but still valid URL
          if (canonical.href.startsWith('http')) {
            logger.warning({
              file: file.relativePath,
              location: '<link rel="canonical">',
              component: 'Canonical URL tag',
              issue: 'Canonical URL may not match expected pattern',
              currentValue: canonical.href,
              expectedValue: expectedCanonical,
              reason: 'Canonical URL should match the expected URL structure',
              fix: `Consider updating to: ${expectedCanonical}`,
            });
          } else {
            logger.error({
              file: file.relativePath,
              location: '<link rel="canonical">',
              component: 'Canonical URL tag',
              issue: 'Canonical URL is not an absolute URL',
              currentValue: canonical.href,
              expectedValue: expectedCanonical,
              reason: 'Canonical URLs must be absolute URLs starting with https://',
              fix: `Change to absolute URL: ${expectedCanonical}`,
            });
          }
        }

        // Check 4: No .html extension in canonical
        if (canonical.href.endsWith('.html')) {
          logger.warning({
            file: file.relativePath,
            location: '<link rel="canonical">',
            component: 'Canonical URL tag',
            issue: 'Canonical URL contains .html extension',
            currentValue: canonical.href,
            reason: 'Clean URLs without .html extension are preferred for SEO',
            fix: `Remove .html extension from canonical URL`,
          });
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
    const duration = Date.now() - startTime;

    return {
      name: canonicalValidator.name,
      slug: canonicalValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

/**
 * Get expected canonical URL for a file
 */
function getExpectedCanonical(relativePath: string): string {
  let url = relativePath
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/^index$/, '');

  if (!url) {
    return BASE_URL;
  }

  return `${BASE_URL}/${url}`;
}

export default canonicalValidator;
