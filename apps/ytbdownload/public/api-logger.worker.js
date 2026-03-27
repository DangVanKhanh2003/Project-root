/**
 * API Logger Web Worker
 * Handles API logging in IndexedDB with non-blocking operations
 *
 * Features:
 * - Non-blocking IndexedDB operations
 * - Automatic cleanup (1000 entries max, 7 days retention)
 * - FIFO when exceeding max entries
 * - Efficient batch operations
 * - Used by feedback system
 */

class ApiLoggerDB {
  constructor() {
    this.dbName = 'ytbdownload_ApiLogsDB';
    this.storeName = 'logs';
    this.version = 1;
    this.maxEntries = 1000; // 10x more than sessionStorage
    this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days retention
    this.db = null;
    this.sessionCache = []; // In-memory cache for fast access
  }

  /**
   * Initialize IndexedDB connection
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[Worker] IndexedDB init failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Worker] IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if not exists
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for efficient queries
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('method', 'method', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('endpoint', 'endpoint', { unique: false });

          console.log('[Worker] Object store created with indexes');
        }
      };
    });
  }

  /**
   * Add log entry to database
   */
  async addLog(logData) {
    try {
      await this.init();

      // Add to session cache immediately
      this.sessionCache.push(logData);
      if (this.sessionCache.length > this.maxEntries) {
        this.sessionCache.shift(); // FIFO
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Add timestamp if not present
      if (!logData.timestamp) {
        logData.timestamp = Date.now();
      }

      const request = store.add(logData);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // Trigger cleanup after add (non-blocking)
          this.cleanupOldLogs().catch(err =>
            console.warn('[Worker] Cleanup failed:', err)
          );
          resolve(request.result);
        };

        request.onerror = () => {
          console.error('[Worker] Add log failed:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[Worker] Add log error:', error);
      throw error;
    }
  }

  /**
   * Clean up old logs (time-based and count-based)
   */
  async cleanupOldLogs() {
    try {
      await this.init();

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const timestampIndex = store.index('timestamp');

      // Step 1: Delete logs older than maxAge
      const cutoffTime = Date.now() - this.maxAge;
      const oldLogsRange = IDBKeyRange.upperBound(cutoffTime);

      const deleteOldRequest = timestampIndex.openCursor(oldLogsRange);
      let deletedCount = 0;

      deleteOldRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else if (deletedCount > 0) {
          console.log(`[Worker] Deleted ${deletedCount} old logs`);
        }
      };

      // Step 2: Keep only last maxEntries if exceeding limit
      const countRequest = store.count();

      return new Promise((resolve) => {
        countRequest.onsuccess = async () => {
          const count = countRequest.result;

          if (count > this.maxEntries) {
            const toDelete = count - this.maxEntries;
            const getAllRequest = store.getAllKeys(null, toDelete);

            getAllRequest.onsuccess = () => {
              const keysToDelete = getAllRequest.result;
              keysToDelete.forEach(key => store.delete(key));
              console.log(`[Worker] Deleted ${toDelete} excess logs (FIFO)`);
              resolve();
            };
          } else {
            resolve();
          }
        };
      });
    } catch (error) {
      console.error('[Worker] Cleanup error:', error);
    }
  }

  /**
   * Get logs for feedback system
   */
  async getLogs(limit = 100) {
    try {
      // First try session cache (faster)
      if (this.sessionCache.length > 0) {
        return this.sessionCache.slice(-limit);
      }

      // Fallback to IndexedDB
      await this.init();

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const timestampIndex = store.index('timestamp');

      // Get latest logs
      const request = timestampIndex.openCursor(null, 'prev');
      const logs = [];
      let count = 0;

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && count < limit) {
            logs.push(cursor.value);
            count++;
            cursor.continue();
          } else {
            // Update session cache
            this.sessionCache = logs.slice(0, 100);
            resolve(logs);
          }
        };

        request.onerror = () => {
          console.error('[Worker] Get logs failed:', request.error);
          resolve([]);
        };
      });
    } catch (error) {
      console.error('[Worker] Get logs error:', error);
      return [];
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    try {
      await this.init();

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      store.clear();
      this.sessionCache = [];

      console.log('[Worker] All logs cleared');
    } catch (error) {
      console.error('[Worker] Clear logs error:', error);
    }
  }

  /**
   * Count successful API calls
   */
  async countSuccess() {
    try {
      await this.init();

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const typeIndex = store.index('type');
      const countRequest = typeIndex.count(IDBKeyRange.only('success'));

      return new Promise((resolve) => {
        countRequest.onsuccess = () => {
          resolve(countRequest.result);
        };

        countRequest.onerror = () => {
          console.error('[Worker] Count success failed:', countRequest.error);
          resolve(0);
        };
      });
    } catch (error) {
      console.error('[Worker] Count success error:', error);
      return 0;
    }
  }

  /**
   * Get database stats
   */
  async getStats() {
    try {
      await this.init();

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const countRequest = store.count();

      return new Promise((resolve) => {
        countRequest.onsuccess = () => {
          resolve({
            totalLogs: countRequest.result,
            cacheSize: this.sessionCache.length,
            maxEntries: this.maxEntries,
            maxAge: this.maxAge,
            dbName: this.dbName
          });
        };

        countRequest.onerror = () => {
          resolve({
            totalLogs: 0,
            error: countRequest.error
          });
        };
      });
    } catch (error) {
      return {
        totalLogs: 0,
        error: error.message
      };
    }
  }
}

// Initialize logger instance
const logger = new ApiLoggerDB();

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, data, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'init':
        await logger.init();
        result = { success: true };
        break;

      case 'log':
        await logger.addLog(data);
        result = { success: true };
        break;

      case 'get-logs':
        const logs = await logger.getLogs(data?.limit || 100);
        result = { logs };
        break;

      case 'get-for-feedback':
        // Special case for feedback widget
        const feedbackLogs = await logger.getLogs(100);
        result = { logs: feedbackLogs };
        break;

      case 'clear':
        await logger.clearLogs();
        result = { success: true };
        break;

      case 'count-success':
        const count = await logger.countSuccess();
        result = { count };
        break;

      case 'stats':
        const stats = await logger.getStats();
        result = { stats };
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send response back to main thread
    self.postMessage({
      type: 'response',
      id,
      result,
      success: true
    });

  } catch (error) {
    console.error('[Worker] Error processing message:', error);

    // Send error response
    self.postMessage({
      type: 'response',
      id,
      error: error.message,
      success: false
    });
  }
};

// Initialize on worker start
logger.init().then(() => {
  console.log('[Worker] API Logger ready');
  self.postMessage({ type: 'ready' });
}).catch(err => {
  console.error('[Worker] Init failed:', err);
});