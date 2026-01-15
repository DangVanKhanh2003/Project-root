/**
 * Conversion Module - Main Barrel Export
 *
 * SWITCH POINT: Change which version to use by commenting/uncommenting below.
 * Only ONE version should be active at a time to avoid bundling unused code.
 */

// =============================================================================
// VERSION SWITCH - Uncomment ONE of the following sections
// =============================================================================

// -----------------------------------------------------------------------------
// V3 API (api.ytconvert.org) - NEW
// -----------------------------------------------------------------------------
export {
  startConversion,
  cancelConversion,
  handleDownloadClick,
} from './convert-logic-v3';

// V3 doesn't need clearSocialMediaCache - provide no-op for compatibility
export function clearSocialMediaCache(_formatId: string): void {
  // V3 doesn't use URL caching like V2
}

// -----------------------------------------------------------------------------
// V2 API (hub.y2mp3.co) - LEGACY
// -----------------------------------------------------------------------------
// export {
//   startConversion,
//   cancelConversion,
//   handleDownloadClick,
//   clearSocialMediaCache
// } from './convert-logic-v2';

// =============================================================================
// SHARED EXPORTS (always available)
// =============================================================================

// Types (V2 types - still used by UI components)
export * from './types';

// Application layer strategies (V2 only - not used by V3)
// Uncomment if using V2:
// export * from './application';
