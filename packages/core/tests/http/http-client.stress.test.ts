/**
 * HTTP Client - Stress Tests
 *
 * Tests error parsing edge cases, concurrent requests,
 * and unusual server responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '@/http/http-client';
import { ApiError, NetworkError, TimeoutError, CancellationError } from '@/http/http-error';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(data: unknown, opts: Partial<Response> = {}): Response {
  const body = JSON.stringify(data);
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    statusText: opts.statusText ?? 'OK',
    headers: new Headers(opts.headers as any || { 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(body),
    ...opts,
  } as Response;
}

describe('HttpClient - STRESS TESTS', () => {
  let client: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new HttpClient({ baseUrl: 'https://api.test.com', timeout: 5000 });
  });

  // ==========================================
  // Error message parsing edge cases
  // ==========================================
  describe('Error message extraction from various response formats', () => {
    const errorFormats = [
      { body: { message: 'Error in message' }, expected: 'Error in message' },
      { body: { error: { message: 'Nested error' } }, expected: 'Nested error' },
      { body: { error: { code: 'ERR_CODE' } }, expected: 'ERR_CODE' },
      { body: { data: { message: 'Data message' } }, expected: 'Data message' },
      { body: { data: { reason: 'Data reason' } }, expected: 'Data reason' },
      { body: {}, expected: 'An unexpected error occurred. Please try again.' },
      { body: { unknownField: 'value' }, expected: 'An unexpected error occurred. Please try again.' },
    ];

    for (const { body, expected } of errorFormats) {
      it(`extracts: "${expected}" from ${JSON.stringify(body).substring(0, 50)}`, async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(body, { ok: false, status: 400 }));

        try {
          await client.get('/test');
          expect.fail('Should have thrown');
        } catch (e) {
          expect(e).toBeInstanceOf(ApiError);
          expect((e as ApiError).message).toBe(expected);
        }
      });
    }
  });

  // ==========================================
  // Non-JSON error responses
  // ==========================================
  describe('Non-JSON error responses', () => {
    it('handles text/plain error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: () => Promise.reject(new Error('not json')),
        text: () => Promise.resolve('Server is down for maintenance'),
      } as Response);

      try {
        await client.get('/test');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).message).toBe('Server is down for maintenance');
      }
    });

    it('handles empty error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: () => Promise.reject(new Error('not json')),
        text: () => Promise.resolve(''),
      } as Response);

      try {
        await client.get('/test');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(502);
      }
    });

    it('handles response that fails to parse entirely', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.reject(new Error('invalid json')),
        text: () => Promise.reject(new Error('read failed')),
      } as Response);

      try {
        await client.get('/test');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
      }
    });
  });

  // ==========================================
  // All HTTP status codes
  // ==========================================
  describe('All error status codes', () => {
    const statusCodes = [400, 401, 403, 404, 405, 408, 409, 413, 415, 422, 429, 500, 501, 502, 503, 504];

    for (const status of statusCodes) {
      it(`handles HTTP ${status} correctly`, async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { message: `Error ${status}` },
          { ok: false, status, statusText: `Error ${status}` }
        ));

        try {
          await client.get('/test');
          expect.fail('Should have thrown');
        } catch (e) {
          expect(e).toBeInstanceOf(ApiError);
          expect((e as ApiError).status).toBe(status);
        }
      });
    }
  });

  // ==========================================
  // Concurrent requests
  // ==========================================
  describe('Concurrent request handling', () => {
    it('handles 10 concurrent GET requests', async () => {
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse({ id: i }));
      }

      const promises = Array.from({ length: 10 }, (_, i) =>
        client.get(`/item/${i}`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((r, i) => expect(r).toEqual({ id: i }));
    });

    it('handles mix of success and failure in concurrent requests', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ ok: true }))
        .mockResolvedValueOnce(mockResponse({ message: 'fail' }, { ok: false, status: 500 }))
        .mockResolvedValueOnce(mockResponse({ ok: true }));

      const results = await Promise.allSettled([
        client.get('/ok1'),
        client.get('/fail'),
        client.get('/ok2'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  // ==========================================
  // URL building edge cases
  // ==========================================
  describe('URL building edge cases', () => {
    const urlCases = [
      { input: '/api/v1/download', expected: 'https://api.test.com/api/v1/download' },
      { input: 'api/v1/download', expected: 'https://api.test.com/api/v1/download' },
      { input: 'https://other.com/full-url', expected: 'https://other.com/full-url' },
      { input: 'http://insecure.com/test', expected: 'http://insecure.com/test' },
      { input: '/test?existing=param', expected: 'https://api.test.com/test?existing=param' },
      { input: '/', expected: 'https://api.test.com/' },
      { input: '', expected: 'https://api.test.com/' },
    ];

    for (const { input, expected } of urlCases) {
      it(`"${input}" → "${expected}"`, async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({}));
        await client.get(input);
        expect(mockFetch.mock.calls[0][0]).toBe(expected);
      });
    }
  });

  // ==========================================
  // Query param stress
  // ==========================================
  describe('GET query parameter stress', () => {
    it('handles 50 query parameters', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const params: Record<string, string> = {};
      for (let i = 0; i < 50; i++) {
        params[`param${i}`] = `value${i}`;
      }

      await client.get('/test', params);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('param0=value0');
      expect(url).toContain('param49=value49');
    });

    it('handles special characters in query params', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.get('/test', {
        q: 'hello world',
        url: 'https://example.com/path?key=val',
        emoji: '🎵',
      } as any);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('q=hello+world');
    });
  });

  // ==========================================
  // Request body stress
  // ==========================================
  describe('POST body edge cases', () => {
    it('handles large request body (100 fields)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const data: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        data[`field${i}`] = `value${i}`;
      }

      await client.post('/test', data);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(Object.keys(body)).toHaveLength(100);
    });

    it('handles nested objects in body', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.post('/test', {
        output: { type: 'video', format: 'mp4', quality: '1080p' },
        audio: { bitrate: '128k', trackId: 'en' },
        trim: { start: 0, end: 60 },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.output.type).toBe('video');
      expect(body.audio.bitrate).toBe('128k');
    });

    it('handles empty body', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.post('/test', {});

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({});
    });
  });

  // ==========================================
  // Cancellation stress
  // ==========================================
  describe('Cancellation stress', () => {
    it('handles 10 concurrent cancellations', async () => {
      const controllers = Array.from({ length: 10 }, () => new AbortController());

      const promises = controllers.map((ctrl, i) => {
        mockFetch.mockImplementationOnce(() =>
          new Promise((_, reject) => {
            ctrl.signal.addEventListener('abort', () => {
              const e = new Error('aborted');
              e.name = 'AbortError';
              reject(e);
            });
          })
        );

        return client.request({
          url: `/test/${i}`,
          method: 'GET',
          signal: ctrl.signal,
        });
      });

      // Cancel all immediately
      controllers.forEach(c => c.abort());

      const results = await Promise.allSettled(promises);
      results.forEach(r => {
        expect(r.status).toBe('rejected');
        if (r.status === 'rejected') {
          expect(r.reason).toBeInstanceOf(CancellationError);
        }
      });
    });
  });
});
