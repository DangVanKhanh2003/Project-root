/**
 * Conversion Module - Main Barrel Export
 *
 * Using V2 orchestrator with V3 API backend.
 * The V2 orchestrator handles UI flow via Strategy pattern.
 * The V3 API is called internally by extractFormat() and concurrent-polling.
 */

// Types
export * from './types';

// Application layer (strategies)
export * from './application';

// Main orchestrator (V2 structure with V3 API backend)
export {
  startConversion,
  cancelConversion,
  handleDownloadClick,
  clearSocialMediaCache
} from './convert-logic';
