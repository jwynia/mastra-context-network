/**
 * In-memory cache utility with TTL and LRU eviction
 * Provides caching for query results and expensive computations
 */

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

interface CacheOptions {
  /** Time-to-live in milliseconds (optional) */
  ttl?: number;
  /** Maximum number of entries (triggers LRU eviction) */
  maxSize?: number;
}

/**
 * In-memory cache with TTL and LRU eviction support
 *
 * @example
 * ```ts
 * const cache = new Cache<string>({ ttl: 5000, maxSize: 100 });
 * cache.set("key", "value");
 * const value = cache.get("key"); // "value"
 * ```
 */
export class Cache<T> {
  private store: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  private accessOrder: string[]; // Track access order for LRU

  constructor(options: CacheOptions = {}) {
    this.store = new Map();
    this.options = options;
    this.accessOrder = [];
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Optional TTL override in milliseconds
   */
  set(key: string, value: T, ttl?: number): void {
    const effectiveTtl = ttl ?? this.options.ttl;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: effectiveTtl ? Date.now() + effectiveTtl : undefined,
    };

    // If key already exists, remove it from access order
    if (this.store.has(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }

    // Store entry
    this.store.set(key, entry);

    // Update access order (most recent at end)
    this.accessOrder.push(key);

    // Check if we need to evict (LRU)
    if (this.options.maxSize && this.store.size > this.options.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    // Update access order (move to end)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }

    return entry.value;
  }

  /**
   * Check if a key exists in the cache (and is not expired)
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.store.delete(key);

    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.store.clear();
    this.accessOrder = [];
  }

  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Get all keys in the cache (excluding expired entries)
   * @returns Array of cache keys
   */
  keys(): string[] {
    const keys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      // Skip expired entries
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.delete(key);
        continue;
      }

      keys.push(key);
    }

    return keys;
  }

  /**
   * Evict the oldest (least recently used) entry
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const oldestKey = this.accessOrder[0];
    this.delete(oldestKey);
  }
}