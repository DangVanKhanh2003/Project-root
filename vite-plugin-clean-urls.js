import path from 'path'
import fs from 'fs'

/**
 * Vite plugin để hỗ trợ clean URLs trong development server
 *
 * Plugin này tự động rewrite extensionless URLs thành .html files
 * dựa trên rollupOptions.input configuration trong vite.config.js
 */
export default function cleanUrlsPlugin() {
  return {
    name: 'clean-urls',
    apply: 'serve', // Chỉ apply cho development server
    configureServer(server) {
      return () => {
        server.middlewares.use((req, _res, next) => {
          try {
            const originalUrl = req.originalUrl || req.url
            const urlPath = originalUrl.split('?')[0] // Remove query parameters

            // Skip processing cho:
            // - Root path (/)
            // - URLs với extension (CSS, JS, images, etc.)
            // - API routes (bắt đầu với /api)
            // - Static assets
            if (urlPath === '/' ||
                path.extname(urlPath) !== '' ||
                urlPath.startsWith('/api') ||
                urlPath.startsWith('/assets') ||
                urlPath.startsWith('/node_modules') ||
                urlPath.startsWith('/@') || // Vite internals
                urlPath.includes('.')) {
              return next()
            }

            // Lấy input entries từ Vite config
            const inputEntries = server.config.build?.rollupOptions?.input || {}

            // Tạo mapping từ clean URLs → HTML files
            const urlMapping = createUrlMapping(inputEntries)

            // Kiểm tra nếu URL match với mapping
            const cleanPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath

            if (urlMapping.has(cleanPath)) {
              const htmlFile = urlMapping.get(cleanPath)

              // Verify file tồn tại
              if (fs.existsSync(htmlFile)) {
                req.url = `/${path.basename(htmlFile)}`
                console.log(`[Clean URLs] ${originalUrl} → ${req.url}`)
              }
            }

            next()
          } catch (error) {
            console.error('[Clean URLs Plugin Error]:', error)
            next()
          }
        })
      }
    }
  }
}

/**
 * Tạo mapping từ rollupOptions.input entries
 * @param {Object} inputEntries - Vite input configuration
 * @returns {Map} Map từ clean URL → HTML file path
 */
function createUrlMapping(inputEntries) {
  const mapping = new Map()

  for (const [key, filePath] of Object.entries(inputEntries)) {
    // Skip main entry (index.html)
    if (key === 'main') continue

    const fileName = path.basename(filePath, '.html')

    // Map clean URL → HTML file
    // Ví dụ: 'youtube' entry → 'youtube-downloader' clean URL
    mapping.set(fileName, filePath)

    // Cũng map key name nếu khác với file name
    if (key !== fileName) {
      mapping.set(key, filePath)
    }
  }

  return mapping
}