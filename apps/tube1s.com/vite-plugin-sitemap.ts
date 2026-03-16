import type { Plugin } from 'vite';
import { readdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'fs';
import { resolve, join, relative } from 'path';

interface SitemapConfig {
  baseUrl?: string;
  changefreq?: string;
  defaultPriority?: number;
  homePriority?: number;
}

/**
 * Vite plugin to generate sitemap.xml after build
 * Supports multilingual pages with hreflang alternate links
 */
export function sitemapPlugin(config: SitemapConfig = {}): Plugin {
  const {
    changefreq = 'weekly',
    defaultPriority = 0.8,
    homePriority = 1.0
  } = config;

  return {
    name: 'vite-plugin-sitemap',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');

      if (!existsSync(distDir)) {
        console.warn('[sitemap] dist directory not found, skipping sitemap generation');
        return;
      }

      // Read base URL from site.json
      const siteConfigPath = resolve(__dirname, '_templates/_data/site.json');
      let baseUrl = 'https://tube1s.com';

      if (existsSync(siteConfigPath)) {
        try {
          const siteConfig = JSON.parse(readFileSync(siteConfigPath, 'utf-8'));
          if (siteConfig.url) {
            baseUrl = siteConfig.url.replace(/\/$/, ''); // Remove trailing slash
          }
        } catch (err) {
          console.warn('[sitemap] Failed to read site.json, using default URL');
        }
      }

      // Collect all HTML files from dist directory (final build output)
      const htmlFiles = collectHtmlFiles(distDir, distDir);

      if (htmlFiles.length === 0) {
        console.warn('[sitemap] No HTML files found in dist directory');
        return;
      }

      // Generate sitemap XML
      const today = new Date().toISOString().split('T')[0];
      const urls = htmlFiles.map(file => {
        const urlPath = file.replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
        const fullUrl = urlPath ? `${baseUrl}/${urlPath}` : baseUrl;
        const isHome = urlPath === '' || urlPath.match(/^[a-z]{2}$/) !== null;
        const priority = isHome ? homePriority : defaultPriority;

        return generateUrlEntry(fullUrl, today, changefreq, priority);
      });

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      // Write sitemap.xml to dist
      const sitemapPath = join(distDir, 'sitemap.xml');
      writeFileSync(sitemapPath, sitemap, 'utf-8');
      console.log(`[sitemap] Generated sitemap.xml with ${htmlFiles.length} URLs`);
    }
  };
}

/**
 * Files to exclude from sitemap
 */
const EXCLUDE_FILES = ['404.html', 'google68e5433e346059c9.html'];

/**
 * Patterns to exclude from sitemap (regex)
 */
const EXCLUDE_PATTERNS = [
  /^google[a-z0-9]+\.html$/,  // Google verification files
  /^Bing.*\.xml$/i,           // Bing verification files
];

/**
 * Check if a file should be excluded from sitemap
 */
function shouldExclude(filename: string): boolean {
  if (EXCLUDE_FILES.includes(filename)) return true;
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Recursively collect all HTML files from a directory
 */
function collectHtmlFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip asset directories
      if (entry.name === 'assets' || entry.name === 'public') {
        continue;
      }
      files.push(...collectHtmlFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.html')) {
      // Skip excluded files (404, verification files, etc.)
      if (shouldExclude(entry.name)) {
        continue;
      }
      // Get relative path from dist
      const relativePath = relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Generate a single URL entry for the sitemap
 */
function generateUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: number
): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
