/**
 * URL Detection Utility
 *
 * Detects whether user input looks like a URL (with or without protocol prefix).
 * Used by input forms to distinguish between URL and keyword search inputs.
 *
 * Adapted from ytmp3.gg's isLikelyUrl() with multiple-pass approach for accuracy.
 */

/** Fast path: explicit http(s) scheme */
const SCHEME_PATTERN = /^(https?):\/\//i;
const FULL_URL_PATTERN = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

/** Scheme-less domain with path/query/fragment (e.g. youtube.com/watch?v=xxx) */
const SCHEMELESS_DOMAIN_PATH = /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:\/|\?|#)[^\s]*$/i;

/** Special-case YouTube hosts (with or without path) */
const YT_HOST_ONLY = /^(?:[a-z0-9-]+\.)*(?:youtube\.com|youtube-nocookie\.com|youtu\.be)$/i;
const YT_HOST_WITH_PATH = /^(?:www\.)?(?:youtu\.be|youtube(?:-nocookie)?\.com)(?:\/|$)/i;

/**
 * Check if user input looks like a URL rather than a search keyword.
 *
 * Uses a multi-pass approach (matching ytmp3.gg's isLikelyUrl):
 * 1. Explicit scheme (http:// or https://) — validate full URL format
 * 2. Scheme-less domain with path/query/fragment (domain.tld/path)
 * 3. Special-case YouTube hosts (even without trailing path)
 *
 * @param input - Raw user input string
 * @returns true if input looks like a URL
 *
 * @example
 * looksLikeUrl('https://youtube.com/watch?v=xxx') // true
 * looksLikeUrl('youtube.com/watch?v=xxx')          // true
 * looksLikeUrl('www.youtube.com/watch?v=xxx')      // true
 * looksLikeUrl('youtu.be/xxx')                     // true
 * looksLikeUrl('tiktok.com/@user/video/123')       // true
 * looksLikeUrl('funny cat video')                  // false
 * looksLikeUrl('hello world')                      // false
 */
export function looksLikeUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (!trimmed) return false;

  // 1) Fast path: explicit scheme
  if (SCHEME_PATTERN.test(trimmed)) {
    return FULL_URL_PATTERN.test(trimmed);
  }

  // 2) Scheme-less domain with path (e.g. tiktok.com/@user/video/123)
  if (SCHEMELESS_DOMAIN_PATH.test(trimmed)) {
    return true;
  }

  // 3) Special-case YouTube hosts (even bare domain like youtu.be)
  if (YT_HOST_ONLY.test(trimmed) || YT_HOST_WITH_PATH.test(trimmed)) {
    return true;
  }

  return false;
}
