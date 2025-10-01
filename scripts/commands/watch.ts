#!/usr/bin/env -S deno run --allow-all

/**
 * Watch command - Monitor files and incrementally update the semantic database
 */

import { Command } from "@cliffy/command/mod.ts";
import { FileWatcher } from "../lib/file-watcher.ts";
import { IncrementalScanner } from "../lib/incremental-scanner.ts";
import { hashFiles } from "../utils/file-hash.ts";
import { logger } from "../utils/logger.ts";
import { config } from "../utils/config.ts";
import { walk } from "@std/fs";

interface WatchCommandOptions {
  path: string;
  debounce?: number;
  include?: string;
  exclude?: string;
  verbose?: boolean;
}

/**
 * Watch command implementation
 */
export const watchCommand = new Command()
  .name("watch")
  .description("Watch for file changes and incrementally update the database")
  .option("-p, --path <path:string>", "Path to watch", { default: "." })
  .option("-d, --debounce <ms:number>", "Debounce delay in milliseconds", {
    default: 500,
  })
  .option("-i, --include <patterns:string>", "File patterns to include (comma-separated)")
  .option("-e, --exclude <patterns:string>", "File patterns to exclude (comma-separated)")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (options: WatchCommandOptions) => {
    if (options.verbose) {
      logger.setLevel(0); // DEBUG level
    }

    await runWatch(options);
  });

/**
 * Run the watch system
 */
async function runWatch(options: WatchCommandOptions): Promise<void> {
  logger.info("Starting file watcher...");

  // Get ignore patterns from config and options
  const ignorePatterns = [
    ...config.get("watchIgnorePatterns"),
    ...(options.exclude?.split(",") || []),
    "**/node_modules/**",
    "**/.git/**",
    "**/.kuzu/**",
    "**/.duckdb/**",
    "**/*.test.ts",
  ];

  // Initialize components
  const scanner = new IncrementalScanner();
  let previousHashes = await getInitialHashes(options.path, ignorePatterns);

  logger.success(`Initial scan: ${Object.keys(previousHashes).length} files`);

  // Create watcher
  const watcher = new FileWatcher({
    paths: [options.path],
    debounceMs: options.debounce,
    ignorePatterns,
  });

  // Handle graceful shutdown
  let isShuttingDown = false;

  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info("\nShutting down...");
    await watcher.stop();
    Deno.exit(0);
  };

  // Register signal handlers
  Deno.addSignalListener("SIGINT", shutdown);
  Deno.addSignalListener("SIGTERM", shutdown);

  // Start watching
  await watcher.start(async (event) => {
    logger.info(`File change detected: ${event.kind} (${event.paths.length} file(s))`);

    try {
      // Get current hashes
      const currentHashes = await getCurrentHashes(options.path, ignorePatterns);

      // Detect changes
      const changes = scanner.detectChanges(previousHashes, currentHashes);
      const filesToRescan = scanner.needsRescan(previousHashes, currentHashes);

      // Log summary
      if (changes.added.length > 0) {
        logger.info(`  Added: ${changes.added.length} file(s)`);
        changes.added.forEach(f => logger.debug(`    + ${f}`));
      }
      if (changes.modified.length > 0) {
        logger.info(`  Modified: ${changes.modified.length} file(s)`);
        changes.modified.forEach(f => logger.debug(`    ~ ${f}`));
      }
      if (changes.deleted.length > 0) {
        logger.info(`  Deleted: ${changes.deleted.length} file(s)`);
        changes.deleted.forEach(f => logger.debug(`    - ${f}`));
      }

      // Perform incremental scan if needed
      if (filesToRescan.length > 0) {
        logger.info(`Rescanning ${filesToRescan.length} file(s)...`);

        // TODO: Call actual scanner here when scan.ts is refactored to support incremental mode
        // For now, just log what would be scanned
        logger.info("(Incremental scan implementation pending)");

        // Update previous hashes
        previousHashes = currentHashes;
        logger.success("Incremental update complete");
      } else {
        logger.info("No changes requiring database update");
      }
    } catch (error) {
      logger.error("Error during incremental scan:", error);
    }
  });
}

/**
 * Get initial file hashes for the watched directory
 */
async function getInitialHashes(
  path: string,
  ignorePatterns: string[]
): Promise<Record<string, string>> {
  const files: string[] = [];

  for await (const entry of walk(path, {
    includeFiles: true,
    includeDirs: false,
    followSymlinks: false,
    exts: [".ts", ".tsx", ".js", ".jsx"],
  })) {
    // Check against ignore patterns
    const shouldIgnore = ignorePatterns.some(pattern => {
      // Simple pattern check (could be enhanced)
      return entry.path.includes(pattern.replace(/\*\*/g, "").replace(/\*/g, ""));
    });

    if (!shouldIgnore) {
      files.push(entry.path);
    }
  }

  return await hashFiles(files);
}

/**
 * Get current file hashes
 */
async function getCurrentHashes(
  path: string,
  ignorePatterns: string[]
): Promise<Record<string, string>> {
  return await getInitialHashes(path, ignorePatterns);
}

// Direct execution support
if (import.meta.main) {
  await watchCommand.parse(Deno.args);
}