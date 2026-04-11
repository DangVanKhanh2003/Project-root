/**
 * V3 Download Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createV3DownloadService } from '@/services/v3/implementations/download.service';
import type { IV3DownloadService } from '@/services/v3/interfaces/download.interface';
import type { V3DownloadRequest } from '@/models/remote/v3/requests';

describe('V3DownloadService', () => {
  let service: IV3DownloadService;
  let mockHttpClient: any;
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHttpClient = {
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    };

    mockConfig = {
      timeouts: {
        v3CreateJob: 60000,
        v3GetStatus: 20000,
      },
    };

    service = createV3DownloadService(mockHttpClient, mockConfig);
  });

  // ==========================================
  // createJob
  // ==========================================
  describe('createJob', () => {
    const validRequest: V3DownloadRequest = {
      url: 'https://www.youtube.com/watch?v=test123',
      output: {
        type: 'video',
        format: 'mp4',
        quality: '1080p',
      },
    };

    it('throws error for empty URL', async () => {
      const request = { ...validRequest, url: '' };
      await expect(service.createJob(request)).rejects.toThrow('Invalid URL');
    });

    it('throws error for non-string URL', async () => {
      const request = { ...validRequest, url: null as any };
      await expect(service.createJob(request)).rejects.toThrow('Invalid URL');
    });

    it('throws error when output.type is missing', async () => {
      const request = {
        url: 'https://youtube.com/watch?v=test',
        output: { format: 'mp4' } as any,
      };
      await expect(service.createJob(request)).rejects.toThrow('output.type is required');
    });

    it('throws error when output.format is missing', async () => {
      const request = {
        url: 'https://youtube.com/watch?v=test',
        output: { type: 'video' } as any,
      };
      await expect(service.createJob(request)).rejects.toThrow('output.format is required');
    });

    it('calls makeRequest with correct parameters for valid request', async () => {
      // The service extends BaseService which uses makeRequest internally
      // makeRequest calls httpClient.request, so we mock that
      const jobResponse = {
        statusUrl: 'https://api.com/status/abc',
        title: 'Test Video',
        duration: 300,
      };
      mockHttpClient.request.mockResolvedValueOnce(jobResponse);

      const result = await service.createJob(validRequest);

      expect(result).toEqual(jobResponse);
    });

    it('throws error when API returns error response', async () => {
      const errorResponse = {
        error: {
          code: 'INVALID_URL',
          message: 'Invalid YouTube URL',
        },
      };
      mockHttpClient.request.mockResolvedValueOnce(errorResponse);

      await expect(service.createJob(validRequest)).rejects.toThrow('Invalid YouTube URL');
    });

    it('throws error with code when error message is empty', async () => {
      const errorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: '',
        },
      };
      mockHttpClient.request.mockResolvedValueOnce(errorResponse);

      await expect(service.createJob(validRequest)).rejects.toThrow('INTERNAL_ERROR');
    });

    it('passes AbortSignal to makeRequest', async () => {
      const jobResponse = {
        statusUrl: 'https://api.com/status/abc',
        title: 'Test',
        duration: 100,
      };
      mockHttpClient.request.mockResolvedValueOnce(jobResponse);

      const controller = new AbortController();
      await service.createJob(validRequest, controller.signal);

      const requestCall = mockHttpClient.request.mock.calls[0][0];
      expect(requestCall.signal).toBe(controller.signal);
    });
  });

  // ==========================================
  // getStatusByUrl
  // ==========================================
  describe('getStatusByUrl', () => {
    it('throws error for empty statusUrl', async () => {
      await expect(service.getStatusByUrl('')).rejects.toThrow('Invalid statusUrl');
    });

    it('throws error for non-string statusUrl', async () => {
      await expect(service.getStatusByUrl(null as any)).rejects.toThrow('Invalid statusUrl');
    });

    it('returns status response for pending job', async () => {
      const statusResponse = {
        status: 'pending',
        progress: 45,
        title: 'Test Video',
        duration: 300,
        detail: { video: 60, audio: 30 },
      };
      mockHttpClient.request.mockResolvedValueOnce(statusResponse);

      const result = await service.getStatusByUrl('https://api.com/status/abc');

      expect(result).toEqual(statusResponse);
    });

    it('returns completed status with downloadUrl', async () => {
      const statusResponse = {
        status: 'completed',
        progress: 100,
        title: 'Test Video',
        duration: 300,
        downloadUrl: 'https://cdn.com/file.mp4',
      };
      mockHttpClient.request.mockResolvedValueOnce(statusResponse);

      const result = await service.getStatusByUrl('https://api.com/status/abc');

      expect(result.status).toBe('completed');
      expect(result.downloadUrl).toBe('https://cdn.com/file.mp4');
    });

    it('throws error when API returns error response', async () => {
      const errorResponse = {
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found',
        },
      };
      mockHttpClient.request.mockResolvedValueOnce(errorResponse);

      await expect(
        service.getStatusByUrl('https://api.com/status/abc')
      ).rejects.toThrow('Job not found');
    });

    it('uses full URL as-is (not relative path)', async () => {
      const fullUrl = 'https://api.ytconvert.org/api/status/abc?token=xyz&expires=123';
      mockHttpClient.request.mockResolvedValueOnce({
        status: 'pending',
        progress: 0,
        title: 'Test',
        duration: 100,
      });

      await service.getStatusByUrl(fullUrl);

      const requestCall = mockHttpClient.request.mock.calls[0][0];
      expect(requestCall.url).toBe(fullUrl);
    });
  });
});
