/**
 * Meta Tags Validator
 * Checks for title and meta description tags.
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, extractMetaTags } from '../utils/html-parser.js';

// SEO best practices for meta tag lengths
const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const TITLE_WARNING_MAX = 70;

const DESC_MIN_LENGTH = 70;
const DESC_OPTIMAL_MIN = 140;
const DESC_OPTIMAL_MAX = 155;
const DESC_MAX_LENGTH = 160;

export const metaTagsValidator: Validator = {
  name: 'Meta Tags',
  slug: 'meta-tags',
  description: 'Validates title and meta description tags',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;
    const seenTitles = new Map<string, string>();
    const seenDescriptions = new Map<string, string>();

    logger.info('Scanning HTML files for meta tags...');

    const files = await scanHtmlFiles({
      rootDir: targetDir,
      include: ['**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        const meta = extractMetaTags(parsed);

        // Title Tag Validation
        if (!meta.title) {
          logger.error({
            file: file.relativePath,
            component: 'Title tag',
            issue: 'Missing <title> tag',
            fix: 'Add a descriptive <title> tag to the <head> section.',
          });
        } else {
          const { length } = meta.title;
          if (length < TITLE_MIN_LENGTH) {
            logger.warning({
              file: file.relativePath,
              component: 'Title tag',
              issue: `Title too short (${length} chars, recommend ${TITLE_MIN_LENGTH}+)`,
              fix: 'Add more descriptive content to the title.',
            });
          } else if (length > TITLE_WARNING_MAX) {
            logger.error({
              file: file.relativePath,
              component: 'Title tag',
              issue: `Title too long (${length} chars, max ${TITLE_WARNING_MAX})`,
              fix: `Shorten title to under ${TITLE_MAX_LENGTH} characters.`,
            });
          } else if (length > TITLE_MAX_LENGTH) {
            logger.warning({
              file: file.relativePath,
              component: 'Title tag',
              issue: `Title may be truncated (${length} chars, optimal max ${TITLE_MAX_LENGTH})`,
              fix: `Consider shortening to under ${TITLE_MAX_LENGTH} characters.`,
            });
          }

          if (seenTitles.has(meta.title)) {
            logger.error({
              file: file.relativePath,
              component: 'Title tag',
              issue: 'Duplicate title tag found',
              reason: `Same title used in: ${seenTitles.get(meta.title)}`,
              fix: 'Each page must have a unique title.',
            });
          } else {
            seenTitles.set(meta.title, file.relativePath);
          }
        }

        // Meta Description Validation
        if (!meta.description) {
          logger.error({
            file: file.relativePath,
            component: 'Meta description',
            issue: 'Missing meta description',
            fix: 'Add <meta name="description" content="..." /> to the <head> section.',
          });
        } else {
          const { length } = meta.description;
          if (length < DESC_MIN_LENGTH) {
            logger.warning({
              file: file.relativePath,
              component: 'Meta description',
              issue: `Description too short (${length} chars, recommend ${DESC_MIN_LENGTH}+)`,
              fix: `Expand description to the optimal range of ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters.`,
            });
          } else if (length > DESC_MAX_LENGTH) {
            logger.error({
              file: file.relativePath,
              component: 'Meta description',
              issue: `Description too long (${length} chars, max ${DESC_MAX_LENGTH})`,
              fix: `Shorten description to the optimal range of ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX} characters.`,
            });
          }

          if (seenDescriptions.has(meta.description)) {
            logger.error({
              file: file.relativePath,
              component: 'Meta description',
              issue: 'Duplicate meta description found',
              reason: `Same description used in: ${seenDescriptions.get(meta.description)}`,
              fix: 'Each page should have a unique meta description.',
            });
          } else {
            seenDescriptions.set(meta.description, file.relativePath);
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
      name: metaTagsValidator.name,
      slug: metaTagsValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default metaTagsValidator;
