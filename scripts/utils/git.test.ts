/**
 * Tests for git utility
 * These tests define the contract for git operations
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCurrentSha, getFileStatus, isGitRepo, getGitRoot } from "./git.ts";

Deno.test("git", async (t) => {
  await t.step("isGitRepo - should detect if we're in a git repository", async () => {
    // We're running in a git repo (mastra-context-network)
    const inRepo = await isGitRepo();
    assertEquals(inRepo, true, "Should detect we are in a git repository");
  });

  await t.step("getCurrentSha - should return current commit SHA", async () => {
    const sha = await getCurrentSha();

    assertExists(sha, "SHA should exist");
    assertEquals(typeof sha, "string", "SHA should be a string");
    assertEquals(sha.length, 40, "SHA should be 40 characters (full SHA-1)");
    // SHA should be hexadecimal
    assertEquals(/^[0-9a-f]{40}$/.test(sha), true, "SHA should be valid hex");
  });

  await t.step("getGitRoot - should return git root directory", async () => {
    const root = await getGitRoot();

    assertExists(root, "Git root should exist");
    assertEquals(typeof root, "string", "Git root should be a string");
    assertEquals(root.endsWith("mastra-context-network"), true, "Should be in mastra-context-network");
  });

  await t.step("getFileStatus - should return status for a tracked file", async () => {
    // Test with a file we know exists and may have changes
    const status = await getFileStatus("deno.json");

    assertExists(status, "Status should exist");
    assertEquals(typeof status, "string", "Status should be a string");
    // Status should be one of: 'M', 'A', 'D', '??', '' (unchanged)
    assertEquals(
      ["M", "A", "D", "??", ""].includes(status),
      true,
      `Status should be valid git status, got: ${status}`
    );
  });

  await t.step("getFileStatus - should return '??' for untracked file", async () => {
    // Create a temporary untracked file
    const tempFile = "temp-untracked-test.txt";
    await Deno.writeTextFile(tempFile, "test");

    const status = await getFileStatus(tempFile);
    assertEquals(status, "??", "Untracked file should have '??' status");

    // Cleanup
    await Deno.remove(tempFile);
  });

  await t.step("getFileStatus - should return '' for non-existent file", async () => {
    const status = await getFileStatus("definitely-does-not-exist-xyz123.txt");
    assertEquals(status, "", "Non-existent file should return empty string");
  });
});