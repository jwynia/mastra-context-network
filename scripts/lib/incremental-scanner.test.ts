/**
 * Tests for incremental scanner
 * Tests the logic for determining which files need rescanning
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { IncrementalScanner, type FileHashRecord } from "./incremental-scanner.ts";

Deno.test("IncrementalScanner", async (t) => {
  await t.step("detectChanges - should detect new files", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
      "file3.ts": "hash3", // New file
    };

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 1, "Should detect 1 new file");
    assertEquals(changes.added[0], "file3.ts", "Should identify new file");
    assertEquals(changes.modified.length, 0, "Should have no modified files");
    assertEquals(changes.deleted.length, 0, "Should have no deleted files");
  });

  await t.step("detectChanges - should detect modified files", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2-modified", // Changed hash
    };

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 0);
    assertEquals(changes.modified.length, 1, "Should detect 1 modified file");
    assertEquals(changes.modified[0], "file2.ts", "Should identify modified file");
    assertEquals(changes.deleted.length, 0);
  });

  await t.step("detectChanges - should detect deleted files", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
      "file3.ts": "hash3",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
      // file3.ts removed
    };

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 0);
    assertEquals(changes.modified.length, 0);
    assertEquals(changes.deleted.length, 1, "Should detect 1 deleted file");
    assertEquals(changes.deleted[0], "file3.ts", "Should identify deleted file");
  });

  await t.step("detectChanges - should detect multiple change types", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
      "file3.ts": "hash3",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1", // Unchanged
      "file2.ts": "hash2-modified", // Modified
      "file4.ts": "hash4", // Added
      // file3.ts deleted
    };

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 1);
    assertEquals(changes.added[0], "file4.ts");
    assertEquals(changes.modified.length, 1);
    assertEquals(changes.modified[0], "file2.ts");
    assertEquals(changes.deleted.length, 1);
    assertEquals(changes.deleted[0], "file3.ts");
  });

  await t.step("detectChanges - should handle empty previous state", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {};

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 2, "All files should be considered new");
    assertEquals(changes.modified.length, 0);
    assertEquals(changes.deleted.length, 0);
  });

  await t.step("detectChanges - should handle empty current state", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const current: FileHashRecord = {};

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 0);
    assertEquals(changes.modified.length, 0);
    assertEquals(changes.deleted.length, 2, "All files should be considered deleted");
  });

  await t.step("detectChanges - should handle no changes", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const changes = scanner.detectChanges(previous, current);

    assertEquals(changes.added.length, 0);
    assertEquals(changes.modified.length, 0);
    assertEquals(changes.deleted.length, 0);
  });

  await t.step("needsRescan - should identify files that need rescanning", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2-modified",
      "file3.ts": "hash3",
    };

    const filesToRescan = scanner.needsRescan(previous, current);

    assertEquals(filesToRescan.length, 2, "Should have 2 files to rescan");
    assertEquals(filesToRescan.includes("file2.ts"), true, "Should include modified file");
    assertEquals(filesToRescan.includes("file3.ts"), true, "Should include new file");
    assertEquals(filesToRescan.includes("file1.ts"), false, "Should not include unchanged file");
  });

  await t.step("needsRescan - should return all files on first scan", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {};

    const current: FileHashRecord = {
      "file1.ts": "hash1",
      "file2.ts": "hash2",
    };

    const filesToRescan = scanner.needsRescan(previous, current);

    assertEquals(filesToRescan.length, 2, "Should rescan all files on first scan");
  });

  await t.step("needsRescan - should return empty array if no changes", () => {
    const scanner = new IncrementalScanner();

    const previous: FileHashRecord = {
      "file1.ts": "hash1",
    };

    const current: FileHashRecord = {
      "file1.ts": "hash1",
    };

    const filesToRescan = scanner.needsRescan(previous, current);

    assertEquals(filesToRescan.length, 0, "Should not rescan if no changes");
  });
});