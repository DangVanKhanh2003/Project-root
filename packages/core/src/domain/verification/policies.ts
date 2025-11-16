/**
 * Default Verification Policies
 * Ported from verifier.js
 */

import type { VerificationPolicy, VerifiedResult, VerificationCode } from './types';
import { VERIFICATION_MESSAGES } from './messages';

/**
 * Helper to make result
 */
function makeResult<T>(
  status: 'success' | 'warning' | 'error',
  code: VerificationCode,
  message: string,
  data: T | null = null,
  raw?: any
): VerifiedResult<T> {
  return {
    ok: status === 'success',
    status,
    code,
    message,
    data,
    raw,
  };
}

/**
 * Search Title Policy
 * Validates search results
 */
export const searchTitlePolicy: VerificationPolicy = (payload: any) => {
  if (!payload || !Array.isArray(payload.videos)) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  if (payload.videos.length === 0) {
    return makeResult('warning', 'EMPTY_RESULTS', VERIFICATION_MESSAGES.EMPTY_RESULTS, payload, { payload });
  }

  return makeResult('success', 'OK', VERIFICATION_MESSAGES.SEARCH_SUCCESS, payload);
};

/**
 * Search V2 Policy
 * Validates search v2 results
 */
export const searchV2Policy: VerificationPolicy = (payload: any) => {
  if (!payload || (!Array.isArray(payload.items) && !Array.isArray(payload.videos))) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  const items = payload.items || payload.videos || [];
  if (items.length === 0) {
    return makeResult('warning', 'EMPTY_RESULTS', VERIFICATION_MESSAGES.EMPTY_RESULTS, payload, { payload });
  }

  return makeResult('success', 'OK', VERIFICATION_MESSAGES.SEARCH_SUCCESS, payload);
};

/**
 * Suggestions Policy
 * Validates search suggestions
 */
export const suggestionsPolicy: VerificationPolicy = (payload: any) => {
  if (!Array.isArray(payload)) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  if (payload.length === 0) {
    return makeResult('warning', 'EMPTY_RESULTS', VERIFICATION_MESSAGES.NO_SUGGESTIONS, payload, { payload });
  }

  return makeResult('success', 'OK', VERIFICATION_MESSAGES.OK, payload);
};

/**
 * Extract Media Policy
 * Validates media extraction response
 */
export const extractMediaPolicy: VerificationPolicy = (payload: any) => {
  if (!payload || !payload.title) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  // Check if has formats (YouTube) or direct URL (other platforms)
  const hasFormats = payload.formats && Array.isArray(payload.formats) && payload.formats.length > 0;
  const hasUrl = typeof payload.url === 'string' && payload.url.length > 0;

  if (!hasFormats && !hasUrl) {
    return makeResult('error', 'ERROR', 'No download options available', null, { payload });
  }

  return makeResult('success', 'OK', VERIFICATION_MESSAGES.EXTRACT_SUCCESS, payload);
};

/**
 * Playlist Policy
 * Validates playlist extraction
 */
export const playlistPolicy: VerificationPolicy = (payload: any) => {
  if (!payload || !Array.isArray(payload.videos)) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  if (payload.videos.length === 0) {
    return makeResult('warning', 'EMPTY_RESULTS', 'Playlist is empty', payload, { payload });
  }

  return makeResult('success', 'OK', 'Playlist extracted successfully', payload);
};

/**
 * Conversion Policy
 * Validates conversion task response
 */
export const conversionPolicy: VerificationPolicy = (payload: any) => {
  if (!payload || !payload.taskId) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  // Check task status
  if (payload.status === 'failed' || payload.status === 'error') {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.CONVERSION_FAILED, payload, { payload });
  }

  if (payload.status === 'processing') {
    return makeResult('warning', 'TASK_NOT_READY', VERIFICATION_MESSAGES.TASK_NOT_READY, payload, { payload });
  }

  if (payload.status === 'completed' && payload.downloadUrl) {
    return makeResult('success', 'OK', VERIFICATION_MESSAGES.CONVERSION_SUCCESS, payload);
  }

  return makeResult('success', 'OK', VERIFICATION_MESSAGES.OK, payload);
};

/**
 * Decrypt Policy
 * Validates decrypt response
 */
export const decryptPolicy: VerificationPolicy = (payload: any) => {
  if (!payload) {
    return makeResult('error', 'ERROR', VERIFICATION_MESSAGES.NETWORK_OR_API, null, { payload });
  }

  if (!payload.success || !payload.url) {
    const errorMsg = payload.error || payload.reason || 'Decryption failed';
    return makeResult('error', 'ERROR', errorMsg, null, { payload });
  }

  return makeResult('success', 'OK', 'URL decrypted successfully', payload);
};

/**
 * Default Policies Map
 * Maps policy names to policy functions
 */
export const DEFAULT_POLICIES: Record<string, VerificationPolicy> = {
  // Search
  searchTitle: searchTitlePolicy,
  searchV2: searchV2Policy,
  suggestions: suggestionsPolicy,

  // Media
  extractMedia: extractMediaPolicy,
  extractMediaDirect: extractMediaPolicy,
  playlist: playlistPolicy,

  // Conversion
  convert: conversionPolicy,
  checkTask: conversionPolicy,

  // Decrypt
  decrypt: decryptPolicy,
  decryptList: decryptPolicy,

  // Generic success (no validation)
  generic: (payload: any) => makeResult('success', 'OK', VERIFICATION_MESSAGES.OK, payload),
};
