/**
 * Canonical Tag Validator
 * Kiểm tra canonical tags trong HTML files
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractCanonical } from '../utils/html-parser.js';

export const canonicalValidator: Validator = {
  name: 'Canonical Tags',
  slug: 'canonical',
  description: 'Validates that all HTML pages have proper canonical tags',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;
    const { baseUrl } = siteConfig;

    logger.info(`Scanning HTML files in: ${targetDir}`);

    const files = await scanHtmlFiles({
      rootDir: targetDir,
      include: ['**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const canonical = extractCanonical(parsed);
        const expectedCanonical = getExpectedCanonical(file.relativePath, baseUrl);

        // Check 1: Canonical tag exists
        if (!canonical.exists) {
          logger.error({
            file: file.relativePath,
            location: '<head> section',
            component: 'Canonical URL tag',
            issue: 'Missing canonical tag',
            reason: 'Search engines need canonical tags to understand the preferred URL for this page',
            fix: `Add <link rel="canonical" href="${expectedCanonical}" />`,
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
            fix: `Add href="${expectedCanonical}" to the canonical tag`,
          });
          continue;
        }

        // Check 3: Canonical URL format
        if (canonical.href !== expectedCanonical) {
          if (canonical.href.startsWith('http')) {
            logger.warning({
              file: file.relativePath,
              location: '<link rel="canonical">',
              component: 'Canonical URL tag',
              issue: 'Canonical URL may not match expected pattern',
              currentValue: canonical.href,
              expectedValue: expectedCanonical,
              reason: 'Canonical URL should match the expected URL structure for consistency.',
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
            fix: 'Remove .html extension from canonical URL',
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
    return {
      name: canonicalValidator.name,
      slug: canonicalValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

/**
 * Get expected canonical URL for a file
 */
function getExpectedCanonical(relativePath: string, baseUrl: string): string {
  let urlPath = relativePath
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/^index$/, '');

  // Remove leading slash if it exists, as baseUrl doesn't have a trailing one
  if (urlPath.startsWith('/')) {
    urlPath = urlPath.substring(1);
  }
  
  if (!urlPath) {
    return baseUrl;
  }

  return `${baseUrl}/${urlPath}`;
}

export default canonicalValidator;
