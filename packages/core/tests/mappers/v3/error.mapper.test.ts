/**
 * V3 Error Mapper Tests
 */

import { describe, it, expect } from 'vitest';
import {
  mapErrorCodeToMessage,
  isRetryableError,
  isUserInputError,
  isVideoUnavailableError,
} from '@/mappers/v3/error.mapper';

describe('error.mapper', () => {

  describe('mapErrorCodeToMessage', () => {
    it('maps known error codes to user-friendly messages', () => {
      expect(mapErrorCodeToMessage('INVALID_URL')).toBe('Invalid YouTube URL. Please enter a valid link.');
      expect(mapErrorCodeToMessage('VIDEO_NOT_FOUND')).toBe('Video not available or restricted.');
      expect(mapErrorCodeToMessage('INTERNAL_ERROR')).toBe('Server error. Please try again later.');
      expect(mapErrorCodeToMessage('EXTRACT_FAILED')).toBe('Failed to process video. Please try again.');
      expect(mapErrorCodeToMessage('UNAUTHORIZED')).toBe('Session expired. Please refresh the page.');
      expect(mapErrorCodeToMessage('FORBIDDEN')).toBe('Access denied. Please try again.');
    });

    it('returns default message for unknown error code', () => {
      expect(mapErrorCodeToMessage('UNKNOWN_CODE')).toBe('An error occurred. Please try again.');
    });

    it('returns default message for empty string', () => {
      expect(mapErrorCodeToMessage('')).toBe('An error occurred. Please try again.');
    });
  });

  describe('isRetryableError', () => {
    it('returns true for INTERNAL_ERROR', () => {
      expect(isRetryableError('INTERNAL_ERROR')).toBe(true);
    });

    it('returns true for EXTRACT_FAILED', () => {
      expect(isRetryableError('EXTRACT_FAILED')).toBe(true);
    });

    it('returns true for JOB_NOT_READY', () => {
      expect(isRetryableError('JOB_NOT_READY')).toBe(true);
    });

    it('returns false for INVALID_URL (user input error)', () => {
      expect(isRetryableError('INVALID_URL')).toBe(false);
    });

    it('returns false for VIDEO_NOT_FOUND', () => {
      expect(isRetryableError('VIDEO_NOT_FOUND')).toBe(false);
    });

    it('returns false for unknown error code', () => {
      expect(isRetryableError('UNKNOWN')).toBe(false);
    });
  });

  describe('isUserInputError', () => {
    it('returns true for INVALID_REQUEST', () => {
      expect(isUserInputError('INVALID_REQUEST')).toBe(true);
    });

    it('returns true for VALIDATION_ERROR', () => {
      expect(isUserInputError('VALIDATION_ERROR')).toBe(true);
    });

    it('returns true for INVALID_URL', () => {
      expect(isUserInputError('INVALID_URL')).toBe(true);
    });

    it('returns false for INTERNAL_ERROR', () => {
      expect(isUserInputError('INTERNAL_ERROR')).toBe(false);
    });

    it('returns false for VIDEO_NOT_FOUND', () => {
      expect(isUserInputError('VIDEO_NOT_FOUND')).toBe(false);
    });
  });

  describe('isVideoUnavailableError', () => {
    it('returns true for VIDEO_NOT_FOUND', () => {
      expect(isVideoUnavailableError('VIDEO_NOT_FOUND')).toBe(true);
    });

    it('returns true for AUDIO_NOT_FOUND', () => {
      expect(isVideoUnavailableError('AUDIO_NOT_FOUND')).toBe(true);
    });

    it('returns false for INVALID_URL', () => {
      expect(isVideoUnavailableError('INVALID_URL')).toBe(false);
    });

    it('returns false for INTERNAL_ERROR', () => {
      expect(isVideoUnavailableError('INTERNAL_ERROR')).toBe(false);
    });
  });
});
