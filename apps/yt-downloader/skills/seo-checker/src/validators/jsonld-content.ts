/**
 * JSON-LD Content Validator
 * Kiểm tra nội dung JSON-LD (không có HTML tags, không có placeholders)
 */

import { getTargetDir } from '../config.js';
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import {
  parseHtmlFile,
  extractJsonLd,
  jsonLdContainsHtml,
  jsonLdContainsPlaceholders,
} from '../utils/html-parser.js';

// Target directory determined at runtime via getTargetDir()

export const jsonldContentValidator: Validator = {
  name: 'JSON-LD Content',
  slug: 'jsonld-content',
  description: 'Validates JSON-LD content (no HTML tags, no placeholders)',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking JSON-LD content quality...');

    const files = await scanHtmlFiles({
      rootDir: getTargetDir(),
      include: ['**/*.html', 'pages/**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const jsonLdItems = extractJsonLd(parsed);

        for (let i = 0; i < jsonLdItems.length; i++) {
          const jsonLd = jsonLdItems[i];

          // Skip if no valid data
          if (!jsonLd.exists || !jsonLd.isValid || !jsonLd.data) {
            continue;
          }

          // Check 1: HTML tags in JSON-LD values
          const htmlCheck = jsonLdContainsHtml(jsonLd);
          if (htmlCheck.contains) {
            for (const field of htmlCheck.fields) {
              logger.error({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Content',
                issue: `HTML tags found in JSON-LD field: ${field}`,
                reason: 'JSON-LD values should not contain HTML markup',
                fix: 'Remove HTML tags from the value, use plain text only',
              });
            }
          }

          // Check 2: Placeholder text
          const placeholderCheck = jsonLdContainsPlaceholders(jsonLd);
          if (placeholderCheck.contains) {
            for (const field of placeholderCheck.fields) {
              logger.error({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Content',
                issue: `Placeholder text found in JSON-LD field: ${field}`,
                reason: 'JSON-LD should not contain placeholder text like TODO, FIXME, [INSERT]',
                fix: 'Replace placeholder with actual content',
              });
            }
          }

          // Check 3: Empty required fields
          const requiredFields = ['name', 'description'];
          for (const field of requiredFields) {
            const value = jsonLd.data[field];
            if (value !== undefined && (value === '' || value === null)) {
              logger.warning({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Content',
                issue: `Empty value for field: ${field}`,
                reason: 'Important fields should have meaningful content',
                fix: `Add content to the "${field}" field`,
              });
            }
          }

          // Check 4: URL validation in JSON-LD
          const urlFields = ['url', 'logo', 'image', 'mainEntityOfPage', 'sameAs'];
          for (const field of urlFields) {
            const value = jsonLd.data[field];
            if (typeof value === 'string' && value) {
              // Check for placeholder URLs
              if (
                value.includes('example.com') ||
                value.includes('yoursite.com') ||
                value.includes('localhost')
              ) {
                logger.error({
                  file: file.relativePath,
                  location: `<script type="application/ld+json"> #${i + 1}`,
                  component: 'JSON-LD Content',
                  issue: `Placeholder URL in field "${field}"`,
                  currentValue: value,
                  reason: 'URLs should point to actual resources',
                  fix: 'Replace with the actual URL',
                });
              }

              // Check for HTTP instead of HTTPS
              if (value.startsWith('http://')) {
                logger.warning({
                  file: file.relativePath,
                  location: `<script type="application/ld+json"> #${i + 1}`,
                  component: 'JSON-LD Content',
                  issue: `HTTP URL in field "${field}"`,
                  currentValue: value,
                  reason: 'URLs should use HTTPS',
                  fix: 'Change http:// to https://',
                });
              }
            }

            // Check array of URLs (like sameAs)
            if (Array.isArray(value)) {
              for (const url of value) {
                if (typeof url === 'string') {
                  if (url.includes('example.com') || url.includes('yoursite.com')) {
                    logger.error({
                      file: file.relativePath,
                      location: `<script type="application/ld+json"> #${i + 1}`,
                      component: 'JSON-LD Content',
                      issue: `Placeholder URL in "${field}" array`,
                      currentValue: url,
                      reason: 'URLs should point to actual resources',
                      fix: 'Replace with actual URL or remove',
                    });
                  }
                }
              }
            }
          }

          // Check 5: Image URLs
          if (jsonLd.data['image']) {
            const image = jsonLd.data['image'];
            const imageUrl = typeof image === 'string' ? image : (image as Record<string, unknown>)?.url;

            if (typeof imageUrl === 'string') {
              // Check for missing image URL
              if (imageUrl === '' || imageUrl === '#') {
                logger.error({
                  file: file.relativePath,
                  location: `<script type="application/ld+json"> #${i + 1}`,
                  component: 'JSON-LD Content',
                  issue: 'Invalid image URL',
                  currentValue: imageUrl,
                  reason: 'Image URL should be a valid, absolute URL',
                  fix: 'Add a valid image URL',
                });
              }
            }
          }

          // Check 6: Date format validation
          const dateFields = ['datePublished', 'dateModified', 'dateCreated'];
          for (const field of dateFields) {
            const value = jsonLd.data[field];
            if (typeof value === 'string' && value) {
              // Check for valid ISO 8601 format
              const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
              if (!isoDateRegex.test(value)) {
                logger.warning({
                  file: file.relativePath,
                  location: `<script type="application/ld+json"> #${i + 1}`,
                  component: 'JSON-LD Content',
                  issue: `Invalid date format in "${field}"`,
                  currentValue: value,
                  expectedValue: 'YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
                  reason: 'Dates should be in ISO 8601 format',
                  fix: 'Use format like 2024-01-15 or 2024-01-15T10:30:00',
                });
              }
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
    const duration = Date.now() - startTime;

    return {
      name: jsonldContentValidator.name,
      slug: jsonldContentValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default jsonldContentValidator;
