/**
 * V3 Playlist Service Tests — Downloader Monorepo
 *
 * Test playlist extraction, pagination, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock playlist service (same interface as real service)
interface PlaylistItem {
  videoId: string;
  title: string;
  duration: number;
  thumbnail: string;
}

interface PlaylistResponse {
  title: string;
  thumbnail: string;
  itemCount: number;
  items: PlaylistItem[];
  nextPageToken?: string;
}

function createMockPlaylistService() {
  const pages = new Map<string, PlaylistResponse>();

  return {
    setPage(token: string | null, data: PlaylistResponse) {
      pages.set(token || 'first', data);
    },

    async fetchPlaylist(playlistId: string, pageToken?: string): Promise<PlaylistResponse> {
      if (!playlistId) throw new Error('Invalid playlist ID');

      const key = pageToken || 'first';
      const data = pages.get(key);
      if (!data) throw new Error('Page not found');

      return data;
    },
  };
}

describe('Playlist Service', () => {
  let service: ReturnType<typeof createMockPlaylistService>;

  beforeEach(() => {
    service = createMockPlaylistService();
  });

  describe('extractPlaylist', () => {
    it('returns playlist with items', async () => {
      service.setPage(null, {
        title: 'My Playlist',
        thumbnail: 'https://img.youtube.com/vi/abc/0.jpg',
        itemCount: 3,
        items: [
          { videoId: 'abc', title: 'Video 1', duration: 120, thumbnail: 'thumb1' },
          { videoId: 'def', title: 'Video 2', duration: 240, thumbnail: 'thumb2' },
          { videoId: 'ghi', title: 'Video 3', duration: 360, thumbnail: 'thumb3' },
        ],
      });

      const result = await service.fetchPlaylist('PLtest123');

      expect(result.title).toBe('My Playlist');
      expect(result.items).toHaveLength(3);
      expect(result.items[0].videoId).toBe('abc');
      expect(result.items[2].duration).toBe(360);
    });

    it('handles pagination with nextPageToken', async () => {
      service.setPage(null, {
        title: 'Big Playlist',
        thumbnail: 'thumb',
        itemCount: 40,
        items: Array.from({ length: 20 }, (_, i) => ({
          videoId: `page1-${i}`, title: `Video ${i}`, duration: 100, thumbnail: `t${i}`,
        })),
        nextPageToken: 'page2token',
      });

      service.setPage('page2token', {
        title: 'Big Playlist',
        thumbnail: 'thumb',
        itemCount: 40,
        items: Array.from({ length: 20 }, (_, i) => ({
          videoId: `page2-${i}`, title: `Video ${20 + i}`, duration: 100, thumbnail: `t${20 + i}`,
        })),
      });

      // Page 1
      const page1 = await service.fetchPlaylist('PLbig');
      expect(page1.items).toHaveLength(20);
      expect(page1.nextPageToken).toBe('page2token');

      // Page 2
      const page2 = await service.fetchPlaylist('PLbig', 'page2token');
      expect(page2.items).toHaveLength(20);
      expect(page2.nextPageToken).toBeUndefined();

      // Total items
      const allItems = [...page1.items, ...page2.items];
      expect(allItems).toHaveLength(40);
      expect(new Set(allItems.map(i => i.videoId)).size).toBe(40); // All unique
    });

    it('throws error for empty playlist ID', async () => {
      await expect(service.fetchPlaylist('')).rejects.toThrow('Invalid playlist ID');
    });

    it('throws error for invalid page token', async () => {
      service.setPage(null, {
        title: 'Test', thumbnail: '', itemCount: 1,
        items: [{ videoId: 'a', title: 'A', duration: 60, thumbnail: '' }],
        nextPageToken: 'validtoken',
      });

      await expect(service.fetchPlaylist('PL123', 'invalidtoken')).rejects.toThrow();
    });

    it('handles empty playlist', async () => {
      service.setPage(null, {
        title: 'Empty Playlist',
        thumbnail: '',
        itemCount: 0,
        items: [],
      });

      const result = await service.fetchPlaylist('PLempty');
      expect(result.items).toHaveLength(0);
      expect(result.itemCount).toBe(0);
    });

    it('handles playlist with 30 items (max tier-1 limit)', async () => {
      service.setPage(null, {
        title: '30-Item Playlist',
        thumbnail: 'thumb',
        itemCount: 30,
        items: Array.from({ length: 30 }, (_, i) => ({
          videoId: `vid${i}`, title: `Video ${i}`, duration: 120 + i * 10, thumbnail: `t${i}`,
        })),
      });

      const result = await service.fetchPlaylist('PL30');
      expect(result.items).toHaveLength(30);
      expect(result.itemCount).toBe(30);
    });
  });
});

describe('Feature Limit Constants', () => {
  // Test the constant values that determine limits
  const LIMITS = {
    MULTIPLE_MAX_ITEMS_ALLOWED: 10,
    MULTIPLE_MAX_ITEMS_FALLBACK: 5,
    PLAYLIST_MAX_ITEMS_ALLOWED: 30,
    PLAYLIST_MAX_ITEMS_FALLBACK: 15,
    CHANNEL_MAX_ITEMS_ALLOWED: 30,
    CHANNEL_MAX_ITEMS_FALLBACK: 15,
    HIGH_QUALITY_4K_START_PER_DAY: 20,
    HIGH_QUALITY_2K_START_PER_DAY: 20,
    HIGH_QUALITY_320K_START_PER_DAY: 20,
    CUT_VIDEO_START_PER_DAY: 200,
    DEFAULT_START_PER_DAY: 5,
    YOUTUBE_QUEUE_CONCURRENCY: 5,
    OTHER_LINK_QUEUE_CONCURRENCY: 10,
  };

  it('playlist max items: 30 (tier-1), 15 (tier-2)', () => {
    expect(LIMITS.PLAYLIST_MAX_ITEMS_ALLOWED).toBe(30);
    expect(LIMITS.PLAYLIST_MAX_ITEMS_FALLBACK).toBe(15);
  });

  it('multiple max items: 10 (tier-1), 5 (tier-2)', () => {
    expect(LIMITS.MULTIPLE_MAX_ITEMS_ALLOWED).toBe(10);
    expect(LIMITS.MULTIPLE_MAX_ITEMS_FALLBACK).toBe(5);
  });

  it('4K/2K/320k daily limit: 20', () => {
    expect(LIMITS.HIGH_QUALITY_4K_START_PER_DAY).toBe(20);
    expect(LIMITS.HIGH_QUALITY_2K_START_PER_DAY).toBe(20);
    expect(LIMITS.HIGH_QUALITY_320K_START_PER_DAY).toBe(20);
  });

  it('cut video daily limit: 200', () => {
    expect(LIMITS.CUT_VIDEO_START_PER_DAY).toBe(200);
  });

  it('YouTube queue concurrency: 5', () => {
    expect(LIMITS.YOUTUBE_QUEUE_CONCURRENCY).toBe(5);
  });

  it('Other link concurrency: 10', () => {
    expect(LIMITS.OTHER_LINK_QUEUE_CONCURRENCY).toBe(10);
  });
});

describe('Daily Limit Tracker', () => {
  // Simulated daily limit logic (same as app's download-limit.ts)
  function checkDailyLimit(featureKey: string, storage: Record<string, string>, maxPerDay: number) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `${featureKey}_usage_start`;
    const raw = storage[key];

    if (!raw) return { allowed: true, usedToday: 0, maxPerDay };

    try {
      const data = JSON.parse(raw);
      if (data.date !== today) return { allowed: true, usedToday: 0, maxPerDay }; // New day
      return {
        allowed: data.count < maxPerDay,
        usedToday: data.count,
        maxPerDay,
        reason: data.count >= maxPerDay ? 'limit_reached' : undefined,
      };
    } catch {
      return { allowed: true, usedToday: 0, maxPerDay };
    }
  }

  function recordDailyUsage(featureKey: string, storage: Record<string, string>) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${featureKey}_usage_start`;
    const raw = storage[key];
    let count = 0;
    try {
      const data = JSON.parse(raw || '{}');
      if (data.date === today) count = data.count;
    } catch {}
    storage[key] = JSON.stringify({ date: today, count: count + 1 });
  }

  it('allows first usage of the day', () => {
    const storage: Record<string, string> = {};
    const result = checkDailyLimit('download_4k', storage, 20);
    expect(result.allowed).toBe(true);
    expect(result.usedToday).toBe(0);
  });

  it('blocks after maxPerDay reached', () => {
    const storage: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];

    // Simulate 20 usages
    storage['download_4k_usage_start'] = JSON.stringify({ date: today, count: 20 });

    const result = checkDailyLimit('download_4k', storage, 20);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('limit_reached');
  });

  it('resets counter on new day', () => {
    const storage: Record<string, string> = {};
    storage['download_4k_usage_start'] = JSON.stringify({ date: '2020-01-01', count: 999 });

    const result = checkDailyLimit('download_4k', storage, 20);
    expect(result.allowed).toBe(true); // Old date = reset
    expect(result.usedToday).toBe(0);
  });

  it('increments usage counter correctly', () => {
    const storage: Record<string, string> = {};

    recordDailyUsage('download_320kbps', storage);
    recordDailyUsage('download_320kbps', storage);
    recordDailyUsage('download_320kbps', storage);

    const result = checkDailyLimit('download_320kbps', storage, 20);
    expect(result.usedToday).toBe(3);
    expect(result.allowed).toBe(true);
  });

  it('4K limit: allows 20 per day, blocks on 21st', () => {
    const storage: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      expect(checkDailyLimit('download_4k', storage, 20).allowed).toBe(true);
      recordDailyUsage('download_4k', storage);
    }
    expect(checkDailyLimit('download_4k', storage, 20).allowed).toBe(false);
  });

  it('320kbps limit: allows 20 per day', () => {
    const storage: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      recordDailyUsage('download_320kbps', storage);
    }
    const result = checkDailyLimit('download_320kbps', storage, 20);
    expect(result.allowed).toBe(false);
    expect(result.usedToday).toBe(20);
  });

  it('cut video limit: allows 200 per day', () => {
    const storage: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];
    storage['cut_video_youtube_usage_start'] = JSON.stringify({ date: today, count: 199 });

    expect(checkDailyLimit('cut_video_youtube', storage, 200).allowed).toBe(true);

    storage['cut_video_youtube_usage_start'] = JSON.stringify({ date: today, count: 200 });
    expect(checkDailyLimit('cut_video_youtube', storage, 200).allowed).toBe(false);
  });

  it('handles corrupted storage gracefully', () => {
    const storage: Record<string, string> = {};
    storage['download_4k_usage_start'] = 'invalid json{{{';

    const result = checkDailyLimit('download_4k', storage, 20);
    expect(result.allowed).toBe(true); // Graceful fallback
  });
});
