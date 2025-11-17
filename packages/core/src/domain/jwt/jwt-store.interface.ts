/**
 * JWT Store Interface
 * Abstraction for JWT storage (localStorage, Redux, memory, etc.)
 */

/**
 * Helper: Create namespaced localStorage key
 * Prevents collisions when multiple apps use same domain
 *
 * @param namespace - App/site namespace (e.g., 'myapp', 'project1')
 * @param purpose - Purpose identifier (e.g., 'downloader', 'auth')
 * @returns Namespaced key (e.g., 'myapp_downloader_jwt')
 *
 * @example
 * const key = createNamespacedKey('myapp', 'downloader');
 * const store = new LocalStorageJwtStore(key);
 * // localStorage key: 'myapp_downloader_jwt'
 */
export function createNamespacedKey(namespace: string, purpose: string = 'core'): string {
  if (!namespace || namespace.trim().length === 0) {
    throw new Error('Namespace is required for createNamespacedKey');
  }

  // Sanitize namespace and purpose (allow only alphanumeric and underscore)
  const cleanNamespace = namespace.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanPurpose = purpose.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  return `${cleanNamespace}_${cleanPurpose}_jwt`;
}

/**
 * JWT Store Interface
 * Allows different storage implementations
 */
export interface IJwtStore {
  /**
   * Save JWT token
   * @param jwt - JWT token to save
   */
  save(jwt: string): void;

  /**
   * Get current JWT token
   * @returns JWT token or null if not set
   */
  get(): string | null;

  /**
   * Clear JWT token
   */
  clear(): void;

  /**
   * Check if JWT exists
   * @returns true if JWT is set
   */
  has(): boolean;
}

/**
 * In-Memory JWT Store
 * Simple in-memory storage (lost on page reload)
 */
export class InMemoryJwtStore implements IJwtStore {
  private jwt: string | null = null;

  save(jwt: string): void {
    this.jwt = jwt;
  }

  get(): string | null {
    return this.jwt;
  }

  clear(): void {
    this.jwt = null;
  }

  has(): boolean {
    return this.jwt !== null;
  }
}

/**
 * LocalStorage JWT Store
 * Persistent storage using browser localStorage
 * Only available in browser environment
 *
 * IMPORTANT: Multiple apps on same domain will share localStorage!
 * Use unique key with namespace to avoid collisions.
 *
 * @example
 * // Good - with namespace
 * new LocalStorageJwtStore('myapp_downloader_jwt')
 *
 * // Better - use createNamespacedKey helper
 * new LocalStorageJwtStore(createNamespacedKey('myapp', 'downloader'))
 */
export class LocalStorageJwtStore implements IJwtStore {
  private readonly key: string;

  /**
   * @param key - Unique key for localStorage (REQUIRED for safety)
   */
  constructor(key: string) {
    if (!key || key.trim().length === 0) {
      throw new Error('LocalStorageJwtStore: key is required to prevent collisions');
    }
    this.key = key;
  }

  save(jwt: string): void {
    console.log('💾 [LocalStorageJwtStore.save] Key:', this.key);
    console.log('💾 [LocalStorageJwtStore.save] JWT:', jwt.substring(0, 30) + '...');
    console.log('💾 [LocalStorageJwtStore.save] localStorage available:', typeof localStorage !== 'undefined');

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.key, jwt);
      console.log('💾 [LocalStorageJwtStore.save] JWT saved to localStorage');
      console.log('💾 [LocalStorageJwtStore.save] Verify saved:', localStorage.getItem(this.key)?.substring(0, 30) + '...');
    } else {
      console.error('💾 [LocalStorageJwtStore.save] localStorage not available!');
    }
  }

  get(): string | null {
    const jwt = typeof localStorage !== 'undefined' ? localStorage.getItem(this.key) : null;
    console.log('💾 [LocalStorageJwtStore.get] Key:', this.key);
    console.log('💾 [LocalStorageJwtStore.get] JWT:', jwt ? jwt.substring(0, 30) + '...' : 'null');
    return jwt;
  }

  clear(): void {
    console.log('💾 [LocalStorageJwtStore.clear] Key:', this.key);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.key);
      console.log('💾 [LocalStorageJwtStore.clear] JWT cleared from localStorage');
    }
  }

  has(): boolean {
    return this.get() !== null;
  }
}

/**
 * Custom JWT Store
 * Allows custom get/set logic via callbacks
 */
export class CustomJwtStore implements IJwtStore {
  constructor(
    private readonly getter: () => string | null,
    private readonly setter: (jwt: string) => void,
    private readonly clearer: () => void
  ) {}

  save(jwt: string): void {
    this.setter(jwt);
  }

  get(): string | null {
    return this.getter();
  }

  clear(): void {
    this.clearer();
  }

  has(): boolean {
    return this.get() !== null;
  }
}
