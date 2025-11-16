/**
 * Base Service Utilities
 * Abstract base class for all service implementations
 */

// Base service class (OOP pattern - RECOMMENDED)
export {
  BaseService,
  type BaseRequestOptions,
  type JwtCallback,
  type VerificationConfig,
} from './base-service';

// Standalone helpers (functional pattern - DEPRECATED, for backward compatibility)
export {
  unwrapSimpleResponse,
  unwrapNestedResponse,
  createJwtHandler,
} from './response-helpers';
