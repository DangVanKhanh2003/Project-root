/**
 * API Logger Module - Wrapper for Web Worker
 * Provides non-blocking API logging using IndexedDB via Web Worker
 */

export interface ApiLogEntry {
    type: 'success' | 'error';
    endpoint: string;
    requestData?: any;
    responseData?: any;
    errorData?: any;
    [key: string]: any;
}

class ApiLogger {
    private worker: Worker | null = null;
    private ready: boolean = false;
    private messageId: number = 0;
    private pendingMessages: Map<number, { resolve: (val?: any) => void; reject: (err: Error) => void }> = new Map();
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize worker (lazy loading)
     */
    async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            try {
                // Create worker
                this.worker = new Worker('/api-logger.worker.js');

                // Handle messages from worker
                this.worker.onmessage = (event: MessageEvent) => {
                    const { type, id, result, error, success } = event.data;

                    if (type === 'ready') {
                        this.ready = true;
                        console.log('✅ API Logger Worker ready');
                        resolve();
                        return;
                    }

                    if (type === 'response' && id !== undefined) {
                        const pending = this.pendingMessages.get(id);
                        if (pending) {
                            if (success) {
                                pending.resolve(result);
                            } else {
                                pending.reject(new Error(error));
                            }
                            this.pendingMessages.delete(id);
                        }
                    }
                };

                // Handle worker errors
                this.worker.onerror = (error: ErrorEvent) => {
                    console.error('❌ API Logger Worker error:', error);
                    this.ready = false;
                    reject(error);
                };

            } catch (error) {
                console.error('❌ Failed to create API Logger Worker:', error);
                // Fallback to no-op if worker fails
                this.ready = false;
                reject(error);
            }
        });

        return this.initPromise;
    }

    /**
     * Send message to worker
     */
    async sendMessage(type: string, data?: any): Promise<any> {
        // Ensure worker is initialized
        if (!this.ready) {
            await this.init().catch(() => {
                // Silent fail - logging should never break the app
                console.warn('⚠️ API Logger not available, skipping:', type);
            });
        }

        if (!this.worker || !this.ready) {
            return null; // Worker not available
        }

        return new Promise((resolve, reject) => {
            const id = this.messageId++;

            // Store promise handlers
            this.pendingMessages.set(id, { resolve, reject });

            // Send message to worker
            this.worker?.postMessage({ type, data, id });

            // Timeout after 5 seconds
            setTimeout(() => {
                if (this.pendingMessages.has(id)) {
                    this.pendingMessages.delete(id);
                    reject(new Error('Worker message timeout'));
                }
            }, 5000);
        });
    }

    /**
     * Sanitize data for Web Worker (structured clone algorithm safe)
     */
    sanitizeLogData(data: any, depth = 0): any {
        // Max depth to prevent recursion hang
        if (depth > 5) return '[Max Depth Reached]';

        if (data === null || data === undefined) return data;

        // Primitive types
        if (typeof data !== 'object') {
            if (typeof data === 'function') return '[Function]';
            if (typeof data === 'symbol') return '[Symbol]';
            return data;
        }

        // Handle Error objects
        if (data instanceof Error) {
            return {
                name: data.name,
                message: data.message,
                stack: data.stack,
                code: (data as any).code,
                // Copy other properties
                ...Object.getOwnPropertyNames(data).reduce((acc: any, key: string) => {
                    if (!['name', 'message', 'stack'].includes(key)) {
                        acc[key] = this.sanitizeLogData((data as any)[key], depth + 1);
                    }
                    return acc;
                }, {})
            };
        }

        // Handle Response/Request objects (not cloneable)
        if (typeof Response !== 'undefined' && data instanceof Response) {
            return {
                type: 'Response',
                status: data.status,
                statusText: data.statusText,
                url: data.url,
                ok: data.ok,
                redirected: data.redirected
            };
        }

        if (typeof Request !== 'undefined' && data instanceof Request) {
            return {
                type: 'Request',
                method: data.method,
                url: data.url,
                mode: data.mode,
                credentials: data.credentials
            };
        }

        // Handle Array
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeLogData(item, depth + 1));
        }

        // Handle distinct Objects
        const sanitized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                // Skip large data fields if needed, or just sanitize
                sanitized[key] = this.sanitizeLogData(data[key], depth + 1);
            }
        }
        return sanitized;
    }

    /**
     * Determine tool string from pathname
     */
    private getToolFromUrl(pathname: string): string {
        if (pathname.includes('/youtube-multi-downloader')) return 'multiple';
        if (pathname.includes('/download-mp3-youtube-playlist')) return 'playlist';
        if (pathname.includes('/youtube-cut-video')) return 'cut-video';
        return 'single';
    }

    /**
     * Log API call
     */
    async log(logData: ApiLogEntry): Promise<void> {
        try {
            // Add metadata
            const rawData = {
                ...logData,
                tool: this.getToolFromUrl(window.location.pathname),
                timestamp: Date.now(),
                pageUrl: window.location.href,
                userAgent: navigator.userAgent
            };

            // Sanitize before sending to worker
            const enrichedData = this.sanitizeLogData(rawData);

            // Fire and forget - don't await
            this.sendMessage('log', enrichedData).catch(err => {
                console.warn('⚠️ Failed to log API call:', err);
            });

        } catch (error) {
            // Silent fail - logging should never break the app
            console.warn('⚠️ API logging failed:', error);
        }
    }

    /**
     * Get logs for feedback system
     */
    async getLogsForFeedback(): Promise<any[]> {
        try {
            const result = await this.sendMessage('get-for-feedback');
            return result?.logs || [];
        } catch (error) {
            console.warn('⚠️ Failed to get logs for feedback:', error);
            return [];
        }
    }

    /**
     * Get recent logs
     */
    async getLogs(limit = 100): Promise<any[]> {
        try {
            const result = await this.sendMessage('get-logs', { limit });
            return result?.logs || [];
        } catch (error) {
            console.warn('⚠️ Failed to get logs:', error);
            return [];
        }
    }

    /**
     * Get count of successful API calls
     */
    async getCountSuccess(): Promise<number> {
        try {
            const result = await this.sendMessage('count-success');
            return result?.count || 0;
        } catch (error) {
            console.warn('⚠️ Failed to get success count:', error);
            return 0;
        }
    }

    /**
     * Clear all logs
     */
    async clearLogs(): Promise<void> {
        try {
            await this.sendMessage('clear');
            console.log('✅ API logs cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear logs:', error);
        }
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<any> {
        try {
            const result = await this.sendMessage('stats');
            return result?.stats || {};
        } catch (error) {
            console.warn('⚠️ Failed to get stats:', error);
            return {};
        }
    }

    /**
     * Terminate worker
     */
    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.ready = false;
            console.log('🛑 API Logger Worker terminated');
        }
    }
}

// Export singleton instance
export const apiLogger = new ApiLogger();

// Initialize on first import (lazy)
if (typeof window !== 'undefined') {
    // Only init when actually used
    // Worker will be created on first log() call
}
