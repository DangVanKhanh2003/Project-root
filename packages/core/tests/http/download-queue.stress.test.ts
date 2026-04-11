/**
 * DownloadQueue — Stress Tests (Playlist / Multiple Download scenarios)
 *
 * Test queue với số lượng lớn items (playlist 30 items, channel 50 items),
 * cancel giữa chừng, thay đổi concurrency, mixed success/failure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Portable DownloadQueue (same as app)
type DownloadFn = (signal: AbortSignal) => Promise<void>;
interface QueueEntry { id: string; downloadFn: DownloadFn; resolve: () => void; reject: (e: Error) => void; }
interface RunningEntry { promise: Promise<void>; abortController: AbortController; }

class DownloadQueue {
  private maxConcurrent: number;
  private running = new Map<string, RunningEntry>();
  private pending: QueueEntry[] = [];
  constructor(maxConcurrent = 5) { this.maxConcurrent = maxConcurrent; }
  add(id: string, downloadFn: DownloadFn): Promise<void> {
    if (this.running.has(id) || this.pending.some(e => e.id === id)) return Promise.resolve();
    return new Promise<void>((resolve, reject) => { this.pending.push({ id, downloadFn, resolve, reject }); this.processNext(); });
  }
  cancel(id: string) {
    const r = this.running.get(id);
    if (r) { r.abortController.abort(); this.running.delete(id); this.processNext(); return; }
    const i = this.pending.findIndex(e => e.id === id);
    if (i !== -1) { const e = this.pending.splice(i, 1)[0]; e.reject(new Error('Cancelled')); }
  }
  cancelAll() {
    for (const [, e] of this.running) e.abortController.abort();
    this.running.clear();
    const p = [...this.pending]; this.pending = [];
    for (const e of p) e.reject(new Error('Cancelled'));
  }
  isQueued(id: string) { return this.pending.some(e => e.id === id); }
  isRunning(id: string) { return this.running.has(id); }
  setMaxConcurrent(n: number) { this.maxConcurrent = n; this.processNext(); }
  hasCapacity() { return this.running.size < this.maxConcurrent; }
  getStatus() { return { running: this.running.size, pending: this.pending.length }; }
  private processNext() {
    while (this.running.size < this.maxConcurrent && this.pending.length > 0) {
      const e = this.pending.shift()!;
      const ac = new AbortController();
      const p = e.downloadFn(ac.signal).then(() => e.resolve()).catch(err => e.reject(err)).finally(() => { this.running.delete(e.id); this.processNext(); });
      this.running.set(e.id, { promise: p, abortController: ac });
    }
  }
}

describe('DownloadQueue — Playlist & Multiple Download Stress', () => {

  // ==========================================
  // Playlist: 30 items, max 5 concurrent
  // ==========================================
  describe('Playlist download (30 items, concurrency=5)', () => {
    it('processes 30 items with max 5 concurrent', async () => {
      const queue = new DownloadQueue(5);
      const order: string[] = [];
      let maxConcurrent = 0;

      const promises = Array.from({ length: 30 }, (_, i) => {
        return queue.add(`video-${i}`, async () => {
          const current = queue.getStatus().running;
          maxConcurrent = Math.max(maxConcurrent, current);
          // Simulate download time
          await new Promise(r => setTimeout(r, 10));
          order.push(`video-${i}`);
        });
      });

      await Promise.all(promises);

      expect(order).toHaveLength(30);
      expect(maxConcurrent).toBeLessThanOrEqual(5);
    });

    it('handles 30 items where 5 fail (others succeed)', async () => {
      const queue = new DownloadQueue(5);
      const results: Array<{ id: string; status: 'ok' | 'fail' }> = [];

      const failIds = new Set([3, 7, 12, 18, 25]); // 5 items fail
      const promises = Array.from({ length: 30 }, (_, i) => {
        return queue.add(`video-${i}`, async () => {
          await new Promise(r => setTimeout(r, 5));
          if (failIds.has(i)) throw new Error(`Download ${i} failed`);
        }).then(
          () => results.push({ id: `video-${i}`, status: 'ok' }),
          () => results.push({ id: `video-${i}`, status: 'fail' }),
        );
      });

      await Promise.all(promises);

      expect(results).toHaveLength(30);
      expect(results.filter(r => r.status === 'ok')).toHaveLength(25);
      expect(results.filter(r => r.status === 'fail')).toHaveLength(5);
    });

    it('cancel mid-playlist stops remaining items', async () => {
      const queue = new DownloadQueue(3);
      const completed: string[] = [];
      let cancelledCount = 0;

      const promises = Array.from({ length: 20 }, (_, i) => {
        return queue.add(`video-${i}`, async (signal) => {
          await new Promise(r => setTimeout(r, 50));
          if (signal.aborted) throw new Error('Aborted');
          completed.push(`video-${i}`);
        }).catch(() => { cancelledCount++; });
      });

      // Cancel after some time
      await new Promise(r => setTimeout(r, 100));
      queue.cancelAll();

      await Promise.allSettled(promises);

      // Some completed, some cancelled
      expect(completed.length).toBeLessThan(20);
      expect(completed.length + cancelledCount).toBe(20);
    });
  });

  // ==========================================
  // Multiple URLs: 10 items, YouTube concurrency=5
  // ==========================================
  describe('Multiple URL download (10 items)', () => {
    it('processes 10 URLs with correct concurrency', async () => {
      const queue = new DownloadQueue(5);
      const order: string[] = [];

      const promises = Array.from({ length: 10 }, (_, i) =>
        queue.add(`url-${i}`, async () => {
          await new Promise(r => setTimeout(r, 10));
          order.push(`url-${i}`);
        })
      );

      await Promise.all(promises);

      expect(order).toHaveLength(10);
      // FIFO order (with concurrency, first 5 may complete in any order)
      expect(order[0]).toMatch(/^url-[0-4]$/);
    });

    it('skip duplicate URLs', async () => {
      const queue = new DownloadQueue(5);
      let callCount = 0;

      const fn = async () => { callCount++; await new Promise(r => setTimeout(r, 10)); };

      await Promise.all([
        queue.add('video-abc', fn),
        queue.add('video-abc', fn), // duplicate
        queue.add('video-abc', fn), // duplicate
        queue.add('video-def', fn),
      ]);

      expect(callCount).toBe(2); // Only abc + def
    });
  });

  // ==========================================
  // Channel: load more (pagination)
  // ==========================================
  describe('Channel download (pagination, 50 items across pages)', () => {
    it('processes items from multiple pages', async () => {
      const queue = new DownloadQueue(5);
      const allItems: string[] = [];

      // Simulate 3 pages of items
      const pages = [
        Array.from({ length: 20 }, (_, i) => `page1-item${i}`),
        Array.from({ length: 20 }, (_, i) => `page2-item${i}`),
        Array.from({ length: 10 }, (_, i) => `page3-item${i}`),
      ];

      for (const page of pages) {
        const promises = page.map(id =>
          queue.add(id, async () => {
            await new Promise(r => setTimeout(r, 5));
            allItems.push(id);
          })
        );
        await Promise.all(promises);
      }

      expect(allItems).toHaveLength(50);
    });
  });

  // ==========================================
  // Concurrency change mid-flight
  // ==========================================
  describe('Dynamic concurrency', () => {
    it('YouTube queue=5, other=10, switch dynamically', () => {
      const queue = new DownloadQueue(5); // YouTube default
      const neverResolve = () => new Promise<void>(() => {});

      // Fill YouTube queue
      for (let i = 0; i < 8; i++) queue.add(`yt-${i}`, neverResolve);
      expect(queue.getStatus()).toEqual({ running: 5, pending: 3 });

      // Switch to other links concurrency
      queue.setMaxConcurrent(10);
      expect(queue.getStatus()).toEqual({ running: 8, pending: 0 });
    });
  });

  // ==========================================
  // AbortSignal propagation
  // ==========================================
  describe('AbortSignal propagation to download fn', () => {
    it('all running downloads receive abort signal on cancelAll', () => {
      const queue = new DownloadQueue(5);
      const signals: AbortSignal[] = [];

      for (let i = 0; i < 5; i++) {
        queue.add(`item-${i}`, async (signal) => {
          signals.push(signal);
          await new Promise(() => {}); // never resolve
        });
      }

      queue.cancelAll();

      expect(signals).toHaveLength(5);
      signals.forEach(s => expect(s.aborted).toBe(true));
    });

    it('single cancel only aborts that specific download', () => {
      const queue = new DownloadQueue(5);
      const signals = new Map<string, AbortSignal>();

      for (let i = 0; i < 3; i++) {
        queue.add(`item-${i}`, async (signal) => {
          signals.set(`item-${i}`, signal);
          await new Promise(() => {});
        });
      }

      queue.cancel('item-1');

      expect(signals.get('item-0')!.aborted).toBe(false);
      expect(signals.get('item-1')!.aborted).toBe(true);
      expect(signals.get('item-2')!.aborted).toBe(false);
    });
  });
});
