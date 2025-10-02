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
import { duckdbClient } from "../lib/duckdb-client.ts";
import { kuzuClient } from "../lib/kuzu-client.ts";
import { getCurrentSha, isGitRepo } from "../utils/git.ts";
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

  // Initialize DuckDB client
  await duckdbClient.initialize();

  // Get git SHA if in a git repository
  let gitSha: string | undefined;
  if (await isGitRepo()) {
    try {
      gitSha = await getCurrentSha();
      logger.debug(`Git SHA: ${gitSha}`);
    } catch {
      logger.warn("Could not get git SHA");
    }
  }

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

  // Load previous hashes from DuckDB or calculate initial hashes
  let previousHashes = await loadPreviousHashes(options.path, ignorePatterns);

  logger.success(`Initial state: ${Object.keys(previousHashes).length} files tracked`);

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

      // Handle deletions first
      if (changes.deleted.length > 0) {
        logger.info(`Removing ${changes.deleted.length} deleted file(s) from database...`);
        for (const deletedFile of changes.deleted) {
          try {
            await kuzuClient.deleteFileData(deletedFile);
            await duckdbClient.deleteFileHashes([deletedFile]);
          } catch (error) {
            logger.error(`Failed to delete ${deletedFile}: ${error}`);
          }
        }
      }

      // Perform incremental scan for added/modified files
      if (filesToRescan.length > 0) {
        logger.info(`Rescanning ${filesToRescan.length} file(s)...`);

        try {
          // Import scanner dynamically to avoid circular dependencies
          const { CodebaseScanner } = await import("./scan.ts");

          // Create scanner with incremental mode
          const scanner = new (CodebaseScanner as any)({
            path: options.path,
            files: filesToRescan,
            incremental: true,
            verbose: options.verbose,
          });

          // Run the incremental scan
          await scanner.scan();

          logger.success("Incremental scan complete");
        } catch (error) {
          logger.error(`Incremental scan failed: ${error}`);
        }

        // Update previous hashes
        previousHashes = currentHashes;
      } else if (changes.deleted.length === 0) {
        logger.info("No changes requiring database update");
      } else {
        // Only deletions occurred, update hashes
        previousHashes = currentHashes;
      }
    } catch (error) {
      logger.error("Error during incremental scan:", error);
    }
  });
}

/**
 * Load previous hashes from DuckDB or calculate initial hashes
 */
async function loadPreviousHashes(
  path: string,
  ignorePatterns: string[]
): Promise<Record<string, string>> {
  try {
    // Try to load from DuckDB first
    const dbHashes = await duckdbClient.getAllFileHashes();

    if (Object.keys(dbHashes).length > 0) {
      logger.debug(`Loaded ${Object.keys(dbHashes).length} file hashes from database`);
      return dbHashes;
    }
  } catch (error) {
    logger.debug(`Could not load hashes from database: ${error.message}`);
  }

  // Fall back to calculating initial hashes
  logger.info("No previous hashes found, calculating initial state...");
  const currentHashes = await calculateCurrentHashes(path, ignorePatterns);

  // Persist initial hashes to database
  try {
    let gitSha: string | undefined;
    if (await isGitRepo()) {
      gitSha = await getCurrentSha();
    }
    await duckdbClient.upsertFileHashes(currentHashes, gitSha);
    logger.debug("Persisted initial hashes to database");
  } catch (error) {
    logger.warn(`Could not persist initial hashes: ${error.message}`);
  }

  return currentHashes;
}

/**
 * Calculate current file hashes for the watched directory
 */
async function calculateCurrentHashes(
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
  return await calculateCurrentHashes(path, ignorePatterns);
}

// Direct execution support
if (import.meta.main) {
  await watchCommand.parse(Deno.args);
}