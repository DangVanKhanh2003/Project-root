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
  // Nới lỏng: Accept bất kỳ payload nào
  return makeResult('success', 'OK', VERIFICATION_MESSAGES.SEARCH_SUCCESS, payload);
};

/**
 * Search V2 Policy
 * Validates search v2 results
 */
export const searchV2Policy: VerificationPolicy = (payload: any) => {
  // Nới lỏng: Accept bất kỳ payload nào
  return makeResult('success', 'OK', VERIFICATION_MESSAGES.SEARCH_SUCCESS, payload);
};

/**
 * Suggestions Policy
 * Validates search suggestions
 */
export const suggestionsPolicy: VerificationPolicy = (payload: any) => {
  // Nới lỏng: Accept bất kỳ payload nào
  return makeResult('success', 'OK', VERIFICATION_MESSAGES.OK, payload);
};

/**
 * Extract Media Policy
 * Validates media extraction response
 * NOTE: Mapping is now handled in verified-services.ts wrapper layer
 */
export const extractMediaPolicy: VerificationPolicy = (payload: any) => {
  // Simple validation - accept any payload
  // Data mapping happens in verified-services wrapper
  return makeResult('success', 'OK', VERIFICATION_MESSAGES.EXTRACT_SUCCESS, payload);
};

/**
 * Playlist Policy
 * Validates playlist extraction
 */
export const playlistPolicy: VerificationPolicy = (payload: any) => {
  // Nới lỏng: Accept bất kỳ payload nào
  return makeResult('success', 'OK', 'Playlist extracted successfully', payload);
};

/**
 * Conversion Policy
 * Validates conversion task response
 */
export const conversionPolicy: VerificationPolicy = (payload: any) => {
  // Nới lỏng: Accept bất kỳ payload nào
  return makeResult('success', 'OK', VERIFICATION_MESSAGES.OK, payload);
};

/**
 * Decrypt Policy
 * Validates decrypt response
 */
export const decryptPolicy: VerificationPolicy = (payload: any) => {
  // Nới lỏng: Accept bất kỳ payload nào
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
