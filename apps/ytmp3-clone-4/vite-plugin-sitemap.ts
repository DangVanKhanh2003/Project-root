import type { Plugin } from 'vite';
import { readdirSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve, join, relative } from 'path';

interface SitemapConfig {
  baseUrl?: string;
  changefreq?: string;
  defaultPriority?: number;
  homePriority?: number;
}

/**
 * Vite plugin to generate sitemap.xml after build
 */
export function sitemapPlugin(config: SitemapConfig = {}): Plugin {
  const {
    baseUrl = 'https://mp3fast.net',
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

      // Collect all HTML files from dist directory
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
const EXCLUDE_FILES = ['404.html'];

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
      // Skip excluded files
      if (EXCLUDE_FILES.includes(entry.name)) {
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
