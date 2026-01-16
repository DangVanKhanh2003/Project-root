import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';
import { cssPreloadPlugin } from './vite-plugin-css-preload';

// Auto-detect all HTML pages from Eleventy output directory
const eleventyOutputDir = resolve(__dirname, '_11ty-output');
const eleventyHtmlFiles = existsSync(eleventyOutputDir)
  ? readdirSync(eleventyOutputDir).filter(file => file.endsWith('.html') && file !== 'index.html')
  : [];

// Generate input entries for Eleventy-generated pages
const eleventyPageEntries = eleventyHtmlFiles.reduce((entries, file) => {
  const name = file.replace('.html', '');
  entries[name] = resolve(eleventyOutputDir, file);
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

// 📄 Static pages in root directory (not translated)
const staticPages = ['about', 'terms-of-use', '404'];
const staticPageEntries = staticPages.reduce((entries, name) => {
  const filePath = resolve(__dirname, `${name}.html`);
  if (existsSync(filePath)) {
    entries[name] = filePath;
    console.log(`📄 Static page: ${name}.html`);
  }
  return entries;
}, {} as Record<string, string>);

// 🌍 Auto-detect language folders in pages/ directory
const pagesDir = resolve(__dirname, 'pages');
const languagePageEntries: Record<string, string> = {};

if (existsSync(pagesDir)) {
  const items = readdirSync(pagesDir, { withFileTypes: true });

  items.forEach(item => {
    if (item.isDirectory()) {
      const langDir = resolve(pagesDir, item.name);
      const langFiles = readdirSync(langDir).filter(file => file.endsWith('.html'));

      langFiles.forEach(file => {
        const pageName = file.replace('.html', '');
        // Key format: lang-pagename (e.g., vi-index, vi-youtube-to-mp3)
        const entryKey = `${item.name}-${pageName}`;
        languagePageEntries[entryKey] = resolve(langDir, file);
        console.log(`🌍 Auto-detected: pages/${item.name}/${file}`);
      });
    }
  });
}

// Determine main entry point
const mainEntry = existsSync(resolve(eleventyOutputDir, 'index.html'))
  ? resolve(eleventyOutputDir, 'index.html')
  : resolve(__dirname, 'index.html');

export default defineConfig({
  plugins: [
    htmlRewritePlugin(),
    movePagesPlugin(),
    cssPreloadPlugin() // Inject CSS preload links to eliminate render blocking
  ],
  build: {
    outDir: 'dist',
    // Enable CSS code splitting per entry point
    cssCodeSplit: true,
    // Optimize minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info']
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      input: {
        main: mainEntry,
        ...eleventyPageEntries,
        ...srcPageEntries,
        ...staticPageEntries,
        ...languagePageEntries
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunk splitting for better caching and parallel loading
        manualChunks(id) {
          // Vendor chunks - rarely change, better caching
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Downloader UI - lazy loaded, separate chunk
          if (id.includes('downloader-ui') || id.includes('features/downloader')) {
            return 'downloader-ui';
          }
          // I18n - large translations data
          if (id.includes('@downloader/i18n') || id.includes('i18n')) {
            return 'i18n';
          }
          // UI Components - reusable across pages
          if (id.includes('@downloader/ui-components') || id.includes('ui-components')) {
            return 'ui-components';
          }
        }
      }
    }
  },
  // CSS optimization
  css: {
    devSourcemap: false,
    preprocessorMaxWorkers: true
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
