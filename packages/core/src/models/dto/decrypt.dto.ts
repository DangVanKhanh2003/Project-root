/**
 * Decrypt DTOs
 * Normalized decrypt result after mapper + verification
 */

/**
 * Decode DTO (after normalizeDecodeResponse)
 */
export interface DecodeDto {
  success: boolean;
  url?: string; // Decrypted URL (when success = true)
  error?: string; // Error message (when success = false)
  reason?: string; // Error reason
}
