/**
 * Vite Plugin: Critical CSS Inline with Critters
 *
 * Automatically extracts and inlines critical CSS for above-the-fold content
 * using Critters library. Runs post-build on generated HTML files.
 *
 * Benefits over Puppeteer approach:
 * - No preview server needed (processes static HTML)
 * - Simpler and more reliable
 * - Perfect for CI/CD environments
 * - Faster build times
 *
 * Configuration:
 * - path: dist/ directory where HTML files are located
 * - preload: 'swap' for non-critical CSS (prevents flash of unstyled content)
 * - inlineFonts: true to inline critical font declarations
 * - compress: true to minify inlined CSS
 * - pruneSource: true to remove inlined CSS from external stylesheets
 */

import Critters from 'critters';
import { resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

export default function criticalCss() {
  return {
    name: 'vite-plugin-critical-css',

    // Run after all assets are written to disk
    async closeBundle() {
      console.log('\n🎨 Extracting critical CSS with Critters...');

      const distPath = resolve(process.cwd(), 'dist');

      const critters = new Critters({
        path: distPath,
        publicPath: '/',
        preload: 'media',  // Generates proper preload links with media attribute
        inlineFonts: true,
        compress: true,
        pruneSource: false,  // Keep original CSS intact (browser handles dedup)
        logLevel: 'info',
        // Additional config to ensure non-blocking CSS
        reduceInlineStyles: false,  // Don't reduce inline styles
        mergeStylesheets: false,    // Keep stylesheets separate
      });

      try {
        // Find all HTML files in dist/
        const htmlFiles = readdirSync(distPath)
          .filter(file => file.endsWith('.html'))
          .map(file => join(distPath, file));

        console.log(`📄 Found ${htmlFiles.length} HTML files to process`);

        // Process each HTML file
        for (const htmlFile of htmlFiles) {
          const fileName = htmlFile.split('/').pop();
          console.log(`   Processing: ${fileName}`);

          const html = readFileSync(htmlFile, 'utf-8');
          const processedHtml = await critters.process(html);
          writeFileSync(htmlFile, processedHtml, 'utf-8');

          console.log(`   ✅ ${fileName} - Critical CSS inlined`);
        }

        console.log('✅ All HTML files processed successfully!\n');
      } catch (error) {
        console.error('❌ Failed to extract critical CSS:', error.message);
        console.error(error.stack);
        // Don't throw - allow build to continue
      }
    }
  };
}
