/**
 * Meta Tags Validator
 * Kiểm tra title và meta description tags
 */

import { getTargetDir } from '../config.js';
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractMetaTags } from '../utils/html-parser.js';

// Target directory determined at runtime via getTargetDir()

// SEO best practices for meta tag lengths
const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const TITLE_WARNING_MAX = 70;

// Description: Tối ưu 140-155, tối đa 160, tối thiểu 70
const DESC_MIN_LENGTH = 70;
const DESC_OPTIMAL_MIN = 140;
const DESC_OPTIMAL_MAX = 155;
const DESC_MAX_LENGTH = 160;

export const metaTagsValidator: Validator = {
  name: 'Meta Tags',
  slug: 'meta-tags',
  description: 'Validates title and meta description tags',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;
    const seenTitles = new Map<string, string>();
    const seenDescriptions = new Map<string, string>();

    logger.info('Scanning HTML files for meta tags...');

    const files = await scanHtmlFiles({
      rootDir: getTargetDir(),
      include: ['**/*.html', 'pages/**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const meta = extractMetaTags(parsed);

        // ============================================
        // Title Tag Validation
        // ============================================

        if (!meta.title) {
          logger.error({
            file: file.relativePath,
            location: '<head> section',
            component: 'Title tag',
            issue: 'Missing <title> tag',
            reason: 'Title tags are critical for SEO and user experience',
            fix: 'Add a descriptive <title> tag',
          });
        } else {
          const titleLength = meta.title.length;

          // Check title length
          if (titleLength < TITLE_MIN_LENGTH) {
            logger.warning({
              file: file.relativePath,
              location: '<title>',
              component: 'Title tag',
              issue: `Title too short (${titleLength} chars)`,
              currentValue: meta.title,
              reason: `Title should be at least ${TITLE_MIN_LENGTH} characters for SEO`,
              fix: 'Add more descriptive content to the title',
            });
          } else if (titleLength > TITLE_WARNING_MAX) {
            logger.error({
              file: file.relativePath,
              location: '<title>',
              component: 'Title tag',
              issue: `Title too long (${titleLength} chars)`,
              currentValue: meta.title.substring(0, 50) + '...',
              reason: `Title over ${TITLE_WARNING_MAX} chars will be truncated in search results`,
              fix: `Shorten title to under ${TITLE_MAX_LENGTH} characters`,
            });
          } else if (titleLength > TITLE_MAX_LENGTH) {
            logger.warning({
              file: file.relativePath,
              location: '<title>',
              component: 'Title tag',
              issue: `Title may be truncated (${titleLength} chars)`,
              currentValue: meta.title.substring(0, 50) + '...',
              reason: `Title over ${TITLE_MAX_LENGTH} chars may be truncated`,
              fix: `Consider shortening to ${TITLE_MAX_LENGTH} characters`,
            });
          }

          // Check for duplicate titles
          if (seenTitles.has(meta.title)) {
            logger.error({
              file: file.relativePath,
              location: '<title>',
              component: 'Title tag',
              issue: 'Duplicate title',
              currentValue: meta.title,
              reason: `Same title used in: ${seenTitles.get(meta.title)}`,
              fix: 'Each page should have a unique title',
            });
          } else {
            seenTitles.set(meta.title, file.relativePath);
          }
        }

        // ============================================
        // Meta Description Validation
        // ============================================

        if (!meta.description) {
          logger.error({
            file: file.relativePath,
            location: '<head> section',
            component: 'Meta description',
            issue: 'Missing meta description',
            reason: 'Meta descriptions help with click-through rates in search results',
            fix: 'Add <meta name="description" content="..." />',
          });
        } else {
          const descLength = meta.description.length;

          // Check description length
          // Tối thiểu: 70, Tối ưu: 140-155, Tối đa: 160
          if (descLength < DESC_MIN_LENGTH) {
            // Dưới 70 ký tự - quá ngắn
            logger.warning({
              file: file.relativePath,
              location: '<meta name="description">',
              component: 'Meta description',
              issue: `Description too short (${descLength} chars)`,
              currentValue: meta.description,
              reason: `Description should be at least ${DESC_MIN_LENGTH} characters`,
              fix: `Add more content to reach ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters`,
            });
          } else if (descLength > DESC_MAX_LENGTH) {
            // Trên 160 ký tự - Google sẽ cắt
            logger.error({
              file: file.relativePath,
              location: '<meta name="description">',
              component: 'Meta description',
              issue: `Description too long (${descLength} chars)`,
              currentValue: meta.description.substring(0, 80) + '...',
              reason: `Description over ${DESC_MAX_LENGTH} chars will be truncated by Google`,
              fix: `Shorten to ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters (optimal range)`,
            });
          } else if (descLength < DESC_OPTIMAL_MIN) {
            // 70-139 ký tự - OK nhưng có thể dài hơn
            logger.warning({
              file: file.relativePath,
              location: '<meta name="description">',
              component: 'Meta description',
              issue: `Description could be longer (${descLength} chars)`,
              currentValue: meta.description,
              reason: `Optimal description length is ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters`,
              fix: `Consider expanding to ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters`,
            });
          } else if (descLength > DESC_OPTIMAL_MAX) {
            // 156-160 ký tự - hơi dài nhưng vẫn OK
            logger.warning({
              file: file.relativePath,
              location: '<meta name="description">',
              component: 'Meta description',
              issue: `Description slightly over optimal (${descLength} chars)`,
              currentValue: meta.description.substring(0, 80) + '...',
              reason: `Optimal is ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} chars, max ${DESC_MAX_LENGTH}`,
              fix: `Consider shortening to ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters`,
            });
          }
          // 140-155 ký tự - hoàn hảo, không warning/error

          // Check for duplicate descriptions
          if (seenDescriptions.has(meta.description)) {
            logger.error({
              file: file.relativePath,
              location: '<meta name="description">',
              component: 'Meta description',
              issue: 'Duplicate meta description',
              currentValue: meta.description.substring(0, 50) + '...',
              reason: `Same description used in: ${seenDescriptions.get(meta.description)}`,
              fix: 'Each page should have a unique description',
            });
          } else {
            seenDescriptions.set(meta.description, file.relativePath);
          }
        }

        // ============================================
        // Open Graph Validation (Warnings only)
        // ============================================

        if (!meta.ogTitle) {
          logger.warning({
            file: file.relativePath,
            location: '<head> section',
            component: 'Open Graph',
            issue: 'Missing og:title',
            reason: 'Open Graph tags improve social media sharing',
            fix: 'Add <meta property="og:title" content="..." />',
          });
        }

        if (!meta.ogDescription) {
          logger.warning({
            file: file.relativePath,
            location: '<head> section',
            component: 'Open Graph',
            issue: 'Missing og:description',
            reason: 'Open Graph tags improve social media sharing',
            fix: 'Add <meta property="og:description" content="..." />',
          });
        }

        if (!meta.ogImage) {
          logger.warning({
            file: file.relativePath,
            location: '<head> section',
            component: 'Open Graph',
            issue: 'Missing og:image',
            reason: 'Pages without og:image may not display well when shared',
            fix: 'Add <meta property="og:image" content="..." />',
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
      name: metaTagsValidator.name,
      slug: metaTagsValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default metaTagsValidator;
