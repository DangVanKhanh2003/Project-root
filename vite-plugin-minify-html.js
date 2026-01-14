/**
 * Vite Plugin: Minify HTML
 * Minifies HTML output for production builds
 */
export default function minifyHTML() {
  return {
    name: 'vite-plugin-minify-html',
    enforce: 'post',
    apply: 'build',

    transformIndexHtml(html) {
      // Minify HTML by removing extra whitespace and comments
      return html
        // Remove HTML comments (but keep IE conditionals)
        .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
        // Collapse multiple whitespace to single space
        .replace(/\s{2,}/g, ' ')
        // Remove whitespace between tags
        .replace(/>\s+</g, '><')
        // Trim leading/trailing whitespace
        .trim()
    }
  }
}
