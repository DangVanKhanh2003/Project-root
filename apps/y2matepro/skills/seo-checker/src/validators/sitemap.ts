/**
 * Sitemap Validator
 * Kiểm tra sitemap.xml
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';

const ROOT_DIR = process.cwd();

export const sitemapValidator: Validator = {
  name: 'Sitemap',
  slug: 'sitemap',
  description: 'Validates sitemap.xml format and URLs',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking sitemap.xml...');

    // Check possible sitemap locations
    const possiblePaths = [
      path.join(ROOT_DIR, 'public', 'sitemap.xml'),
      path.join(ROOT_DIR, 'sitemap.xml'),
      path.join(ROOT_DIR, '_11ty-output', 'sitemap.xml'),
    ];

    let sitemapPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        sitemapPath = p;
        break;
      }
    }

    // Check 1: Sitemap exists
    if (!sitemapPath) {
      logger.error({
        file: 'sitemap.xml',
        location: 'public/ or root directory',
        component: 'Sitemap',
        issue: 'sitemap.xml not found',
        reason: 'Sitemaps help search engines discover and index pages',
        fix: 'Create a sitemap.xml file in the public/ directory',
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

    filesChecked = 1;
    const relativePath = path.relative(ROOT_DIR, sitemapPath);

    try {
      const content = fs.readFileSync(sitemapPath, 'utf-8');

      // Check 2: Valid XML structure
      if (!content.includes('<?xml') || !content.includes('<urlset')) {
        logger.error({
          file: relativePath,
          location: 'File header',
          component: 'Sitemap',
          issue: 'Invalid sitemap XML structure',
          reason: 'Sitemap must have XML declaration and <urlset> element',
          fix: 'Ensure sitemap starts with <?xml...?> and contains <urlset>',
        });
      }

      // Check 3: Has xmlns
      if (!content.includes('xmlns=')) {
        logger.warning({
          file: relativePath,
          location: '<urlset>',
          component: 'Sitemap',
          issue: 'Missing xmlns namespace',
          reason: 'xmlns defines the sitemap schema version',
          fix: 'Add xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        });
      }

      // Extract URLs from sitemap
      const urlMatches = content.matchAll(/<loc>([^<]+)<\/loc>/g);
      const urls: string[] = [];
      for (const match of urlMatches) {
        urls.push(match[1]);
      }

      logger.info(`Found ${urls.length} URLs in sitemap`);

      if (urls.length === 0) {
        logger.error({
          file: relativePath,
          location: '<urlset>',
          component: 'Sitemap',
          issue: 'Sitemap contains no URLs',
          reason: 'An empty sitemap provides no value to search engines',
          fix: 'Add <url><loc>...</loc></url> entries for each page',
        });
      }

      // Check 4: URL validation
      for (const url of urls) {
        // Check for .html extension
        if (url.endsWith('.html')) {
          logger.warning({
            file: relativePath,
            location: '<loc>',
            component: 'Sitemap URL',
            issue: 'URL contains .html extension',
            currentValue: url,
            reason: 'Clean URLs without .html are preferred for SEO',
            fix: 'Remove .html extension from URL',
          });
        }

        // Check for /index
        if (url.endsWith('/index') || url.includes('/index/')) {
          logger.warning({
            file: relativePath,
            location: '<loc>',
            component: 'Sitemap URL',
            issue: 'URL contains /index',
            currentValue: url,
            reason: 'URLs should not include /index',
            fix: 'Remove /index from URL',
          });
        }

        // Check for HTTP (should be HTTPS)
        if (url.startsWith('http://')) {
          logger.error({
            file: relativePath,
            location: '<loc>',
            component: 'Sitemap URL',
            issue: 'URL uses HTTP instead of HTTPS',
            currentValue: url,
            reason: 'All URLs should use HTTPS for security',
            fix: 'Change http:// to https://',
          });
        }

        // Check for trailing slash consistency
        // (This is a stylistic choice, so just info)
      }

      // Check 5: Has lastmod
      const hasLastmod = content.includes('<lastmod>');
      if (!hasLastmod) {
        logger.warning({
          file: relativePath,
          location: '<url>',
          component: 'Sitemap',
          issue: 'No <lastmod> dates found',
          reason: 'lastmod helps search engines know when content was updated',
          fix: 'Add <lastmod>YYYY-MM-DD</lastmod> to each URL',
        });
      }

      // Check 6: Has changefreq (optional but recommended)
      const hasChangefreq = content.includes('<changefreq>');
      if (!hasChangefreq) {
        logger.warning({
          file: relativePath,
          location: '<url>',
          component: 'Sitemap',
          issue: 'No <changefreq> found',
          reason: 'changefreq hints how often content changes',
          fix: 'Add <changefreq>weekly</changefreq> (or appropriate value)',
        });
      }

      // Check 7: File size
      const stats = fs.statSync(sitemapPath);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB > 50) {
        logger.error({
          file: relativePath,
          component: 'Sitemap',
          issue: `Sitemap too large (${sizeMB.toFixed(2)} MB)`,
          reason: 'Sitemaps should be under 50MB',
          fix: 'Split into multiple sitemaps with a sitemap index',
        });
      } else if (sizeMB > 10) {
        logger.warning({
          file: relativePath,
          component: 'Sitemap',
          issue: `Sitemap is large (${sizeMB.toFixed(2)} MB)`,
          reason: 'Large sitemaps may be slow to process',
          fix: 'Consider splitting into multiple sitemaps',
        });
      }

      // Check 8: URL count
      if (urls.length > 50000) {
        logger.error({
          file: relativePath,
          component: 'Sitemap',
          issue: `Too many URLs (${urls.length})`,
          reason: 'Sitemaps can have maximum 50,000 URLs',
          fix: 'Split into multiple sitemaps with a sitemap index',
        });
      }

    } catch (error) {
      logger.error({
        file: relativePath,
        component: 'File reading',
        issue: `Failed to read sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    const stats = logger.getStats();
    const duration = Date.now() - startTime;

    return {
      name: sitemapValidator.name,
      slug: sitemapValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default sitemapValidator;
