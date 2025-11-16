/**
 * Conversion DTOs
 * Normalized conversion task responses (after mapper + verification)
 */

/**
 * Task Response DTO
 * Returned from convert() and checkTask() service methods
 */
export interface TaskDto {
  status: string; // "PENDING", "CONVERTING", "CONVERTED", "FAILED"
  vid: string | null;
  bId: string | null; // Task ID for polling (null when converted)
  downloadUrl: string | null; // Available when status = "CONVERTED"
  message: string;
  title: string | null;
  quality: string | null;
}
