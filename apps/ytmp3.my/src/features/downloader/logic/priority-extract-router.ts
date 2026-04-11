/**
 * Priority Extract Router
 * Routes download requests between External Extract API and V3 flow based on country.
 *
 * EXTERNAL_API countries (IN, ID): External Extract API first -> V3 fallback
 * Other countries:                 V3 flow first -> External Extract API fallback
 *
 * External Extract API retries up to 2 times on failure (total 3 attempts).
 * UI stays silent during fallback.
 */

import { mapToExternalExtractRequest, mapExternalExtractResponse, type ExtractV2Options, type NormalizedExternalExtractResult } from '@downloader/core';
import { apiExternalExtract } from '../../../api/external-extract';
import { STORAGE_KEYS } from '../../../utils/storage-keys';

// ── Policy Config ──────────────────────────────────────────

/** Countries that use External Extract API as primary */
const EXTERNAL_API_COUNTRIES = ['IN', 'ID'];

/** Max retry attempts for External Extract API (2 retries = total 3 attempts) */
const EXTERNAL_EXTRACT_MAX_RETRIES = 2;

function isExternalApiCountry(countryCode: string): boolean {
  if (!countryCode) return false;
  return EXTERNAL_API_COUNTRIES.includes(countryCode.toUpperCase());
}

// ── Country Cache (reuse allowed-features localStorage) ────

interface StoredAllowedState {
  country: string;
  allowedFeatures: string[];
  timestamp: number;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Read country from allowed-features localStorage cache.
 * Returns null if cache is missing or expired.
 * Does NOT trigger API call — that's handled by initAllowedFeatures() on page load.
 */
function getCachedCountry(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALLOWED_FEATURES);
    if (!raw) return null;
    const parsed: StoredAllowedState = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return typeof parsed.country === 'string' ? parsed.country : null;
  } catch {
    return null;
  }
}

// ── Extract Strategy Resolver ──────────────────────────────

export const EXTRACT_STRATEGY = {
  EXTERNAL_FIRST: 'external-first',
  V3_FIRST: 'v3-first',
} as const;

export type ExtractStrategy = typeof EXTRACT_STRATEGY[keyof typeof EXTRACT_STRATEGY];

/**
 * Determine which extract strategy to use.
 * Pure function — no UI side effects.
 *
 * Rules (ytmp3.my has no license key system):
 * 1. Format not mp3/mp4 -> v3-first (external API only supports mp3/mp4)
 * 2. Country IN/ID -> external-first
 * 3. No cached country -> v3-first (cache will warm for next time via initAllowedFeatures)
 * 4. Default -> v3-first
 */
export function resolveExtractStrategy(options: ExtractV2Options): ExtractStrategy {
  // External API only supports mp3/mp4
  const outputFormat = options.downloadMode === 'video'
    ? (options.youtubeVideoContainer || 'mp4')
    : (options.audioFormat || 'mp3');

  if (outputFormat !== 'mp3' && outputFormat !== 'mp4') return EXTRACT_STRATEGY.V3_FIRST;

  // Country-based routing (sync — read from cache only)
  const cachedCountry = getCachedCountry();

  if (cachedCountry === null) {
    return EXTRACT_STRATEGY.V3_FIRST;
  }

  return isExternalApiCountry(cachedCountry) ? EXTRACT_STRATEGY.EXTERNAL_FIRST : EXTRACT_STRATEGY.V3_FIRST;
}

// ── External Extract Caller (shared) ──────────────────────

export interface ExternalExtractResult {
  ok: boolean;
  data?: NormalizedExternalExtractResult;
  error?: unknown;
}

/**
 * Call External Extract API with retry logic.
 *
 * @param url - YouTube URL
 * @param options - Quality options (downloadMode, videoQuality, etc.)
 * @param signal - Optional abort signal
 * @returns { ok, data?, error? }
 */
export async function callExternalExtract(
  url: string,
  options: ExtractV2Options,
  signal?: AbortSignal
): Promise<ExternalExtractResult> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= EXTERNAL_EXTRACT_MAX_RETRIES; attempt++) {
    if (signal?.aborted) {
      return { ok: false, error: new DOMException('Aborted', 'AbortError') };
    }

    try {
      const request = mapToExternalExtractRequest(url, options);
      const response = await apiExternalExtract.extract(request, signal);
      const normalized = mapExternalExtractResponse(response, url, options);

      if (normalized) {
        return { ok: true, data: normalized };
      }

      lastError = response;
    } catch (error) {
      lastError = error;
    }
  }

  return { ok: false, error: lastError };
}
