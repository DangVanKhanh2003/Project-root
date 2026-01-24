/**
 * Structured Data (JSON-LD) Validator
 * Checks for the presence and syntax of JSON-LD structured data.
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractJsonLd } from '../utils/html-parser.js';

export const structuredDataValidator: Validator = {
  name: 'Structured Data (JSON-LD)',
  slug: 'structured-data',
  description: 'Validates JSON-LD structured data syntax and placement',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Scanning HTML files for structured data...');

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

        const hasJsonLd = jsonLdItems.some((item) => item.exists);
        if (!hasJsonLd) {
          logger.warning({
            file: file.relativePath,
            component: 'JSON-LD',
            issue: 'No JSON-LD structured data found',
            fix: 'Add <script type="application/ld+json"> with relevant schema.org types.',
          });
          continue;
        }

        for (let i = 0; i < jsonLdItems.length; i++) {
          const jsonLd = jsonLdItems[i];
          const location = `<script type="application/ld+json"> #${i + 1}`;

          if (!jsonLd.isValid) {
            logger.error({
              file: file.relativePath,
              location,
              component: 'JSON-LD',
              issue: 'Invalid JSON syntax',
              reason: jsonLd.parseError || 'Unknown parsing error.',
              fix: 'Fix syntax errors. Use a tool like the Schema Markup Validator to debug.',
            });
            continue;
          }

          if (!jsonLd.inHead) {
            logger.warning({
              file: file.relativePath,
              location,
              component: 'JSON-LD',
              issue: 'JSON-LD script should be in the <head> section',
              reason: 'Google recommends placing JSON-LD in the <head> for easier discovery.',
              fix: 'Move the script tag into the <head> of the document.',
            });
          }

          if (jsonLd.data) {
            if (!jsonLd.data['@context']) {
              logger.error({
                file: file.relativePath,
                location,
                component: 'JSON-LD',
                issue: 'Missing @context property',
                fix: 'Add `"@context": "https://schema.org"` to the JSON-LD object.',
              });
            } else if (!String(jsonLd.data['@context']).includes('schema.org')) {
              logger.warning({
                file: file.relativePath,
                location,
                component: 'JSON-LD',
                issue: 'Non-standard @context used',
                currentValue: String(jsonLd.data['@context']),
                fix: 'Use "https://schema.org" for the @context for best compatibility.',
              });
            }

            const hasRootType = !!jsonLd.data['@type'];
            const hasGraph = Array.isArray(jsonLd.data['@graph']);
            if (!hasRootType && !hasGraph) {
              logger.error({
                file: file.relativePath,
                location,
                component: 'JSON-LD',
                issue: 'Missing @type property',
                fix: 'Add an @type property (e.g., "WebSite", "Article").',
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
      name: structuredDataValidator.name,
      slug: structuredDataValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default structuredDataValidator;