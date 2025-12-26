import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';

// Auto-detect all HTML pages in root directory
const rootDir = resolve(__dirname);
const rootHtmlFiles = readdirSync(rootDir).filter(file => file.endsWith('.html') && file !== 'index.html');

// Generate input entries for root HTML pages
const rootPageEntries = rootHtmlFiles.reduce((entries, file) => {
  const name = file.replace('.html', '');
  entries[name] = resolve(rootDir, file);
  return entries;
}, {} as Record<string, string>);

// Auto-detect all HTML pages in src/page (if directory exists)
const pageDir = resolve(__dirname, 'src/page');
const pageFiles = existsSync(pageDir)
  ? readdirSync(pageDir).filter(file => file.endsWith('.html'))
  : [];

// Generate input entries for src/page pages
const srcPageEntries = pageFiles.reduce((entries, file) => {
  const name = file.replace('.html', '');
  entries[name] = resolve(pageDir, file);
  return entries;
}, {} as Record<string, string>);

export default defineConfig({
  plugins: [
    htmlRewritePlugin(),
    movePagesPlugin(),
    // SPA fallback for language routes
    {
      name: 'language-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';

          // Match /vi/*, /ar/*, /es/*, etc. (but not static files)
          const langMatch = url.match(/^\/([a-z]{2})\/(.*)/);

          if (langMatch && !url.includes('.')) {
            const lang = langMatch[1];
            console.log(`[SPA Fallback] ${url} → /${lang}/index.html`);
            req.url = `/${lang}/index.html`;
          }

          next();
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...rootPageEntries,
        ...srcPageEntries
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@downloader/core': resolve(__dirname, '../../packages/core/src')
    }
  },
  server: {
    open: '/',
    fs: {
      strict: false
    }
  },
  preview: {
    open: '/'
  }
});
