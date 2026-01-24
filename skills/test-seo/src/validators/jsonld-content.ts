/**
 * JSON-LD Content Validator
 * Checks the content of JSON-LD scripts for quality issues.
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import {
  parseHtmlFile,
  extractJsonLd,
  jsonLdContainsHtml,
  jsonLdContainsPlaceholders,
} from '../utils/html-parser.js';

export const jsonldContentValidator: Validator = {
  name: 'JSON-LD Content',
  slug: 'jsonld-content',
  description: 'Validates JSON-LD content (no HTML tags, no placeholders)',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking JSON-LD content quality...');

    const files = await scanHtmlFiles({
      rootDir: targetDir,
      include: ['**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const jsonLdItems = extractJsonLd(parsed);

        for (let i = 0; i < jsonLdItems.length; i++) {
          const jsonLd = jsonLdItems[i];
          if (!jsonLd.exists || !jsonLd.isValid || !jsonLd.data) {
            continue;
          }

          const location = `<script type="application/ld+json"> #${i + 1}`;

          // Check for HTML tags
          const htmlCheck = jsonLdContainsHtml(jsonLd);
          if (htmlCheck.contains) {
            htmlCheck.fields.forEach(field => logger.error({
              file: file.relativePath,
              location,
              component: 'JSON-LD Content',
              issue: `HTML tags found in JSON-LD field: ${field}`,
              reason: 'JSON-LD values should be plain text, not HTML.',
              fix: 'Remove HTML tags from the value.',
            }));
          }

          // Check for placeholder text
          const placeholderCheck = jsonLdContainsPlaceholders(jsonLd);
          if (placeholderCheck.contains) {
            placeholderCheck.fields.forEach(field => logger.error({
              file: file.relativePath,
              location,
              component: 'JSON-LD Content',
              issue: `Placeholder text found in JSON-LD field: ${field}`,
              reason: 'JSON-LD should not contain placeholder text like TODO, FIXME, or [INSERT].',
              fix: 'Replace placeholder with actual content.',
            }));
          }

          // Check for empty required fields
          ['name', 'description'].forEach(field => {
            const value = jsonLd.data?.[field];
            if (value !== undefined && (value === '' || value === null)) {
              logger.warning({
                file: file.relativePath,
                location,
                component: 'JSON-LD Content',
                issue: `Empty value for recommended field: ${field}`,
                reason: 'Important fields should have meaningful content.',
                fix: `Add content to the "${field}" field.`,
              });
            }
          });

          // Check for placeholder or insecure URLs
          ['url', 'logo', 'image', 'mainEntityOfPage', 'sameAs'].forEach(field => {
            const value = jsonLd.data?.[field];
            const urls = Array.isArray(value) ? value : [value];

            for (const url of urls) {
              if (typeof url === 'string' && url) {
                if (/example\.com|yoursite\.com|localhost/.test(url)) {
                  logger.error({
                    file: file.relativePath,
                    location,
                    component: 'JSON-LD Content',
                    issue: `Placeholder URL in field "${field}"`,
                    currentValue: url,
                    reason: 'URLs must point to actual, live resources.',
                    fix: 'Replace with the correct, public URL.',
                  });
                }
                if (url.startsWith('http://')) {
                  logger.warning({
                    file: file.relativePath,
                    location,
                    component: 'JSON-LD Content',
                    issue: `Insecure HTTP URL in field "${field}"`,
                    currentValue: url,
                    reason: 'All URLs should use HTTPS for security.',
                    fix: 'Change http:// to https://.',
                  });
                }
              }
            }
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
      name: jsonldContentValidator.name,
      slug: jsonldContentValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default jsonldContentValidator;
