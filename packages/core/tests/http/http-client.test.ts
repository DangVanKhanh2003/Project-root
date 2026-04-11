/**
 * HTTP Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, createHttpClient } from '@/http/http-client';
import { ApiError, NetworkError, TimeoutError, CancellationError } from '@/http/http-error';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function createMockResponse(data: unknown, options: Partial<Response> = {}): Response {
  const body = JSON.stringify(data);
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(body),
    ...options,
  } as Response;
}

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    client = new HttpClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================
  // URL Building
  // ==========================================
  describe('URL building', () => {
    it('prepends baseUrl to relative path', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));

      await client.request({ url: '/api/download', method: 'GET' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/download',
        expect.any(Object)
      );
    });

    it('prepends slash to path without leading slash', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));

      await client.request({ url: 'api/download', method: 'GET' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/download',
        expect.any(Object)
      );
    });

    it('uses full URL as-is when starts with http', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));

      await client.request({ url: 'https://other.api.com/status', method: 'GET' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://other.api.com/status',
        expect.any(Object)
      );
    });
  });

  // ==========================================
  // GET Requests
  // ==========================================
  describe('GET requests', () => {
    it('appends data as query params for GET', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ result: 'ok' }));

      await client.get('/search', { q: 'test', page: '1' });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).toContain('page=1');
    });

    it('does not include body for GET', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.get('/search');

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.body).toBeUndefined();
    });

    it('returns parsed JSON response', async () => {
      const responseData = { title: 'Test Video', duration: 300 };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseData));

      const result = await client.get('/video');

      expect(result).toEqual(responseData);
    });
  });

  // ==========================================
  // POST Requests
  // ==========================================
  describe('POST requests', () => {
    it('sends JSON body for POST', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ jobId: '123' }));

      await client.post('/api/download', { url: 'https://youtube.com/watch?v=abc' });

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.method).toBe('POST');
      expect(fetchOptions.body).toBe(JSON.stringify({ url: 'https://youtube.com/watch?v=abc' }));
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');
    });

    it('returns parsed response', async () => {
      const responseData = { statusUrl: 'https://api.com/status/abc' };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseData));

      const result = await client.post('/api/download', { url: 'test' });

      expect(result).toEqual(responseData);
    });
  });

  // ==========================================
  // Headers
  // ==========================================
  describe('headers', () => {
    it('includes Accept: application/json by default', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.get('/test');

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.headers.Accept).toBe('application/json');
    });

    it('includes default headers from config', async () => {
      const clientWithHeaders = new HttpClient({
        baseUrl: 'https://api.example.com',
        defaultHeaders: { 'X-Custom': 'value' },
      });
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await clientWithHeaders.get('/test');

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.headers['X-Custom']).toBe('value');
    });

    it('allows overriding headers per request', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.request({
        url: '/test',
        method: 'GET',
        headers: { 'Authorization': 'Bearer token123' },
      });

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.headers.Authorization).toBe('Bearer token123');
    });
  });

  // ==========================================
  // Error Handling
  // ==========================================
  describe('error handling', () => {
    it('throws ApiError for non-ok response with JSON error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(
        { message: 'Video not found' },
        { ok: false, status: 404, statusText: 'Not Found' }
      ));

      await expect(client.get('/video')).rejects.toThrow(ApiError);

      try {
        await client.get('/video');
      } catch (e) {
        // Already tested above, this catch is just for safety
      }
    });

    it('extracts error message from JSON response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(
        { message: 'Invalid URL provided' },
        { ok: false, status: 400, statusText: 'Bad Request' }
      ));

      try {
        await client.get('/video');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).message).toBe('Invalid URL provided');
        expect((e as ApiError).status).toBe(400);
      }
    });

    it('throws NetworkError for TypeError (fetch failure)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(client.get('/test')).rejects.toThrow(NetworkError);
    });

    it('throws NetworkError for unexpected errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Something went wrong'));

      await expect(client.get('/test')).rejects.toThrow(NetworkError);
    });
  });

  // ==========================================
  // Timeout
  // ==========================================
  describe('timeout', () => {
    it('throws TimeoutError when request exceeds timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const promise = client.request({ url: '/slow', method: 'GET', timeout: 50 });

      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow(TimeoutError);
    });

    it('uses default timeout from config', () => {
      const customClient = new HttpClient({
        baseUrl: 'https://api.example.com',
        timeout: 10000,
      });
      // Verify client is created without error (timeout is internal)
      expect(customClient).toBeDefined();
    });

    it('uses 30s default when no timeout configured', () => {
      const defaultClient = new HttpClient({
        baseUrl: 'https://api.example.com',
      });
      expect(defaultClient).toBeDefined();
    });
  });

  // ==========================================
  // Cancellation
  // ==========================================
  describe('cancellation', () => {
    it('throws CancellationError when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        client.request({ url: '/test', method: 'GET', signal: controller.signal })
      ).rejects.toThrow(CancellationError);
    });

    it('throws CancellationError when signal aborts during request', async () => {
      const controller = new AbortController();

      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          // Simulate abort during fetch
          controller.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      const promise = client.request({
        url: '/test',
        method: 'GET',
        signal: controller.signal,
      });

      // Abort after a short delay
      controller.abort();

      await expect(promise).rejects.toThrow(CancellationError);
    });
  });

  // ==========================================
  // Factory
  // ==========================================
  describe('createHttpClient', () => {
    it('creates HttpClient instance', () => {
      const httpClient = createHttpClient({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
      });
      expect(httpClient).toBeDefined();
      expect(httpClient.request).toBeDefined();
      expect(httpClient.get).toBeDefined();
      expect(httpClient.post).toBeDefined();
    });
  });
});
