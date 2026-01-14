/**
 * HTTP Error Classes
 * Custom error types for HTTP client operations
 */

/**
 * Base API Error class
 * All HTTP-related errors extend from this
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText?: string,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Serialize error to JSON for logging/debugging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      response: this.response,
      stack: this.stack,
    };
  }
}

/**
 * Network Error
 * Thrown when network request fails (no response received)
 */
export class NetworkError extends ApiError {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message, 0, 'Network Error');
    this.name = 'NetworkError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Timeout Error
 * Thrown when request exceeds timeout duration
 */
export class TimeoutError extends ApiError {
  constructor(
    message: string,
    public readonly timeout: number
  ) {
    super(message, 0, 'Timeout');
    this.name = 'TimeoutError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeout: this.timeout,
    };
  }
}

/**
 * Validation Error
 * Thrown when request/response validation fails
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message, 400, 'Validation Error');
    this.name = 'ValidationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Cancellation Error
 * Thrown when request is cancelled by user
 */
export class CancellationError extends ApiError {
  constructor(message = 'Request cancelled by user') {
    super(message, 0, 'Cancelled');
    this.name = 'CancellationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancellationError);
    }
  }
}
