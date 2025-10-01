/**
 * Tests for cache utility
 * These tests define the contract for in-memory caching functionality
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Cache } from "./cache.ts";

Deno.test("cache", async (t) => {
  await t.step("Cache - should store and retrieve values", () => {
    const cache = new Cache<string>();

    cache.set("key1", "value1");
    const result = cache.get("key1");

    assertEquals(result, "value1", "Should retrieve stored value");
  });

  await t.step("Cache - should return undefined for missing keys", () => {
    const cache = new Cache<string>();

    const result = cache.get("nonexistent");

    assertEquals(result, undefined, "Missing key should return undefined");
  });

  await t.step("Cache - should overwrite existing keys", () => {
    const cache = new Cache<string>();

    cache.set("key1", "value1");
    cache.set("key1", "value2");
    const result = cache.get("key1");

    assertEquals(result, "value2", "Should overwrite existing value");
  });

  await t.step("Cache - should support different value types", () => {
    const cache = new Cache<{ name: string; count: number }>();

    const obj = { name: "test", count: 42 };
    cache.set("obj", obj);
    const result = cache.get("obj");

    assertEquals(result, obj, "Should store and retrieve objects");
  });

  await t.step("Cache - should check if key exists", () => {
    const cache = new Cache<string>();

    cache.set("key1", "value1");

    assertEquals(cache.has("key1"), true, "Should detect existing key");
    assertEquals(cache.has("key2"), false, "Should detect missing key");
  });

  await t.step("Cache - should delete keys", () => {
    const cache = new Cache<string>();

    cache.set("key1", "value1");
    cache.delete("key1");

    assertEquals(cache.has("key1"), false, "Key should be deleted");
    assertEquals(cache.get("key1"), undefined, "Deleted key should return undefined");
  });

  await t.step("Cache - should clear all entries", () => {
    const cache = new Cache<string>();

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();

    assertEquals(cache.has("key1"), false, "All keys should be cleared");
    assertEquals(cache.has("key2"), false, "All keys should be cleared");
    assertEquals(cache.size, 0, "Size should be 0 after clear");
  });

  await t.step("Cache - should track size", () => {
    const cache = new Cache<string>();

    assertEquals(cache.size, 0, "Initial size should be 0");

    cache.set("key1", "value1");
    assertEquals(cache.size, 1, "Size should increase");

    cache.set("key2", "value2");
    assertEquals(cache.size, 2, "Size should increase");

    cache.delete("key1");
    assertEquals(cache.size, 1, "Size should decrease after delete");
  });

  await t.step("Cache - should support TTL expiration", async () => {
    const cache = new Cache<string>({ ttl: 100 }); // 100ms TTL

    cache.set("key1", "value1");
    assertEquals(cache.get("key1"), "value1", "Value should exist immediately");

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    assertEquals(cache.get("key1"), undefined, "Value should expire after TTL");
    assertEquals(cache.has("key1"), false, "Expired key should not exist");
  });

  await t.step("Cache - should not expire without TTL", async () => {
    const cache = new Cache<string>(); // No TTL

    cache.set("key1", "value1");

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 150));

    assertEquals(cache.get("key1"), "value1", "Value should not expire without TTL");
  });

  await t.step("Cache - should respect per-entry TTL", async () => {
    const cache = new Cache<string>({ ttl: 200 }); // Default 200ms

    cache.set("key1", "value1", 50); // Override with 50ms
    cache.set("key2", "value2"); // Use default 200ms

    // Wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(cache.get("key1"), undefined, "Short TTL value should expire");
    assertEquals(cache.get("key2"), "value2", "Long TTL value should still exist");
  });

  await t.step("Cache - should support LRU eviction with maxSize", () => {
    const cache = new Cache<string>({ maxSize: 3 });

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");

    assertEquals(cache.size, 3, "Should have 3 entries");

    // Adding 4th entry should evict oldest (key1)
    cache.set("key4", "value4");

    assertEquals(cache.size, 3, "Should still have 3 entries");
    assertEquals(cache.has("key1"), false, "Oldest entry should be evicted");
    assertEquals(cache.has("key2"), true, "Recent entries should remain");
    assertEquals(cache.has("key3"), true, "Recent entries should remain");
    assertEquals(cache.has("key4"), true, "New entry should exist");
  });

  await t.step("Cache - should update LRU order on get", () => {
    const cache = new Cache<string>({ maxSize: 3 });

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");

    // Access key1 to make it recently used
    cache.get("key1");

    // Adding 4th entry should now evict key2 (not key1)
    cache.set("key4", "value4");

    assertEquals(cache.has("key1"), true, "Recently accessed should remain");
    assertEquals(cache.has("key2"), false, "Least recently used should be evicted");
    assertEquals(cache.has("key3"), true, "Recent entries should remain");
    assertEquals(cache.has("key4"), true, "New entry should exist");
  });

  await t.step("Cache - should get all keys", () => {
    const cache = new Cache<string>();

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");

    const keys = cache.keys();

    assertEquals(keys.length, 3, "Should return all keys");
    assertEquals(keys.includes("key1"), true, "Should include key1");
    assertEquals(keys.includes("key2"), true, "Should include key2");
    assertEquals(keys.includes("key3"), true, "Should include key3");
  });

  await t.step("Cache - should not include expired keys in keys()", async () => {
    const cache = new Cache<string>({ ttl: 50 });

    cache.set("key1", "value1");
    cache.set("key2", "value2", 200); // Longer TTL

    // Wait for key1 to expire
    await new Promise(resolve => setTimeout(resolve, 100));

    const keys = cache.keys();

    assertEquals(keys.length, 1, "Should only return non-expired keys");
    assertEquals(keys.includes("key2"), true, "Should include non-expired key");
  });
});