import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';

// Auto-detect all HTML pages in src/page
const pageDir = resolve(__dirname, 'src/page');
const pageFiles = readdirSync(pageDir).filter(file => file.endsWith('.html'));

// Generate input entries for all pages
const pageEntries = pageFiles.reduce((entries, file) => {
  const name = file.replace('.html', '');
  entries[name] = resolve(pageDir, file);
  return entries;
}, {} as Record<string, string>);

export default defineConfig({
  plugins: [htmlRewritePlugin(), movePagesPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...pageEntries
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
