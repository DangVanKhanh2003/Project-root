/**
 * Structured Data (JSON-LD) Validator
 * Kiểm tra JSON-LD structured data
 */

import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractJsonLd } from '../utils/html-parser.js';

const ROOT_DIR = process.cwd();

export const structuredDataValidator: Validator = {
  name: 'Structured Data (JSON-LD)',
  slug: 'structured-data',
  description: 'Validates JSON-LD structured data syntax and placement',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Scanning HTML files for structured data...');

    const files = await scanHtmlFiles({
      rootDir: ROOT_DIR,
      include: ['**/*.html', 'pages/**/*.html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/_11ty-output/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const jsonLdItems = extractJsonLd(parsed);

        // Check if any JSON-LD exists
        const hasJsonLd = jsonLdItems.some((item) => item.exists);

        if (!hasJsonLd) {
          logger.warning({
            file: file.relativePath,
            location: '<head> or <body>',
            component: 'JSON-LD Structured Data',
            issue: 'No JSON-LD structured data found',
            reason: 'Structured data helps search engines understand page content',
            fix: 'Add <script type="application/ld+json">...</script> with relevant schema',
          });
          continue;
        }

        // Validate each JSON-LD block
        for (let i = 0; i < jsonLdItems.length; i++) {
          const jsonLd = jsonLdItems[i];

          // Check 1: Valid JSON syntax
          if (!jsonLd.isValid) {
            logger.error({
              file: file.relativePath,
              location: `<script type="application/ld+json"> #${i + 1}`,
              component: 'JSON-LD Structured Data',
              issue: 'Invalid JSON syntax',
              reason: jsonLd.parseError || 'Failed to parse JSON',
              fix: 'Fix JSON syntax errors (validate with jsonlint.com)',
            });
            continue;
          }

          // Check 2: Placement (prefer in head)
          if (!jsonLd.inHead) {
            logger.warning({
              file: file.relativePath,
              location: `<script type="application/ld+json"> #${i + 1}`,
              component: 'JSON-LD Structured Data',
              issue: 'JSON-LD not in <head>',
              reason: 'Placing JSON-LD in <head> is recommended for faster parsing',
              fix: 'Move the JSON-LD script to the <head> section',
            });
          }

          // Check 3: Has @context
          if (jsonLd.data && !jsonLd.data['@context']) {
            logger.error({
              file: file.relativePath,
              location: `<script type="application/ld+json"> #${i + 1}`,
              component: 'JSON-LD Structured Data',
              issue: 'Missing @context',
              reason: '@context is required for valid JSON-LD',
              fix: 'Add "@context": "https://schema.org" to the JSON-LD',
            });
          }

          // Check 4: Has @type (hoặc @graph với @type bên trong)
          if (jsonLd.data) {
            const hasRootType = !!jsonLd.data['@type'];
            const hasGraph = Array.isArray(jsonLd.data['@graph']);

            if (!hasRootType && !hasGraph) {
              // Không có @type và không có @graph
              logger.error({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Structured Data',
                issue: 'Missing @type',
                reason: '@type defines what kind of entity is being described',
                fix: 'Add "@type" property (e.g., "WebSite", "Organization", "FAQPage")',
              });
            } else if (hasGraph) {
              // Có @graph - check xem mỗi item có @type không
              const graphItems = jsonLd.data['@graph'] as Record<string, unknown>[];
              const itemsWithoutType = graphItems.filter((item, idx) => !item['@type']);

              if (itemsWithoutType.length > 0) {
                logger.warning({
                  file: file.relativePath,
                  location: `<script type="application/ld+json"> #${i + 1}`,
                  component: 'JSON-LD Structured Data',
                  issue: `${itemsWithoutType.length} items in @graph missing @type`,
                  reason: 'Each item in @graph should have @type',
                  fix: 'Add @type to all items in @graph array',
                });
              }
            }
          }

          // Check 5: Valid schema.org context
          if (jsonLd.data && jsonLd.data['@context']) {
            const context = String(jsonLd.data['@context']);
            if (!context.includes('schema.org')) {
              logger.warning({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Structured Data',
                issue: 'Non-standard @context',
                currentValue: context,
                expectedValue: 'https://schema.org',
                reason: 'Most search engines expect schema.org vocabulary',
                fix: 'Use "https://schema.org" as @context',
              });
            }
          }

          // Check 6: WebSite schema validation
          if (jsonLd.data && jsonLd.data['@type'] === 'WebSite') {
            if (!jsonLd.data['name']) {
              logger.warning({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD WebSite',
                issue: 'WebSite schema missing name',
                reason: 'name property is recommended for WebSite schema',
                fix: 'Add "name" property to WebSite schema',
              });
            }
            if (!jsonLd.data['url']) {
              logger.warning({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD WebSite',
                issue: 'WebSite schema missing url',
                reason: 'url property is recommended for WebSite schema',
                fix: 'Add "url" property to WebSite schema',
              });
            }
          }

          // Check 7: Organization schema validation
          if (jsonLd.data && jsonLd.data['@type'] === 'Organization') {
            if (!jsonLd.data['name']) {
              logger.error({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Organization',
                issue: 'Organization schema missing name',
                reason: 'name is required for Organization schema',
                fix: 'Add "name" property',
              });
            }
            if (!jsonLd.data['logo']) {
              logger.warning({
                file: file.relativePath,
                location: `<script type="application/ld+json"> #${i + 1}`,
                component: 'JSON-LD Organization',
                issue: 'Organization schema missing logo',
                reason: 'logo is recommended for Organization schema',
                fix: 'Add "logo" property with image URL',
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
    const duration = Date.now() - startTime;

    return {
      name: structuredDataValidator.name,
      slug: structuredDataValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default structuredDataValidator;
