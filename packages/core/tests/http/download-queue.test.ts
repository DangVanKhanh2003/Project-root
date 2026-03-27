/**
 * Download Queue Tests
 *
 * Tests the concurrent download queue logic.
 * Re-implements DownloadQueue locally to test in core package.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==========================================
// Portable DownloadQueue (same as app's download-queue.ts)
// ==========================================

type DownloadFn = (signal: AbortSignal) => Promise<void>;

interface QueueEntry {
  id: string;
  downloadFn: DownloadFn;
  resolve: () => void;
  reject: (error: Error) => void;
}

interface RunningEntry {
  promise: Promise<void>;
  abortController: AbortController;
}

class DownloadQueue {
  private maxConcurrent: number;
  private running: Map<string, RunningEntry> = new Map();
  private pending: QueueEntry[] = [];

  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  add(id: string, downloadFn: DownloadFn): Promise<void> {
    if (this.running.has(id) || this.pending.some(e => e.id === id)) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      this.pending.push({ id, downloadFn, resolve, reject });
      this.processNext();
    });
  }

  cancel(id: string): void {
    const running = this.running.get(id);
    if (running) {
      running.abortController.abort();
      this.running.delete(id);
      this.processNext();
      return;
    }
    const idx = this.pending.findIndex(e => e.id === id);
    if (idx !== -1) {
      const entry = this.pending.splice(idx, 1)[0];
      entry.reject(new Error('Cancelled'));
    }
  }

  cancelAll(): void {
    for (const [, entry] of this.running) {
      entry.abortController.abort();
    }
    this.running.clear();
    const pending = [...this.pending];
    this.pending = [];
    for (const entry of pending) {
      entry.reject(new Error('Cancelled'));
    }
  }

  isQueued(id: string): boolean {
    return this.pending.some(e => e.id === id);
  }

  isRunning(id: string): boolean {
    return this.running.has(id);
  }

  setMaxConcurrent(n: number): void {
    this.maxConcurrent = n;
    this.processNext();
  }

  hasCapacity(): boolean {
    return this.running.size < this.maxConcurrent;
  }

  getStatus(): { running: number; pending: number } {
    return {
      running: this.running.size,
      pending: this.pending.length,
    };
  }

  private processNext(): void {
    while (this.running.size < this.maxConcurrent && this.pending.length > 0) {
      const entry = this.pending.shift()!;
      const abortController = new AbortController();
      const promise = entry.downloadFn(abortController.signal)
        .then(() => entry.resolve())
        .catch((error) => entry.reject(error))
        .finally(() => {
          this.running.delete(entry.id);
          this.processNext();
        });
      this.running.set(entry.id, { promise, abortController });
    }
  }
}

// ==========================================
// Tests
// ==========================================

describe('DownloadQueue', () => {
  let queue: DownloadQueue;

  beforeEach(() => {
    queue = new DownloadQueue(3); // Max 3 concurrent
  });

  describe('add', () => {
    it('starts download immediately when queue has capacity', async () => {
      const fn = vi.fn().mockResolvedValue(undefined);

      await queue.add('item1', fn);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes AbortSignal to download function', async () => {
      let receivedSignal: AbortSignal | null = null;
      const fn = vi.fn().mockImplementation((signal: AbortSignal) => {
        receivedSignal = signal;
        return Promise.resolve();
      });

      await queue.add('item1', fn);

      expect(receivedSignal).toBeDefined();
      expect(receivedSignal).toBeInstanceOf(AbortSignal);
    });

    it('skips duplicate IDs that are already running', async () => {
      let resolveFn: () => void;
      const longRunning = vi.fn().mockImplementation(() =>
        new Promise<void>(resolve => { resolveFn = resolve; })
      );
      const fn2 = vi.fn().mockResolvedValue(undefined);

      // Start a long-running download
      const promise1 = queue.add('item1', longRunning);

      // Try to add same ID again
      await queue.add('item1', fn2);

      // fn2 should NOT have been called
      expect(fn2).not.toHaveBeenCalled();

      // Clean up
      resolveFn!();
      await promise1;
    });

    it('skips duplicate IDs that are queued', async () => {
      const neverResolve = () => new Promise<void>(() => {});

      // Fill up capacity
      queue.add('a', neverResolve);
      queue.add('b', neverResolve);
      queue.add('c', neverResolve);

      // Queue a 4th item
      queue.add('d', neverResolve);

      // Try to add 'd' again
      const fn = vi.fn().mockResolvedValue(undefined);
      await queue.add('d', fn);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('concurrency', () => {
    it('respects maxConcurrent limit', () => {
      const neverResolve = () => new Promise<void>(() => {});

      queue.add('a', neverResolve);
      queue.add('b', neverResolve);
      queue.add('c', neverResolve);
      queue.add('d', neverResolve);
      queue.add('e', neverResolve);

      const status = queue.getStatus();
      expect(status.running).toBe(3);
      expect(status.pending).toBe(2);
    });

    it('starts pending items when running items complete', async () => {
      const order: string[] = [];
      let resolveA: () => void;

      const fnA = vi.fn().mockImplementation(() =>
        new Promise<void>(resolve => { resolveA = resolve; })
      );
      const fnB = vi.fn().mockImplementation(() => {
        order.push('b');
        return Promise.resolve();
      });
      const fnC = vi.fn().mockImplementation(() => {
        order.push('c');
        return Promise.resolve();
      });
      const fnD = vi.fn().mockImplementation(() => {
        order.push('d');
        return Promise.resolve();
      });

      // Queue with max 2
      const queue2 = new DownloadQueue(2);

      const promiseA = queue2.add('a', fnA);
      const promiseB = queue2.add('b', fnB);
      queue2.add('c', fnC);
      queue2.add('d', fnD);

      // A and B should be running, C and D pending
      expect(queue2.getStatus().running).toBe(2);
      expect(queue2.getStatus().pending).toBe(2);

      // Wait for B to complete
      await promiseB;

      // Now C should have started
      // A still running, C or D may be running
      expect(queue2.isRunning('a')).toBe(true);
    });

    it('processes in FIFO order', async () => {
      const order: string[] = [];
      const queue1 = new DownloadQueue(1);

      const makeTracker = (id: string) => () => {
        order.push(id);
        return Promise.resolve();
      };

      await Promise.all([
        queue1.add('first', makeTracker('first')),
        queue1.add('second', makeTracker('second')),
        queue1.add('third', makeTracker('third')),
      ]);

      expect(order).toEqual(['first', 'second', 'third']);
    });
  });

  describe('cancel', () => {
    it('aborts running download', () => {
      let receivedSignal: AbortSignal | null = null;
      const fn = vi.fn().mockImplementation((signal: AbortSignal) => {
        receivedSignal = signal;
        return new Promise<void>(() => {}); // Never resolves
      });

      queue.add('item1', fn);
      queue.cancel('item1');

      expect(receivedSignal!.aborted).toBe(true);
      expect(queue.isRunning('item1')).toBe(false);
    });

    it('removes pending item and rejects its promise', async () => {
      const neverResolve = () => new Promise<void>(() => {});

      // Fill capacity
      queue.add('a', neverResolve);
      queue.add('b', neverResolve);
      queue.add('c', neverResolve);

      // Queue a pending item
      const promise = queue.add('d', neverResolve);

      expect(queue.isQueued('d')).toBe(true);

      queue.cancel('d');

      expect(queue.isQueued('d')).toBe(false);
      await expect(promise).rejects.toThrow('Cancelled');
    });

    it('is a no-op for unknown ID', () => {
      expect(() => queue.cancel('unknown')).not.toThrow();
    });
  });

  describe('cancelAll', () => {
    it('aborts all running and rejects all pending', async () => {
      const signals: AbortSignal[] = [];
      const fn = vi.fn().mockImplementation((signal: AbortSignal) => {
        signals.push(signal);
        return new Promise<void>(() => {});
      });

      queue.add('a', fn);
      queue.add('b', fn);
      queue.add('c', fn);
      const promiseD = queue.add('d', fn);

      queue.cancelAll();

      // All running signals should be aborted
      signals.forEach(s => expect(s.aborted).toBe(true));

      // Pending should be rejected
      await expect(promiseD).rejects.toThrow('Cancelled');

      // Queue should be empty
      expect(queue.getStatus()).toEqual({ running: 0, pending: 0 });
    });
  });

  describe('status queries', () => {
    it('isQueued returns true for pending items', () => {
      const neverResolve = () => new Promise<void>(() => {});
      queue.add('a', neverResolve);
      queue.add('b', neverResolve);
      queue.add('c', neverResolve);
      queue.add('d', neverResolve); // This will be pending

      expect(queue.isQueued('d')).toBe(true);
      expect(queue.isQueued('a')).toBe(false); // Running, not queued
    });

    it('isRunning returns true for active items', () => {
      const neverResolve = () => new Promise<void>(() => {});
      queue.add('a', neverResolve);

      expect(queue.isRunning('a')).toBe(true);
      expect(queue.isRunning('nonexistent')).toBe(false);
    });

    it('hasCapacity returns true when below limit', () => {
      expect(queue.hasCapacity()).toBe(true);

      const neverResolve = () => new Promise<void>(() => {});
      queue.add('a', neverResolve);
      queue.add('b', neverResolve);
      expect(queue.hasCapacity()).toBe(true);

      queue.add('c', neverResolve);
      expect(queue.hasCapacity()).toBe(false);
    });

    it('getStatus returns correct counts', () => {
      const neverResolve = () => new Promise<void>(() => {});
      queue.add('a', neverResolve);
      queue.add('b', neverResolve);
      queue.add('c', neverResolve);
      queue.add('d', neverResolve);

      expect(queue.getStatus()).toEqual({ running: 3, pending: 1 });
    });
  });

  describe('setMaxConcurrent', () => {
    it('starts pending items when limit increases', () => {
      const queue1 = new DownloadQueue(1);
      const neverResolve = () => new Promise<void>(() => {});

      queue1.add('a', neverResolve);
      queue1.add('b', neverResolve);
      queue1.add('c', neverResolve);

      expect(queue1.getStatus()).toEqual({ running: 1, pending: 2 });

      queue1.setMaxConcurrent(3);

      expect(queue1.getStatus()).toEqual({ running: 3, pending: 0 });
    });
  });

  describe('default constructor', () => {
    it('defaults to maxConcurrent = 5', () => {
      const defaultQueue = new DownloadQueue();
      const neverResolve = () => new Promise<void>(() => {});

      for (let i = 0; i < 6; i++) {
        defaultQueue.add(`item${i}`, neverResolve);
      }

      expect(defaultQueue.getStatus()).toEqual({ running: 5, pending: 1 });
    });
  });
});
