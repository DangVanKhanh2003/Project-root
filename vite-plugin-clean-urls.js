/**
 * Vite Plugin: Clean URLs
 * Enables clean URLs by removing .html extension in development
 */
export default function cleanUrls() {
  return {
    name: 'vite-plugin-clean-urls',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url

        // Skip if already has extension or is an asset
        if (url.includes('.') || url.startsWith('/@') || url.startsWith('/node_modules')) {
          return next()
        }

        // Skip root
        if (url === '/') {
          return next()
        }

        // Remove trailing slash and add .html
        const cleanUrl = url.replace(/\/$/, '')
        if (cleanUrl && !cleanUrl.includes('.')) {
          req.url = `${cleanUrl}.html`
        }

        next()
      })
    }
  }
}
