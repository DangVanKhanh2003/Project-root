import type { Plugin } from 'vite';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Vite plugin to handle clean URL routing for multi-page apps
 * Maps URLs like /youtube-downloader to /src/page/youtube-downloader.html (dev)
 * or /youtube-downloader.html (preview/production)
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

        // Clean the URL (remove query params and trailing slash)
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');

        // Skip root path
        if (cleanUrl === '' || cleanUrl === '/') {
          return next();
        }

        // Try to find corresponding HTML file
        const pageName = cleanUrl.substring(1); // Remove leading slash
        const htmlPath = resolve(pageDir, `${pageName}.html`);

        if (existsSync(htmlPath)) {
          // Rewrite URL to point to the HTML file
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

        // Clean the URL (remove query params and trailing slash)
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');

        // Skip root path
        if (cleanUrl === '' || cleanUrl === '/') {
          return next();
        }

        // Try to find corresponding HTML file in dist
        const pageName = cleanUrl.substring(1);
        req.url = `/${pageName}.html`;

        next();
      });
    }
  };
}
