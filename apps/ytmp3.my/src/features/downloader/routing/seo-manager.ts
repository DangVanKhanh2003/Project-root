/**
 * SEO Manager - Meta Tags Management
 *
 * Handles SEO meta tags updates for different routes
 */

/**
 * Update SEO meta tags for video result page
 * Prevents Google from indexing result pages
 */
export function setVideoPageSEO(): void {
  // Update robots meta tag
  let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;

  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }

  robotsMeta.content = 'noindex, nofollow';

  // Update canonical link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }

  canonicalLink.href = window.location.origin + '/';
}

/**
 * Update SEO meta tags for home page
 * Allows Google to index home page
 */
export function setHomePageSEO(): void {
  // Update robots meta tag
  let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;

  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }

  robotsMeta.content = 'index, follow';

  // Update canonical link to home
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }

  canonicalLink.href = window.location.origin + '/';
}
