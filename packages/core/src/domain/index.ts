/**
 * Domain Layer Exports
 * JWT management, verification, and service wrapper
 *
 * NOTE: Site projects should ONLY import from this domain layer.
 * Read DOMAIN_LAYER_GUIDE.md for usage instructions.
 */

// ========================================
// Verification
// ========================================
export {
  DomainVerifier,
  createVerifier,
  type VerifierConfig,
} from './verification/verifier';

export {
  type VerifiedResult,
  type VerificationStatus,
  type VerificationCode,
  type VerificationPolicy,
  type VerificationContext,
} from './verification/types';

export { VERIFICATION_MESSAGES, type MessageKey } from './verification/messages';

export { DEFAULT_POLICIES } from './verification/policies';

// ========================================
// JWT Store
// ========================================
export {
  type IJwtStore,
  InMemoryJwtStore,
  LocalStorageJwtStore,
  CustomJwtStore,
  createNamespacedKey,
} from './jwt/jwt-store.interface';

// ========================================
// Verified Services (MAIN API FOR SITE PROJECTS)
// ========================================
export {
  type VerifiedServices,
  createVerifiedServices,
  type CoreServices,
} from './verified-services';
