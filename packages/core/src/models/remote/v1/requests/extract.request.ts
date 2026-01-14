/**
 * API v1 Extract Request Models
 */

/**
 * Extract media (encrypted URLs)
 * POST /api/v1/extract
 */
export interface ExtractRequest {
  url: string;
  from?: string; // Optional source identifier
}

/**
 * Extract media (direct URLs) - POST variant
 * POST /api/v1/extract-non-encode
 */
export interface ExtractNonEncodePostRequest {
  url: string;
  from?: string; // Optional source identifier
}

/**
 * Extract media (direct URLs) - GET variant
 * GET /api/v1/extract-non-encode
 */
export interface ExtractNonEncodeGetRequest {
  url: string;
  from?: string; // Optional source identifier
}
