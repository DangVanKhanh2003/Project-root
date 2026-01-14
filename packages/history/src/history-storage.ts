/**
 * History Storage Module
 * Handles all localStorage CRUD operations for history items
 */

import {
  type HistoryItem,
  type HistoryData,
  type HistoryDisplayConfig,
  DEFAULT_HISTORY_CONFIG
} from './types';

const STORAGE_VERSION = 1;

let config: HistoryDisplayConfig = { ...DEFAULT_HISTORY_CONFIG };

/**
 * Configure history storage
 */
export function configureStorage(customConfig: Partial<HistoryDisplayConfig>): void {
  config = { ...DEFAULT_HISTORY_CONFIG, ...customConfig };
}

/**
 * Get current storage configuration
 */
export function getStorageConfig(): HistoryDisplayConfig {
  return { ...config };
}

/**
 * Load history data from localStorage
 */
function loadFromStorage(): HistoryData {
  try {
    const raw = localStorage.getItem(config.storageKey);
    if (!raw) {
      return { items: [], version: STORAGE_VERSION };
    }

    const data = JSON.parse(raw) as HistoryData;

    // Migration: handle old format without version
    if (!data.version) {
      return { items: data.items || [], version: STORAGE_VERSION };
    }

    return data;
  } catch {
    console.warn('[History] Failed to load from localStorage');
    return { items: [], version: STORAGE_VERSION };
  }
}

/**
 * Save history data to localStorage
 */
function saveToStorage(data: HistoryData): void {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(data));
  } catch (e) {
    console.error('[History] Failed to save to localStorage:', e);
  }
}

/**
 * Get all history items
 */
export function getAllHistory(): HistoryItem[] {
  return loadFromStorage().items;
}

/**
 * Get history items with pagination
 * @param offset - Starting index
 * @param limit - Number of items to return
 */
export function getHistory(offset: number = 0, limit: number = config.initialCount): HistoryItem[] {
  const items = loadFromStorage().items;
  return items.slice(offset, offset + limit);
}

/**
 * Get total history count
 */
export function getHistoryCount(): number {
  return loadFromStorage().items.length;
}

/**
 * Check if there are more items to load
 */
export function hasMoreItems(currentCount: number): boolean {
  return currentCount < getHistoryCount();
}

/**
 * Add a new item to history (prepend)
 * @param item - History item to add
 * @returns The added item with generated ID
 */
export function addToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
  const data = loadFromStorage();

  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now()
  };

  // Prepend new item
  data.items.unshift(newItem);

  // Limit storage size
  if (data.items.length > config.maxStorageItems) {
    data.items = data.items.slice(0, config.maxStorageItems);
  }

  saveToStorage(data);

  return newItem;
}

/**
 * Remove a single item from history
 * @param id - Item ID to remove
 * @returns true if item was removed
 */
export function removeFromHistory(id: string): boolean {
  const data = loadFromStorage();
  const initialLength = data.items.length;

  data.items = data.items.filter(item => item.id !== id);

  if (data.items.length !== initialLength) {
    saveToStorage(data);
    return true;
  }

  return false;
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  saveToStorage({ items: [], version: STORAGE_VERSION });
}

/**
 * Get item by ID
 */
export function getHistoryItem(id: string): HistoryItem | undefined {
  return loadFromStorage().items.find(item => item.id === id);
}
