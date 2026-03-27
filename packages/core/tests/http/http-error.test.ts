/**
 * HTTP Error Classes Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  CancellationError,
} from '@/http/http-error';

describe('http-error', () => {

  describe('ApiError', () => {
    it('creates error with correct properties', () => {
      const error = new ApiError('Not Found', 404, 'Not Found', { body: 'test' });

      expect(error.message).toBe('Not Found');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.response).toEqual({ body: 'test' });
      expect(error.name).toBe('ApiError');
    });

    it('is instance of Error', () => {
      const error = new ApiError('test', 500);
      expect(error).toBeInstanceOf(Error);
    });

    it('serializes to JSON correctly', () => {
      const error = new ApiError('Server Error', 500, 'Internal Server Error');
      const json = error.toJSON();

      expect(json.name).toBe('ApiError');
      expect(json.message).toBe('Server Error');
      expect(json.status).toBe(500);
      expect(json.statusText).toBe('Internal Server Error');
      expect(json.stack).toBeDefined();
    });
  });

  describe('NetworkError', () => {
    it('creates error with status 0', () => {
      const cause = new TypeError('fetch failed');
      const error = new NetworkError('Network request failed', cause);

      expect(error.message).toBe('Network request failed');
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Network Error');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('NetworkError');
    });

    it('is instance of ApiError', () => {
      const error = new NetworkError('test');
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('TimeoutError', () => {
    it('creates error with timeout value', () => {
      const error = new TimeoutError('Request timeout after 30000ms', 30000);

      expect(error.message).toBe('Request timeout after 30000ms');
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Timeout');
      expect(error.timeout).toBe(30000);
      expect(error.name).toBe('TimeoutError');
    });

    it('serializes with timeout in JSON', () => {
      const error = new TimeoutError('timeout', 5000);
      const json = error.toJSON();

      expect(json.timeout).toBe(5000);
      expect(json.name).toBe('TimeoutError');
    });

    it('is instance of ApiError', () => {
      const error = new TimeoutError('test', 1000);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('ValidationError', () => {
    it('creates error with validation errors object', () => {
      const errors = { url: ['URL is required', 'URL must be valid'] };
      const error = new ValidationError('Validation failed', errors);

      expect(error.message).toBe('Validation failed');
      expect(error.status).toBe(400);
      expect(error.statusText).toBe('Validation Error');
      expect(error.errors).toEqual(errors);
      expect(error.name).toBe('ValidationError');
    });

    it('serializes with errors in JSON', () => {
      const errors = { field: ['required'] };
      const error = new ValidationError('Invalid', errors);
      const json = error.toJSON();

      expect(json.errors).toEqual(errors);
    });

    it('is instance of ApiError', () => {
      const error = new ValidationError('test');
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('CancellationError', () => {
    it('creates error with default message', () => {
      const error = new CancellationError();

      expect(error.message).toBe('Request cancelled by user');
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Cancelled');
      expect(error.name).toBe('CancellationError');
    });

    it('creates error with custom message', () => {
      const error = new CancellationError('User aborted');
      expect(error.message).toBe('User aborted');
    });

    it('is instance of ApiError', () => {
      const error = new CancellationError();
      expect(error).toBeInstanceOf(ApiError);
    });
  });
});
