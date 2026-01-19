/**
 * URL Format Validator
 * Kiểm tra format của internal links
 */

import { getTargetDir } from '../config.js';
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractInternalLinks } from '../utils/html-parser.js';

// Target directory determined at runtime via getTargetDir()

export const urlFormatValidator: Validator = {
  name: 'URL Format',
  slug: 'url-format',
  description: 'Validates clean URL format (no .html, /index)',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking URL formats in HTML files...');

    const files = await scanHtmlFiles({
      rootDir: getTargetDir(),
      include: ['**/*.html', 'pages/**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const links = extractInternalLinks(parsed);

        for (const href of links) {
          // Skip anchor links
          if (href.startsWith('#')) continue;

          // Skip javascript: and mailto: links
          if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            continue;
          }

          // Check 1: .html extension
          if (href.endsWith('.html')) {
            logger.error({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains .html extension',
              currentValue: href,
              expectedValue: href.replace(/\.html$/, ''),
              reason: 'Clean URLs without .html are better for SEO and user experience',
              fix: `Change to: ${href.replace(/\.html$/, '')}`,
            });
          }

          // Check 2: /index in URL
          if (href.endsWith('/index') || href.includes('/index/') || href === 'index') {
            logger.error({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains /index',
              currentValue: href,
              expectedValue: href.replace(/\/index$/, '/').replace(/\/index\//, '/'),
              reason: '/index should be removed from URLs',
              fix: `Change to: ${href.replace(/\/index$/, '/').replace(/\/index\//, '/')}`,
            });
          }

          // Check 3: Double slashes (except protocol)
          if (href.includes('//') && !href.startsWith('//')) {
            logger.warning({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains double slashes',
              currentValue: href,
              reason: 'Double slashes may cause issues',
              fix: `Remove duplicate slashes`,
            });
          }

          // Check 4: Trailing slash consistency (warning only)
          // Skip root path "/"
          if (href !== '/' && href.endsWith('/') && !href.endsWith('//')) {
            // This is just a note - trailing slash is a stylistic choice
            // Some sites use trailing slashes, some don't
          }

          // Check 5: Uppercase in URL
          if (href !== href.toLowerCase() && !href.includes('?')) {
            logger.warning({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains uppercase characters',
              currentValue: href,
              expectedValue: href.toLowerCase(),
              reason: 'URLs should be lowercase for consistency',
              fix: `Change to: ${href.toLowerCase()}`,
            });
          }

          // Check 6: Spaces in URL
          if (href.includes(' ')) {
            logger.error({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains spaces',
              currentValue: href,
              reason: 'Spaces in URLs should be encoded or replaced with hyphens',
              fix: 'Replace spaces with hyphens or %20',
            });
          }

          // Check 7: Special characters
          const specialChars = /[<>{}|\\^`\[\]]/;
          if (specialChars.test(href)) {
            logger.error({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains invalid characters',
              currentValue: href,
              reason: 'URLs should not contain special characters like < > { } | \\ ^ ` [ ]',
              fix: 'Remove or encode special characters',
            });
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
    const duration = Date.now() - startTime;

    return {
      name: urlFormatValidator.name,
      slug: urlFormatValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default urlFormatValidator;
