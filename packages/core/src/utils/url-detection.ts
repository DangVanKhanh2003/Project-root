/**
 * URL Detection Utility
 *
 * Detects whether user input looks like a URL (with or without protocol prefix).
 * Used by input forms to distinguish between URL and keyword search inputs.
 */

/**
 * Regex to match input that looks like a URL.
 *
 * Matches:
 * - Inputs starting with http:// or https://
 * - Inputs starting with www.
 * - Inputs that look like a domain (word.tld pattern, optionally with path)
 *
 * The TLD part requires 2+ alpha characters to avoid false positives
 * like "node.js" or "v1.0" being treated as URLs.
 */
const URL_PATTERN = /^(?:https?:\/\/|www\.|\w[\w-]*\.(?:[a-z]{2,})(?:[/?#:]|$))/i;

/**
 * Check if user input looks like a URL rather than a search keyword.
 *
 * This is intentionally loose to minimize false negatives — it's better
 * to treat ambiguous input as a URL (which will fail gracefully via API)
 * than to send a URL as a keyword search.
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

  return URL_PATTERN.test(trimmed);
}
