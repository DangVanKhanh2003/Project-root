/**
 * Sitemap Validator
 * Checks for the presence and format of sitemap.xml.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';

export const sitemapValidator: Validator = {
  name: 'Sitemap',
  slug: 'sitemap',
  description: 'Validates sitemap.xml format and content',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    
    logger.info('Checking for sitemap.xml...');

    const possiblePaths = [
      path.join(targetDir, 'sitemap.xml'),
      path.join(appRoot, 'public', 'sitemap.xml'), // Common fallback
    ];

    const sitemapPath = possiblePaths.find(p => fs.existsSync(p));

    if (!sitemapPath) {
      logger.error({
        file: 'sitemap.xml',
        component: 'Sitemap',
        issue: 'sitemap.xml not found',
        reason: 'A sitemap helps search engines discover and index all pages on your site.',
        fix: 'Generate a sitemap.xml and place it in your build output directory (e.g., dist/sitemap.xml).',
      });
      return {
        name: sitemapValidator.name,
        slug: sitemapValidator.slug,
        passed: false,
        errorCount: 1,
        warningCount: 0,
        filesChecked: 0,
        duration: Date.now() - startTime,
      };
    }

    const relativePath = path.relative(appRoot, sitemapPath);
    let filesChecked = 1;

    try {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      const urls = Array.from(content.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);

      logger.info(`Found ${urls.length} URLs in ${relativePath}`);

      if (urls.length === 0) {
        logger.error({
          file: relativePath,
          component: 'Sitemap',
          issue: 'Sitemap contains no URLs',
          fix: 'Add <url><loc>...</loc></url> entries for each page.',
        });
      }

      for (const url of urls) {
        if (url.endsWith('.html')) {
          logger.warning({
            file: relativePath,
            component: 'Sitemap URL',
            issue: 'URL contains .html extension',
            currentValue: url,
            fix: 'Remove the .html extension for cleaner URLs.',
          });
        }
        if (url.startsWith('http://')) {
          logger.error({
            file: relativePath,
            component: 'Sitemap URL',
            issue: 'URL uses insecure HTTP',
            currentValue: url,
            fix: 'Change http:// to https://.',
          });
        }
        if (!url.startsWith(siteConfig.baseUrl)) {
            logger.warning({
                file: relativePath,
                component: 'Sitemap URL',
                issue: 'URL does not match site base URL',
                currentValue: url,
                expectedValue: siteConfig.baseUrl,
                fix: `Ensure all sitemap URLs start with ${siteConfig.baseUrl}.`,
            });
        }
      }

      const stats = fs.statSync(sitemapPath);
      if (stats.size > 50 * 1024 * 1024) {
        logger.error({
          file: relativePath,
          component: 'Sitemap',
          issue: `Sitemap is too large (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
          reason: 'Sitemaps must be under 50MB.',
          fix: 'Split the sitemap into multiple smaller files using a sitemap index.',
        });
      }
      if (urls.length > 50000) {
        logger.error({
          file: relativePath,
          component: 'Sitemap',
          issue: `Too many URLs (${urls.length})`,
          reason: 'A single sitemap file can have a maximum of 50,000 URLs.',
          fix: 'Split the sitemap into multiple smaller files using a sitemap index.',
        });
      }

    } catch (error) {
      logger.error({
        file: relativePath,
        component: 'File reading',
        issue: `Failed to read or parse sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    const stats = logger.getStats();
    return {
      name: sitemapValidator.name,
      slug: sitemapValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default sitemapValidator;
