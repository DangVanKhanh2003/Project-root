import type { Plugin } from 'vite';
import { readdirSync, copyFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Vite plugin to organize built HTML files for clean URLs:
 * - dist/_11ty-output/*.html → dist/*.html
 * - dist/_11ty-output/{lang}/*.html → dist/{lang}/*.html
 * - dist/pages/{lang}/*.html → dist/{lang}/*.html
 */
export function movePagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-move-pages',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // 1. Move files from dist/_11ty-output/ to dist/ root
      const eleventyDir = join(distDir, '_11ty-output');
      if (existsSync(eleventyDir)) {
        const items = readdirSync(eleventyDir, { withFileTypes: true });

        items.forEach(item => {
          const sourcePath = join(eleventyDir, item.name);

          if (item.isFile() && item.name.endsWith('.html')) {
            // Root level HTML files (English pages)
            const targetPath = join(distDir, item.name);

            try {
              copyFileSync(sourcePath, targetPath);
              unlinkSync(sourcePath);
              console.log(`✅ Moved ${item.name} to dist root`);
            } catch (err) {
              console.error(`❌ Failed to move ${item.name}:`, err);
            }
          } else if (item.isDirectory()) {
            // Language folder - move entire directory to dist root
            const targetPath = join(distDir, item.name);

            try {
              // Create target directory if not exists
              if (!existsSync(targetPath)) {
                mkdirSync(targetPath, { recursive: true });
              }

              // Move all files in language folder
              const langFiles = readdirSync(sourcePath);
              langFiles.forEach(file => {
                const fileSource = join(sourcePath, file);
                const fileTarget = join(targetPath, file);
                copyFileSync(fileSource, fileTarget);
                unlinkSync(fileSource);
              });

              console.log(`✅ Moved language folder ${item.name}/ to dist root`);
            } catch (err) {
              console.error(`❌ Failed to move ${item.name}/:`, err);
            }
          }
        });

        // Clean up empty _11ty-output directory
        cleanEmptyDirs(eleventyDir);
      }

      // 2. Move language folders from dist/pages/{lang}/ to dist/{lang}/
      const pagesDir = join(distDir, 'pages');
      if (existsSync(pagesDir)) {
        const items = readdirSync(pagesDir, { withFileTypes: true });

        items.forEach(item => {
          if (item.isDirectory()) {
            const sourcePath = join(pagesDir, item.name);
            const targetPath = join(distDir, item.name);

            try {
              // Create target directory if not exists
              if (!existsSync(targetPath)) {
                mkdirSync(targetPath, { recursive: true });
              }

              // Move all files in language folder
              const langFiles = readdirSync(sourcePath);
              langFiles.forEach(file => {
                const fileSource = join(sourcePath, file);
                const fileTarget = join(targetPath, file);
                copyFileSync(fileSource, fileTarget);
                unlinkSync(fileSource);
              });

              console.log(`✅ Moved language folder pages/${item.name}/ to dist/${item.name}/`);
            } catch (err) {
              console.error(`❌ Failed to move pages/${item.name}/:`, err);
            }
          }
        });

        // Clean up empty pages directory
        cleanEmptyDirs(pagesDir);
      }

      console.log('✅ All HTML files organized successfully!\n');
    }
  };
}

/**
 * Recursively clean up empty directories
 */
function cleanEmptyDirs(dir: string): void {
  if (!existsSync(dir)) return;

  const items = readdirSync(dir);

  // First, recursively clean subdirectories
  items.forEach(item => {
    const itemPath = join(dir, item);
    if (statSync(itemPath).isDirectory()) {
      cleanEmptyDirs(itemPath);
    }
  });

  // Then, check if directory is now empty and remove it
  const remainingItems = readdirSync(dir);
  if (remainingItems.length === 0) {
    try {
      rmdirSync(dir);
      console.log(`🗑️  Removed empty directory: ${dir.split('dist')[1] || dir}`);
    } catch (err) {
      // Ignore errors when removing directories
    }
  }
}
