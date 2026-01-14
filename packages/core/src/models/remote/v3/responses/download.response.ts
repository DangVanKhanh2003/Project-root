/**
 * API V3 Download Response Models
 * YouTube Download API - https://api.ytconvert.org
 */

/**
 * Response from POST /api/download
 * Returns job ID and video metadata
 */
export interface CreateJobResponse {
  /** Job ID for polling status */
  id: string;

  /** Video title */
  title: string;

  /** Video duration in seconds */
  duration: number;

  /** Requested quality */
  requestedQuality?: string;

  /** Actually selected quality (may differ from requested) */
  selectedQuality?: string;

  /** True if quality was changed from requested */
  qualityChanged?: boolean;

  /** Reason for quality change */
  qualityChangeReason?: string;
}

/**
 * Progress detail breakdown
 */
export interface ProgressDetail {
  /** Video download/processing progress (0-100) */
  video: number;

  /** Audio download/processing progress (0-100) */
  audio: number;
}

/**
 * Job status type
 */
export type JobStatus = 'pending' | 'completed' | 'error';

/**
 * Response from GET /api/status/:id
 */
export interface StatusResponse {
  /** Job status */
  status: JobStatus;

  /** Overall progress (0-100) */
  progress: number;

  /** Video title */
  title: string;

  /** Video duration in seconds */
  duration: number;

  /** Progress breakdown (only when status is pending) */
  detail?: ProgressDetail;

  /** Download URL (only when status is completed) */
  downloadUrl?: string;

  /** Error message (only when status is error) */
  jobError?: string;
}

/**
 * Error response structure
 */
export interface V3ErrorResponse {
  error: {
    /** Error code */
    code: V3ErrorCode;

    /** Error message */
    message: string;
  };
}

/**
 * V3 API Error Codes
 */
export type V3ErrorCode =
  | 'INVALID_REQUEST'
  | 'VALIDATION_ERROR'
  | 'INVALID_URL'
  | 'INVALID_JOB_ID'
  | 'JOB_NOT_READY'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'JOB_NOT_FOUND'
  | 'VIDEO_NOT_FOUND'
  | 'AUDIO_NOT_FOUND'
  | 'FILE_NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'EXTRACT_FAILED';
