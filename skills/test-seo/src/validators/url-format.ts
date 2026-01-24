/**
 * URL Format Validator
 * Checks the format of internal links within HTML files.
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractInternalLinks } from '../utils/html-parser.js';

export const urlFormatValidator: Validator = {
  name: 'URL Format',
  slug: 'url-format',
  description: 'Validates clean URL format for internal links (no .html, /index)',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking internal URL formats...');

    const files = await scanHtmlFiles({
      rootDir: targetDir,
      include: ['**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const links = extractInternalLinks(parsed);

        for (const href of links) {
          if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            continue;
          }

          if (href.endsWith('.html')) {
            logger.error({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains .html extension',
              fix: `Change link to: ${href.replace(/\.html$/, '')}`,
            });
          }

          if (href.endsWith('/index')) {
            logger.error({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains /index suffix',
              fix: `Change link to: ${href.replace(/\/index$/, '/')}`,
            });
          }

          if (href.includes('//') && !href.startsWith('//')) {
            logger.warning({
              file: file.relativePath,
              location: `<a href="${href}">`,
              component: 'Internal Link',
              issue: 'Link contains double slashes',
              fix: 'Remove duplicate slashes from the URL path.',
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
    return {
      name: urlFormatValidator.name,
      slug: urlFormatValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default urlFormatValidator;