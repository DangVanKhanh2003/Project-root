/**
 * Conversion Module - Main Barrel Export
 *
 * Simple V3 API flow for all devices.
 * No device-specific routing or strategies.
 */

// Types
export * from './types';

// V3 exports
export * from './v3';

// Main conversion logic
export {
  startConversion,
  cancelConversion,
  handleDownloadClick,
} from './convert-logic-v3';

// V3 doesn't need clearSocialMediaCache - provide no-op for compatibility
export function clearSocialMediaCache(_formatId: string): void {
  // V3 doesn't use URL caching
}
