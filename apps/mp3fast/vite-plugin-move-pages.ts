import type { Plugin } from 'vite';
import { readdirSync, copyFileSync, unlinkSync, existsSync, mkdirSync, rmSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Vite plugin to move built HTML pages to correct locations for clean URLs
 * - dist/src/page/*.html -> dist/*.html
 * - dist/pages/{lang}/index.html -> dist/{lang}/index.html
 */
export function movePagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-move-pages',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // 1. Move src/page HTML files to dist root
      const srcPagesDir = join(distDir, 'src', 'page');
      if (existsSync(srcPagesDir)) {
        const htmlFiles = readdirSync(srcPagesDir)
          .filter(file => file.endsWith('.html') && file !== 'index.html');

        htmlFiles.forEach(file => {
          const sourcePath = join(srcPagesDir, file);
          const targetPath = join(distDir, file);

          try {
            copyFileSync(sourcePath, targetPath);
            unlinkSync(sourcePath);
            console.log(`[move-pages] Moved ${file} to dist root`);
          } catch (err) {
            console.error(`[move-pages] Failed to move ${file}:`, err);
          }
        });
      }

      // 2. Move language pages from dist/pages/{lang}/ to dist/{lang}/
      const langPagesDir = join(distDir, 'pages');
      if (existsSync(langPagesDir)) {
        const langDirs = readdirSync(langPagesDir).filter(dir => {
          const dirPath = join(langPagesDir, dir);
          return statSync(dirPath).isDirectory();
        });

        langDirs.forEach(lang => {
          const sourceLangDir = join(langPagesDir, lang);
          const targetLangDir = join(distDir, lang);

          // Create target directory
          if (!existsSync(targetLangDir)) {
            mkdirSync(targetLangDir, { recursive: true });
          }

          // Copy all files from source to target
          const files = readdirSync(sourceLangDir);
          files.forEach(file => {
            const sourcePath = join(sourceLangDir, file);
            const targetPath = join(targetLangDir, file);

            try {
              if (statSync(sourcePath).isFile()) {
                copyFileSync(sourcePath, targetPath);
              }
            } catch (err) {
              console.error(`[move-pages] Failed to copy ${sourcePath}:`, err);
            }
          });

          console.log(`[move-pages] Moved pages/${lang}/ -> ${lang}/`);
        });

        // Remove empty dist/pages directory
        try {
          rmSync(langPagesDir, { recursive: true });
          console.log(`[move-pages] Removed dist/pages/ directory`);
        } catch (err) {
          console.error(`[move-pages] Failed to remove dist/pages/:`, err);
        }
      }
    }
  };
}
