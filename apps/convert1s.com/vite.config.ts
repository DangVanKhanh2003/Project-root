import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';
import { sitemapPlugin } from './vite-plugin-sitemap';
import htmlMinifier from 'vite-plugin-html-minifier';

// Auto-detect all HTML pages from Eleventy output directory
const excludedPageNames = new Set([]);

const eleventyOutputDir = resolve(__dirname, '_11ty-output');
const eleventyHtmlFiles = existsSync(eleventyOutputDir)
  ? readdirSync(eleventyOutputDir).filter(file => file.endsWith('.html') && file !== 'index.html' && !excludedPageNames.has(file.replace('.html', '')))
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
  ? readdirSync(pageDir).filter(file => file.endsWith('.html') && !excludedPageNames.has(file.replace('.html', '')))
  : [];

// Generate input entries for src/page pages
const srcPageEntries = pageFiles.reduce((entries, file) => {
  const name = file.replace('.html', '');
  entries[name] = resolve(pageDir, file);
  return entries;
}, {} as Record<string, string>);

// ðŸ“„ Static pages in root directory (not translated)
const staticPages = ['404', 'license', 'reset-key'];
const staticPageEntries = staticPages.reduce((entries, name) => {
  const filePath = resolve(__dirname, `${name}.html`);
  if (existsSync(filePath)) {
    entries[name] = filePath;
    console.log(`ðŸ“„ Static page: ${name}.html`);
  }
  return entries;
}, {} as Record<string, string>);

// ðŸŒ Auto-detect language folders in pages/ directory
const pagesDir = resolve(__dirname, 'pages');
const languagePageEntries: Record<string, string> = {};

if (existsSync(pagesDir)) {
  const items = readdirSync(pagesDir, { withFileTypes: true });

  items.forEach(item => {
    if (item.isDirectory()) {
      const langDir = resolve(pagesDir, item.name);
      const langFiles = readdirSync(langDir).filter(file => file.endsWith('.html') && !excludedPageNames.has(file.replace('.html', '')));

      langFiles.forEach(file => {
        const pageName = file.replace('.html', '');
        // Key format: lang-pagename (e.g., vi-index, vi-youtube-to-mp3)
        const entryKey = `${item.name}-${pageName}`;
        languagePageEntries[entryKey] = resolve(langDir, file);
        console.log(`ðŸŒ Auto-detected: pages/${item.name}/${file}`);
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
    sitemapPlugin(),
    // Deduplicate external <script> tags (e.g. poppurchase CDN) in built HTML
    {
      name: 'dedup-external-scripts',
      enforce: 'post' as const,
      transformIndexHtml(html: string) {
        const seen = new Set<string>();
        return html.replace(/<script[^>]*\bsrc="(https?:\/\/[^"]+)"[^>]*><\/script>/g, (match, src) => {
          if (seen.has(src)) return '';
          seen.add(src);
          return match;
        });
      }
    },
    htmlMinifier({
      minify: {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        keepClosingSlash: true,
        removeRedundantAttributes: false,
        removeEmptyAttributes: false,
        removeOptionalTags: false,
        minifyJS: true
      }
    }),
  ],
  build: {
    outDir: 'dist',
    minify: 'terser', // Enable minification
    terserOptions: {
      compress: {
        drop_console: true,     // Remove console.log
        drop_debugger: true,    // Remove debugger
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      format: {
        comments: false         // Remove comments
      }
    },
    rollupOptions: {
      external: (id: string) => /^https?:\/\//.test(id),
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
        // Force paywall-popup into its own chunk so poppurchase CDN URL
        // only appears in one place (avoids duplicate <script> tags in HTML)
        manualChunks(id) {
          if (id.includes('paywall-popup')) {
            return 'paywall-popup';
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

