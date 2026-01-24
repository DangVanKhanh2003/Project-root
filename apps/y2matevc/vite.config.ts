import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';
import { sitemapPlugin } from './vite-plugin-sitemap';

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

// Auto-detect language pages from pages/ directory (pages/vi/, pages/ar/, etc.)
const pagesDir = resolve(__dirname, 'pages');
const languagePageEntries: Record<string, string> = {};

if (existsSync(pagesDir)) {
  const langDirs = readdirSync(pagesDir, { withFileTypes: true });
  langDirs.forEach(item => {
    if (item.isDirectory()) {
      const langDir = resolve(pagesDir, item.name);
      const langFiles = readdirSync(langDir).filter(file => file.endsWith('.html'));
      langFiles.forEach(file => {
        const pageName = file.replace('.html', '');
        const entryKey = `${item.name}-${pageName}`;
        languagePageEntries[entryKey] = resolve(langDir, file);
      });
    }
  });
}

export default defineConfig({
  plugins: [
    htmlRewritePlugin(),
    movePagesPlugin(),
    sitemapPlugin({
      baseUrl: 'https://y2mate.vc',
      changefreq: 'weekly',
      defaultPriority: 0.8,
      homePriority: 1.0
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...rootPageEntries,
        ...srcPageEntries,
        ...languagePageEntries
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
        }
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
