import type { Plugin } from 'vite';
import { readdirSync, copyFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Vite plugin to move built HTML pages from dist/src/page/ to dist/ for clean URLs
 */
export function movePagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-move-pages',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const pagesSourceDir = join(distDir, 'src', 'page');

      if (!existsSync(pagesSourceDir)) {
        return;
      }

      // Get all HTML files from dist/src/page/
      const htmlFiles = readdirSync(pagesSourceDir)
        .filter(file => file.endsWith('.html') && file !== 'index.html');

      // Move each HTML file to dist root
      htmlFiles.forEach(file => {
        const sourcePath = join(pagesSourceDir, file);
        const targetPath = join(distDir, file);

        try {
          copyFileSync(sourcePath, targetPath);
          unlinkSync(sourcePath);
          console.log(`Moved ${file} to dist root for clean URLs`);
        } catch (err) {
          console.error(`Failed to move ${file}:`, err);
        }
      });
    }
  };
}
