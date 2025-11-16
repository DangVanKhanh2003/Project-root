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
    if (response?.jwt && typeof response.jwt === 'string') {
      const jwt = response.jwt;

      // Save to JWT store if configured
      if (this.jwtStore) {
        this.jwtStore.save(jwt);

        if (this.verbose) {
          console.log('[DomainVerifier] JWT extracted and saved');
        }
      }

      return jwt;
    }

    return null;
  }

  /**
   * Clean response
   * Removes JWT field from response
   *
   * @param response - Raw response (may contain jwt)
   * @returns Cleaned response (without jwt)
   */
  private cleanResponse<T>(response: any): T {
    // Handle primitives and nulls
    if (response === null || response === undefined || typeof response !== 'object') {
      return response as T;
    }

    // Remove jwt field using destructuring
    const { jwt, ...cleanedResponse } = response;

    return cleanedResponse as T;
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
    try {
      // 1. Extract JWT (before cleaning!)
      this.extractJwt(rawResponse);

      // 2. Clean response - remove jwt field
      const cleanedResponse = this.cleanResponse<TInput>(rawResponse);

      // 3. Get verification policy
      const policy = this.policies[policyName];

      if (!policy) {
        // No policy defined - return success with cleaned data
        if (this.verbose) {
          console.warn(`[DomainVerifier] No policy found for: ${policyName}`);
        }

        return this.makeResult<TOutput>(
          'success',
          'OK',
          VERIFICATION_MESSAGES.OK,
          cleanedResponse as any,
          cleanedResponse
        );
      }

      // 4. Execute policy verification
      const verified = await policy(cleanedResponse, context);

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
