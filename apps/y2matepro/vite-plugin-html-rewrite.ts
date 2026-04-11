import type { Plugin } from 'vite';
import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

// 🌍 Auto-detect supported languages from pages/ directory
function getLanguages(): string[] {
  const pagesDir = resolve(__dirname, 'pages');
  if (!existsSync(pagesDir)) return [];

  return readdirSync(pagesDir, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name);
}

/**
 * URL Rewriting function - handles both dev and preview servers
 * Maps clean URLs to actual HTML file paths
 */
function rewriteUrl(url: string, isDev: boolean = true): string {
  const languages = getLanguages();

  // Determine path prefix based on mode
  const prefix = isDev ? '/pages' : '';

  // Handle /search route (SPA client-side routing)
  // /search → serve index.html
  if (url === '/search') {
    return isDev ? '/_11ty-output/index.html' : '/index.html';
  }

  // Handle language-specific URLs: /lang or /lang/page
  for (const lang of languages) {
    // SPA search route: /lang/search → serve lang index
    if (url === `/${lang}/search`) {
      return `${prefix}/${lang}/index.html`;
    }

    // SPA search route: /lang/page/search → serve lang/page
    const langPageSearchMatch = url.match(new RegExp(`^/${lang}/([^/]+)/search$`));
    if (langPageSearchMatch) {
      const pageName = langPageSearchMatch[1];
      return `${prefix}/${lang}/${pageName}.html`;
    }

    // Index: /lang or /lang/ → /[prefix]/lang/index.html
    if (url === `/${lang}` || url === `/${lang}/`) {
      return `${prefix}/${lang}/index.html`;
    }

    // Page: /lang/page → /[prefix]/lang/page.html
    const langPageMatch = url.match(new RegExp(`^/${lang}/([^/]+)$`));
    if (langPageMatch) {
      const pageName = langPageMatch[1];
      return `${prefix}/${lang}/${pageName}.html`;
    }
  }

  // Handle tool page /search routes (SPA routing)
  // /youtube-to-mp3/search → serve youtube-to-mp3.html
  const toolSearchMatch = url.match(/^\/([^/]+)\/search$/);
  if (toolSearchMatch) {
    const toolName = toolSearchMatch[1];
    return isDev ? `/${toolName}.html` : `/${toolName}.html`;
  }

  // Handle root-level static pages
  const staticPages: Record<string, string> = {
    '/about-us': isDev ? '/about-us.html' : '/about-us.html',
    '/contact': isDev ? '/contact.html' : '/contact.html',
    '/privacy-policy': isDev ? '/privacy-policy.html' : '/privacy-policy.html',
    '/terms-condition': isDev ? '/terms-condition.html' : '/terms-condition.html',
    '/404': isDev ? '/404.html' : '/404.html',
    // Tool pages
    '/youtube-to-mp3': isDev ? '/youtube-to-mp3.html' : '/youtube-to-mp3.html',
    '/youtube-to-mp4': isDev ? '/youtube-to-mp4.html' : '/youtube-to-mp4.html',
    '/youtube-short-downloader': isDev ? '/youtube-short-downloader.html' : '/youtube-short-downloader.html'
  };

  if (staticPages[url]) {
    return staticPages[url];
  }

  // Return original URL if no match
  return url;
}

/**
 * Vite plugin to handle clean URL routing for multi-page apps
 * Maps URLs like:
 * - /youtube-to-mp3 → /youtube-to-mp3.html
 * - /vi → /pages/vi/index.html (dev) or /vi/index.html (preview)
 * - /vi/youtube-to-mp3 → /pages/vi/youtube-to-mp3.html (dev) or /vi/youtube-to-mp3.html (preview)
 */
export function htmlRewritePlugin(): Plugin {
  const pageDir = resolve(__dirname, 'src/page');

  return {
    name: 'vite-plugin-html-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Skip if already has .html extension or is an asset
        if (url.includes('.') || url.includes('@')) {
          return next();
        }

        // Clean the URL (remove query params and trailing slash for matching)
        const cleanUrl = url.split('?')[0].replace(/\/$/, '') || '/';

        // Skip root path
        if (cleanUrl === '/') {
          return next();
        }

        // Try language/page URL rewriting first
        const rewrittenUrl = rewriteUrl(cleanUrl, true);
        if (rewrittenUrl !== cleanUrl) {
          req.url = rewrittenUrl;
          return next();
        }

        // Fallback: Try to find corresponding HTML file in src/page
        const pageName = cleanUrl.substring(1); // Remove leading slash
        const htmlPath = resolve(pageDir, `${pageName}.html`);

        if (existsSync(htmlPath)) {
          req.url = `/src/page/${pageName}.html`;
        }

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Skip if already has .html extension or is an asset
        if (url.includes('.') || url.includes('@')) {
          return next();
        }

        // Clean the URL (remove query params and trailing slash for matching)
        const cleanUrl = url.split('?')[0].replace(/\/$/, '') || '/';

        // Skip root path
        if (cleanUrl === '/') {
          return next();
        }

        // Try language/page URL rewriting
        const rewrittenUrl = rewriteUrl(cleanUrl, false);
        if (rewrittenUrl !== cleanUrl) {
          req.url = rewrittenUrl;
          return next();
        }

        // Fallback: Try to find corresponding HTML file in dist
        const pageName = cleanUrl.substring(1);
        req.url = `/${pageName}.html`;

        next();
      });
    }
  };
}
