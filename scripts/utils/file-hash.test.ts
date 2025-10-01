/**
 * Tests for file-hash utility
 * These tests define the contract for file hashing functionality
 */

import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hashFile, hashFiles, hashString } from "./file-hash.ts";

Deno.test("file-hash", async (t) => {
  // Setup: Create test files
  const testDir = await Deno.makeTempDir();
  const testFile1 = `${testDir}/test1.txt`;
  const testFile2 = `${testDir}/test2.txt`;
  const testFile3 = `${testDir}/test3.txt`;

  await Deno.writeTextFile(testFile1, "Hello, World!");
  await Deno.writeTextFile(testFile2, "Different content");
  await Deno.writeTextFile(testFile3, "Hello, World!"); // Same as test1

  await t.step("hashString - should hash a string consistently", async () => {
    const hash1 = await hashString("test content");
    const hash2 = await hashString("test content");

    assertEquals(hash1, hash2, "Same content should produce same hash");
    assertExists(hash1, "Hash should exist");
    assertEquals(typeof hash1, "string", "Hash should be a string");
  });

  await t.step("hashString - should produce different hashes for different content", async () => {
    const hash1 = await hashString("content 1");
    const hash2 = await hashString("content 2");

    assertEquals(hash1 !== hash2, true, "Different content should produce different hashes");
  });

  await t.step("hashFile - should hash a file consistently", async () => {
    const hash1 = await hashFile(testFile1);
    const hash2 = await hashFile(testFile1);

    assertEquals(hash1, hash2, "Same file should produce same hash");
    assertExists(hash1, "Hash should exist");
  });

  await t.step("hashFile - should produce same hash for files with same content", async () => {
    const hash1 = await hashFile(testFile1);
    const hash3 = await hashFile(testFile3);

    assertEquals(hash1, hash3, "Files with identical content should have same hash");
  });

  await t.step("hashFile - should produce different hashes for different files", async () => {
    const hash1 = await hashFile(testFile1);
    const hash2 = await hashFile(testFile2);

    assertEquals(hash1 !== hash2, true, "Different files should produce different hashes");
  });

  await t.step("hashFile - should reject non-existent files", async () => {
    await assertRejects(
      async () => await hashFile(`${testDir}/nonexistent.txt`),
      Error,
      "not found"
    );
  });

  await t.step("hashFiles - should hash multiple files", async () => {
    const hashes = await hashFiles([testFile1, testFile2, testFile3]);

    assertEquals(Object.keys(hashes).length, 3, "Should return hashes for all files");
    assertExists(hashes[testFile1], "Should have hash for file 1");
    assertExists(hashes[testFile2], "Should have hash for file 2");
    assertExists(hashes[testFile3], "Should have hash for file 3");
  });

  await t.step("hashFiles - should handle empty array", async () => {
    const hashes = await hashFiles([]);

    assertEquals(Object.keys(hashes).length, 0, "Should return empty object for empty array");
  });

  await t.step("hashFiles - should skip non-existent files", async () => {
    const hashes = await hashFiles([testFile1, `${testDir}/nonexistent.txt`, testFile2]);

    assertEquals(Object.keys(hashes).length, 2, "Should only hash existing files");
    assertExists(hashes[testFile1], "Should have hash for file 1");
    assertExists(hashes[testFile2], "Should have hash for file 2");
  });

  await t.step("hashFiles - should return consistent results", async () => {
    const hashes1 = await hashFiles([testFile1, testFile2]);
    const hashes2 = await hashFiles([testFile1, testFile2]);

    assertEquals(hashes1[testFile1], hashes2[testFile1], "Same file should have consistent hash");
    assertEquals(hashes1[testFile2], hashes2[testFile2], "Same file should have consistent hash");
  });

  // Cleanup
  await Deno.remove(testDir, { recursive: true });
});