/**
 * Stream DTOs
 * Normalized stream response after mapper + verification
 */

/**
 * Stream DTO (after normalizeStreamResponse)
 */
export interface StreamDto {
  status: string; // "stream" or "static"
  url: string; // Direct download URL
  filename: string; // Full filename from API
  title: string; // Parsed title
  quality: string | null; // Parsed quality (e.g., "1080p", "320kbps")
  format: string; // File format (e.g., "mp4", "mp3")
  downloadMode: 'video' | 'audio';
  progressUrl: string | null; // Progress polling URL (for autoMerge)
  size: number | null; // File size in bytes
}
