/**
 * Domain Verifier
 * Handles JWT extraction, response cleaning, and verification
 */

import type { IJwtStore } from '../jwt/jwt-store.interface';
import type {
  VerifiedResult,
  VerificationStatus,
  VerificationCode,
  VerificationPolicy,
  VerificationContext,
} from './types';
import { VERIFICATION_MESSAGES } from './messages';

/**
 * Verifier Configuration
 */
export interface VerifierConfig {
  /**
   * JWT store for saving extracted tokens
   */
  jwtStore?: IJwtStore;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Custom verification policies
   */
  policies?: Record<string, VerificationPolicy<any, any>>;
}

/**
 * Domain Verifier
 * Central verification layer that:
 * 1. Extracts JWT from responses
 * 2. Cleans responses (removes jwt field)
 * 3. Verifies responses using policies
 * 4. Returns unified VerifiedResult
 */
export class DomainVerifier {
  private readonly jwtStore?: IJwtStore;
  private readonly verbose: boolean;
  private readonly policies: Record<string, VerificationPolicy<any, any>>;

  constructor(config: VerifierConfig = {}) {
    this.jwtStore = config.jwtStore;
    this.verbose = config.verbose ?? false;
    this.policies = config.policies ?? {};
  }

  /**
   * Make verified result
   * Helper to create standardized VerifiedResult objects
   */
  makeResult<T>(
    status: VerificationStatus,
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
   * Extract JWT from response
   * Extracts and saves JWT if present in response
   *
   * @param response - Raw API response
   * @returns Extracted JWT or null
   */
  private extractJwt(response: any): string | null {
    console.log('🔑 [DomainVerifier.extractJwt] Raw response:', response);
    console.log('🔑 [DomainVerifier.extractJwt] Has jwtStore:', !!this.jwtStore);

    // Try to find JWT at multiple levels
    let jwt: string | null = null;

    // Level 1: Direct response.jwt
    if (response?.jwt && typeof response.jwt === 'string') {
      jwt = response.jwt;
      console.log('🔑 [DomainVerifier.extractJwt] JWT found at response.jwt');
    }
    // Level 2: response.data.jwt (nested in data)
    else if (response?.data?.jwt && typeof response.data.jwt === 'string') {
      jwt = response.data.jwt;
      console.log('🔑 [DomainVerifier.extractJwt] JWT found at response.data.jwt');
    }
    // Level 3: response.data.data.jwt (double nested)
    else if (response?.data?.data?.jwt && typeof response.data.data.jwt === 'string') {
      jwt = response.data.data.jwt;
      console.log('🔑 [DomainVerifier.extractJwt] JWT found at response.data.data.jwt');
    }

    if (jwt) {
      console.log('🔑 [DomainVerifier.extractJwt] JWT found:', jwt.substring(0, 30) + '...');

      // Save to JWT store if configured
      if (this.jwtStore) {
        this.jwtStore.save(jwt);
        console.log('🔑 [DomainVerifier.extractJwt] JWT saved to store');

        if (this.verbose) {
          console.log('[DomainVerifier] JWT extracted and saved');
        }
      } else {
        console.warn('🔑 [DomainVerifier.extractJwt] No JWT store configured!');
      }

      return jwt;
    }

    console.warn('🔑 [DomainVerifier.extractJwt] No JWT found in response (checked multiple levels)');
    return null;
  }

  /**
   * Unwrap nested API response
   * Handles multiple nesting levels:
   * - { success: true, data: {...} } → data
   * - { status: 'ok', data: {...} } → data
   * - { data: { status: 'ok', data: {...} } } → data.data
   *
   * @param response - API response (may be nested)
   * @returns Unwrapped data
   */
  private unwrapResponse<T>(response: any): T {
    let data = response;

    // Unwrap { success: true, data: {...} }
    if (data && data.success && data.data) {
      data = data.data;
      console.log('🎁 [DomainVerifier.unwrapResponse] Unwrapped {success, data}');
    }

    // Unwrap { status: 'ok', data: {...} }
    if (data && data.status === 'ok' && data.data) {
      data = data.data;
      console.log('🎁 [DomainVerifier.unwrapResponse] Unwrapped {status, data}');
    }

    return data as T;
  }

  /**
   * Clean response
   * Removes JWT field from response at all levels
   *
   * @param response - Raw response (may contain jwt)
   * @returns Cleaned response (without jwt)
   */
  private cleanResponse<T>(response: any): T {
    // Handle primitives and nulls
    if (response === null || response === undefined || typeof response !== 'object') {
      return response as T;
    }

    // Deep clone to avoid mutating original
    const cleaned = { ...response };

    // Remove JWT at top level
    if ('jwt' in cleaned) {
      delete cleaned.jwt;
      console.log('🧹 [DomainVerifier.cleanResponse] Removed JWT from top level');
    }

    // Remove JWT from nested data object
    if (cleaned.data && typeof cleaned.data === 'object') {
      cleaned.data = { ...cleaned.data };
      if ('jwt' in cleaned.data) {
        delete cleaned.data.jwt;
        console.log('🧹 [DomainVerifier.cleanResponse] Removed JWT from data level');
      }

      // Remove JWT from double-nested data.data object
      if (cleaned.data.data && typeof cleaned.data.data === 'object') {
        cleaned.data.data = { ...cleaned.data.data };
        if ('jwt' in cleaned.data.data) {
          delete cleaned.data.data.jwt;
          console.log('🧹 [DomainVerifier.cleanResponse] Removed JWT from data.data level');
        }
      }
    }

    return cleaned as T;
  }

  /**
   * Verify response using policy
   * Main verification method - handles JWT extraction, cleaning, and policy verification
   *
   * @param rawResponse - Raw API response (may contain jwt)
   * @param policyName - Name of verification policy to use
   * @param context - Optional verification context
   * @returns Verified result
   *
   * @example
   * const result = await verifier.verifyResponse(
   *   rawResponse,
   *   'searchTitle',
   *   { service: 'search', operation: 'searchTitle' }
   * );
   */
  async verifyResponse<TInput = any, TOutput = any>(
    rawResponse: TInput,
    policyName: string,
    context?: VerificationContext
  ): Promise<VerifiedResult<TOutput>> {
    console.log('✅ [DomainVerifier.verifyResponse] Policy:', policyName);
    console.log('✅ [DomainVerifier.verifyResponse] Raw response:', rawResponse);

    try {
      // 1. Extract JWT (before cleaning!)
      this.extractJwt(rawResponse);

      // 2. Clean response - remove jwt field
      const cleanedResponse = this.cleanResponse<TInput>(rawResponse);
      console.log('✅ [DomainVerifier.verifyResponse] Cleaned response:', cleanedResponse);

      // 3. Unwrap nested response BEFORE policy validation
      // Response structure: { success: true, data: { status: 'ok', data: {...} } }
      // We need to unwrap to get the actual data
      const unwrappedResponse = this.unwrapResponse<any>(cleanedResponse);
      console.log('✅ [DomainVerifier.verifyResponse] Unwrapped response:', unwrappedResponse);

      // 4. Get verification policy
      const policy = this.policies[policyName];

      if (!policy) {
        // No policy defined - return success with unwrapped data
        if (this.verbose) {
          console.warn(`[DomainVerifier] No policy found for: ${policyName}`);
        }

        return this.makeResult<TOutput>(
          'success',
          'OK',
          VERIFICATION_MESSAGES.OK,
          unwrappedResponse as any,
          unwrappedResponse
        );
      }

      // 5. Execute policy verification on unwrapped data
      const verified = await policy(unwrappedResponse, context);

      if (this.verbose) {
        console.log(`[DomainVerifier] Verified with policy: ${policyName}`, {
          status: verified.status,
          code: verified.code,
        });
      }

      return verified;
    } catch (error) {
      // Verification failed with exception
      if (this.verbose) {
        console.error('[DomainVerifier] Verification error:', error);
      }

      return this.makeResult<TOutput>(
        'error',
        'ERROR',
        error instanceof Error ? error.message : VERIFICATION_MESSAGES.ERROR,
        null,
        { error }
      );
    }
  }

  /**
   * Verify response without policy
   * Simple verification - just extracts JWT and cleans response
   *
   * @param rawResponse - Raw API response
   * @returns Verified result with cleaned data
   */
  async verifySimple<T>(rawResponse: any): Promise<VerifiedResult<T>> {
    // Extract JWT
    this.extractJwt(rawResponse);

    // Clean response
    const cleanedResponse = this.cleanResponse<T>(rawResponse);

    // Return success with cleaned data
    return this.makeResult<T>(
      'success',
      'OK',
      VERIFICATION_MESSAGES.OK,
      cleanedResponse,
      cleanedResponse
    );
  }

  /**
   * Register verification policy
   * Add or update a verification policy
   *
   * @param name - Policy name
   * @param policy - Policy function
   */
  registerPolicy<TInput = any, TOutput = any>(
    name: string,
    policy: VerificationPolicy<TInput, TOutput>
  ): void {
    this.policies[name] = policy;

    if (this.verbose) {
      console.log(`[DomainVerifier] Policy registered: ${name}`);
    }
  }

  /**
   * Get current JWT from store
   * @returns Current JWT or null
   */
  getCurrentJwt(): string | null {
    return this.jwtStore?.get() ?? null;
  }

  /**
   * Clear JWT from store
   */
  clearJwt(): void {
    this.jwtStore?.clear();

    if (this.verbose) {
      console.log('[DomainVerifier] JWT cleared');
    }
  }
}

/**
 * Create domain verifier instance
 *
 * @param config - Verifier configuration
 * @returns DomainVerifier instance
 */
export function createVerifier(config: VerifierConfig = {}): DomainVerifier {
  return new DomainVerifier(config);
}
