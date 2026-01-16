/**
 * Vite Plugin: CSS Preload Injector
 * Automatically injects <link rel="preload"> for CSS files to enable parallel loading
 * This eliminates the CSS-depends-on-JS waterfall issue
 */
import type { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export function cssPreloadPlugin(): Plugin {
  return {
    name: 'vite-plugin-css-preload',
    enforce: 'post',

    generateBundle(_, bundle) {
      // Find all HTML files in the bundle
      const htmlFiles = Object.keys(bundle).filter(file => file.endsWith('.html'));

      htmlFiles.forEach(htmlFileName => {
        const htmlChunk = bundle[htmlFileName];

        if (htmlChunk.type === 'asset' && typeof htmlChunk.source === 'string') {
          let html = htmlChunk.source;

          // Find all CSS files referenced in this HTML
          const cssFiles: string[] = [];
          const cssRegex = /<link[^>]+href="([^"]+\.css)"[^>]*>/g;
          let match;

          while ((match = cssRegex.exec(html)) !== null) {
            cssFiles.push(match[1]);
          }

          if (cssFiles.length > 0) {
            // Generate preload links
            const preloadLinks = cssFiles
              .map(cssFile => {
                return `<link rel="preload" href="${cssFile}" as="style">`;
              })
              .join('\n  ');

            // Find the first stylesheet link and inject preload links BEFORE it
            const firstStylesheetRegex = /(<link[^>]+rel="stylesheet"[^>]*>)/;
            if (firstStylesheetRegex.test(html)) {
              html = html.replace(firstStylesheetRegex, `${preloadLinks}\n  $1`);
            } else {
              // Fallback: inject before </head> if no stylesheet found
              html = html.replace('</head>', `${preloadLinks}\n</head>`);
            }

            // Update the bundle
            htmlChunk.source = html;

            console.log(`✅ Injected ${cssFiles.length} CSS preload links into ${htmlFileName}`);
          }
        }
      });
    }
  };
}
