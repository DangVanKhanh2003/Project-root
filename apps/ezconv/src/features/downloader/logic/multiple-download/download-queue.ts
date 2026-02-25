
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

export class DownloadQueue {
    private maxConcurrent: number;
    private running: Map<string, RunningEntry> = new Map();
    private pending: QueueEntry[] = [];

    constructor(maxConcurrent = 5) {
        this.maxConcurrent = maxConcurrent;
    }

    add(id: string, downloadFn: DownloadFn): Promise<void> {
        // If already running or queued, skip
        if (this.running.has(id) || this.pending.some(e => e.id === id)) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            this.pending.push({ id, downloadFn, resolve, reject });
            this.processNext();
        });
    }

    cancel(id: string): void {
        // Cancel if running
        const running = this.running.get(id);
        if (running) {
            running.abortController.abort();
            this.running.delete(id);
            this.processNext();
            return;
        }

        // Remove from pending
        const idx = this.pending.findIndex(e => e.id === id);
        if (idx !== -1) {
            const entry = this.pending.splice(idx, 1)[0];
            entry.reject(new Error('Cancelled'));
        }
    }

    cancelAll(): void {
        // Cancel all running
        for (const [id, entry] of this.running) {
            entry.abortController.abort();
        }
        this.running.clear();

        // Reject all pending
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
                .then(() => {
                    entry.resolve();
                })
                .catch((error) => {
                    entry.reject(error);
                })
                .finally(() => {
                    this.running.delete(entry.id);
                    this.processNext();
                });

            this.running.set(entry.id, { promise, abortController });
        }
    }
}
