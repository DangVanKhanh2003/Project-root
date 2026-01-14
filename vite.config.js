import { defineConfig } from 'vite'
import { resolve } from 'path'
import criticalCss from './vite-plugin-critical.js'
import purgeCss from 'vite-plugin-purgecss'
import minifyHTML from './vite-plugin-minify-html.js'
import cleanUrls from './vite-plugin-clean-urls.js'

export default defineConfig({
  plugins: [
    cleanUrls(), // Clean URLs plugin for development server
    minifyHTML(),
    criticalCss(),
    purgeCss({
      content: [
        './index.html',
        './youtube-downloader.html',
        './tiktok-downloader.html',
        './instagram-downloader.html',
        './facebook-downloader.html',
        './x-downloader.html',
        './youtube-to-mp3.html',
        './youtube-to-mp4.html',
        './youtube-short-downloader.html',
        './src/**/*.{js,ts,jsx,tsx,html}'
      ],
      safelist: [
        // Navigation patterns
        /^nav/, /^navbar/, /^platform/, /^drawer/,

        // Button patterns
        /^btn/, /^button/,

        // Modal and overlay patterns
        /^modal/, /^conversion/, /^mobile/, /^progress/, /^overlay/,

        // Component patterns
        /^faq/, /^gallery/, /^search/, /^download/, /^suggestion/, /^result/,
        /^video/, /^quality/, /^format/, /^content/, /^hero/,

        // State classes (exact matches)
        'active', 'open', 'loading', 'error', 'expanded', 'visible', 'scrolled',
        'showing-data', 'showing-loading', 'showing-message',

        // Utility patterns
        /^grid/, /^text/, /^section/, /^card/, /^rounded/, /^surface/,
        /^fade/, /^slide/, /^scale/, /^see-more/, /^expandable/,

        // Form and input patterns
        /^input/, /^form/, /^placeholder/,

        // Animation and interaction states
        /--hover/, /--focus/, /--active/, /--visible/, /--hidden/,

        // Skeleton loading patterns
        /^skeleton/,

        // Brand and theming
        /^md-sys/, /^intro/
      ]
    })
  ],
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    assetsInlineLimit: 0, // Disable base64 inline - build all images as files
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,     // Remove console.log
        drop_debugger: true,    // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      format: {
        comments: false         // Remove all comments
      }
    },
    rollupOptions: {
      // Build as a multi-page app: include all HTML entries at project root
      input: {
        main: resolve(__dirname, 'index.html'),
        youtube: resolve(__dirname, 'youtube-downloader.html'),
        tiktok: resolve(__dirname, 'tiktok-downloader.html'),
        instagram: resolve(__dirname, 'instagram-downloader.html'),
        facebook: resolve(__dirname, 'facebook-downloader.html'),
        x: resolve(__dirname, 'x-downloader.html'),
        yt2mp3: resolve(__dirname, 'youtube-to-mp3.html'),
        yt2mp4: resolve(__dirname, 'youtube-to-mp4.html'),
        ytshorts: resolve(__dirname, 'youtube-short-downloader.html'),
      },
      output: {
        // CSS and other bundled assets go to assets/ with hash
        // Images are handled by vite-plugin-static-copy (preserves structure)
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name;

          if (info.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }

          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
})
