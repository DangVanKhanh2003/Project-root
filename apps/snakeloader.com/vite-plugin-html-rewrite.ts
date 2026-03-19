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

// 📄 Get available pages from _11ty-output directory
function getEleventyPages(): string[] {
  const eleventyDir = resolve(__dirname, '_11ty-output');
  if (!existsSync(eleventyDir)) return [];

  return readdirSync(eleventyDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html')
    .map(file => file.replace('.html', ''));
}

function injectFredokaFont(html: string): string {
  const fontMarker = 'Fredoka_SemiCondensed-Bold.woff2?v=2';
  if (html.includes(fontMarker) || !html.includes('</head>')) {
    return html;
  }

  const fontSnippet = [
    '    <link rel="preload" href="/fonts/Fredoka_SemiCondensed-Bold.woff2?v=2" as="font" type="font/woff2" crossorigin>',
    '    <style>',
    '        @font-face {',
    "            font-family: 'Fredoka SemiCondensed';",
    "            src: url('/fonts/Fredoka_SemiCondensed-Bold.woff2?v=2') format('woff2');",
    '            font-weight: 700;',
    '            font-style: normal;',
    '            font-display: swap;',
    '        }',
    '    </style>'
  ].join('\n');

  return html.replace('</head>', `${fontSnippet}\n\n</head>`);
}

/**
 * URL Rewriting function - handles both dev and preview servers
 * Maps clean URLs to actual HTML file paths
 */
function rewriteUrl(url: string, isDev: boolean = true): string {
  const languages = getLanguages();
  const eleventyPages = getEleventyPages();

  // Determine path prefix based on mode
  const langPrefix = isDev ? '/pages' : '';
  const eleventyPrefix = isDev ? '/_11ty-output' : '';

  // Handle language-specific URLs: /lang or /lang/page
  for (const lang of languages) {
    // Index: /lang or /lang/ → /[prefix]/lang/index.html
    if (url === `/${lang}` || url === `/${lang}/`) {
      return `${langPrefix}/${lang}/index.html`;
    }

    // Page: /lang/page → /[prefix]/lang/page.html
    const langPageMatch = url.match(new RegExp(`^/${lang}/([^/]+)$`));
    if (langPageMatch) {
      const pageName = langPageMatch[1];
      return `${langPrefix}/${lang}/${pageName}.html`;
    }
  }

  // Handle root-level static pages (not translated)
  const staticPages: Record<string, string> = {
    '/about': '/about.html',
    '/contact': '/contact.html',
    '/terms': '/terms.html',
    '/policy': '/policy.html',
    '/dmca': '/dmca.html',
    '/faq': '/faq.html',
    '/404': '/404.html',
    // Tool pages
    '/download-youtube-mp3': isDev ? `${eleventyPrefix}/download-youtube-mp3.html` : '/download-youtube-mp3.html',
    '/download-youtube-mp4': isDev ? `${eleventyPrefix}/download-youtube-mp4.html` : '/download-youtube-mp4.html',
    '/download-youtube-shorts': isDev ? `${eleventyPrefix}/download-youtube-shorts.html` : '/download-youtube-shorts.html'
  };

  if (staticPages[url]) {
    return staticPages[url];
  }

  // Handle Eleventy-generated pages (tool pages) - fallback
  const cleanPath = url.substring(1); // Remove leading slash
  if (eleventyPages.includes(cleanPath)) {
    return isDev ? `${eleventyPrefix}/${cleanPath}.html` : `/${cleanPath}.html`;
  }

  // Return original URL if no match
  return url;
}

/**
 * Vite plugin to handle clean URL routing for multi-page apps
 * Maps URLs like:
 * - /youtube-to-mp3-320kbps-converter → /_11ty-output/youtube-to-mp3-320kbps-converter.html (dev)
 * - /vi → /pages/vi/index.html (dev) or /vi/index.html (preview)
 * - /vi/youtube-to-wav-converter → /pages/vi/youtube-to-wav-converter.html (dev)
 */
export function htmlRewritePlugin(): Plugin {
  const pageDir = resolve(__dirname, 'src/page');

  return {
    name: 'vite-plugin-html-rewrite',
    transformIndexHtml(html) {
      html = injectFredokaFont(html);
      // Deduplicate identical <script> and <link> tags
      const seen = new Set<string>();
      html = html.replace(/ *<(script|link)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)\s*\n?/g, (match) => {
        const key = match.trim();
        if (seen.has(key)) return '';
        seen.add(key);
        return match;
      });
      return html;
    },
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
