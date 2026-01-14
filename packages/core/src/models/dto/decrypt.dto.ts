/**
 * Decrypt DTOs
 * Normalized decrypt responses (after mapper + verification)
 */

/**
 * Decode Response DTO
 * Returned from decodeUrl() service method
 */
export interface DecodeDto {
  success: boolean;
  url?: string; // Decrypted URL (when success = true)
  error?: string; // Error message (when success = false)
  reason?: string; // Error reason
}
