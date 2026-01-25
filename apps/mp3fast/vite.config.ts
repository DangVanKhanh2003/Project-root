import { defineConfig } from 'vite';
import { resolve, join } from 'path';
import { readdirSync, existsSync, statSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';
import { sitemapPlugin } from './vite-plugin-sitemap';

const rootDir = resolve(__dirname);

// Auto-detect all HTML pages in root directory
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

// Auto-detect language pages in pages/ directory (pages/vi/index.html, pages/ar/index.html, etc.)
const langPagesDir = resolve(__dirname, 'pages');
const langPageEntries: Record<string, string> = {};

if (existsSync(langPagesDir)) {
  const langDirs = readdirSync(langPagesDir).filter(dir => {
    const dirPath = join(langPagesDir, dir);
    return statSync(dirPath).isDirectory() && existsSync(join(dirPath, 'index.html'));
  });

  langDirs.forEach(lang => {
    langPageEntries[`pages-${lang}`] = resolve(langPagesDir, lang, 'index.html');
  });
}

// Auto-detect static pages in subdirectories (faq/, contact/, etc.)
const staticPageDirs = ['faq', 'contact', 'copyright-claims', 'privacy-policy', 'terms-of-use'];
const staticPageEntries: Record<string, string> = {};

staticPageDirs.forEach(dir => {
  const indexPath = resolve(rootDir, dir, 'index.html');
  if (existsSync(indexPath)) {
    staticPageEntries[dir] = indexPath;
  }
});

export default defineConfig({
  plugins: [
    htmlRewritePlugin(),
    movePagesPlugin(),
    sitemapPlugin({ baseUrl: 'https://mp3fast.net' }),
    // SPA fallback for language routes - serve from pages/ directory
    {
      name: 'language-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';

          // Handle /search route - serve index.html
          if (url.startsWith('/search')) {
            console.log(`[SPA Fallback] ${url} → /index.html`);
            req.url = '/index.html';
            next();
            return;
          }

          // Match /vi, /ar, /es, etc. or /vi/, /ar/, /es/, etc.
          const langMatch = url.match(/^\/([a-z]{2})(\/|$)/);

          if (langMatch && !url.includes('.')) {
            const lang = langMatch[1];
            // Rewrite to pages/{lang}/index.html
            console.log(`[SPA Fallback] ${url} → /pages/${lang}/index.html`);
            req.url = `/pages/${lang}/index.html`;
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
        ...srcPageEntries,
        ...langPageEntries,
        ...staticPageEntries
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
      '@downloader/core': resolve(__dirname, '../../packages/core/src'),
      '@downloader/vidtool-popup': resolve(__dirname, '../../packages/vidtool-popup/src')
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
