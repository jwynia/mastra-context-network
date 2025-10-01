/**
 * File watcher library using Deno.watchFs
 * Provides debounced file change detection with filtering
 */

import { Debouncer } from "../utils/debounce.ts";
import { logger } from "../utils/logger.ts";

export interface WatchOptions {
  /** Paths to watch */
  paths: string[];
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Glob patterns to ignore */
  ignorePatterns?: string[];
  /** Recursive watching (default: true) */
  recursive?: boolean;
}

export interface FileEvent {
  kind: "create" | "modify" | "remove" | "any";
  paths: string[];
}

export type WatchCallback = (event: FileEvent) => void | Promise<void>;

/**
 * FileWatcher monitors file system changes with debouncing
 *
 * @example
 * ```ts
 * const watcher = new FileWatcher({
 *   paths: ["./src"],
 *   debounceMs: 500,
 * });
 *
 * await watcher.start(async (event) => {
 *   console.log("Files changed:", event.paths);
 * });
 * ```
 */
export class FileWatcher {
  private options: Required<WatchOptions>;
  private watcher: Deno.FsWatcher | null = null;
  private debouncer: Debouncer<WatchCallback> | null = null;
  private callback: WatchCallback | null = null;
  private isRunning = false;

  constructor(options: WatchOptions) {
    this.options = {
      paths: options.paths,
      debounceMs: options.debounceMs ?? 500,
      ignorePatterns: options.ignorePatterns ?? [],
      recursive: options.recursive ?? true,
    };
  }

  /**
   * Start watching for file changes
   * @param callback - Function to call when files change
   */
  async start(callback: WatchCallback): Promise<void> {
    if (this.isRunning) {
      throw new Error("Watcher is already running");
    }

    this.callback = callback;
    this.debouncer = new Debouncer(callback, this.options.debounceMs);
    this.isRunning = true;

    try {
      // Watch all specified paths
      this.watcher = Deno.watchFs(this.options.paths, {
        recursive: this.options.recursive,
      });

      logger.info(`Watching ${this.options.paths.length} path(s) for changes...`);
      logger.debug(`Debounce delay: ${this.options.debounceMs}ms`);

      // Process events
      for await (const event of this.watcher) {
        if (!this.isRunning) {
          break;
        }

        // Filter out ignored paths
        const filteredPaths = this.filterPaths(event.paths);

        if (filteredPaths.length === 0) {
          continue;
        }

        // Map Deno event kinds to our event types
        const kind = this.mapEventKind(event.kind);

        // Trigger debounced callback
        this.debouncer.trigger({
          kind,
          paths: filteredPaths,
        });
      }
    } catch (error) {
      if (this.isRunning) {
        logger.error("Watch error:", error);
        throw error;
      }
      // If not running, we stopped intentionally
    }
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Flush any pending debounced calls
    if (this.debouncer) {
      this.debouncer.flush();
      this.debouncer = null;
    }

    // Close the watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    logger.info("File watcher stopped");
  }

  /**
   * Filter paths based on ignore patterns
   */
  private filterPaths(paths: string[]): string[] {
    if (this.options.ignorePatterns.length === 0) {
      return paths;
    }

    return paths.filter(path => {
      // Check against ignore patterns
      for (const pattern of this.options.ignorePatterns) {
        // Simple pattern matching (could be enhanced with proper glob matching)
        if (this.matchPattern(path, pattern)) {
          logger.debug(`Ignoring ${path} (matched pattern: ${pattern})`);
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Simple pattern matching for ignore patterns
   * Supports basic wildcards: * and **
   */
  private matchPattern(path: string, pattern: string): boolean {
    // Convert glob-like pattern to regex
    // ** means "any directories"
    // * means "any characters except /"

    let regexPattern = pattern
      .replace(/\./g, "\\.")           // Escape dots
      .replace(/\*\*/g, "<!GLOBSTAR>") // Temporary placeholder
      .replace(/\*/g, "[^/]*")         // * matches any chars except /
      .replace(/<!GLOBSTAR>/g, ".*");  // ** matches any chars including /

    // Ensure pattern matches from start
    if (!regexPattern.startsWith("^")) {
      regexPattern = ".*" + regexPattern;
    }

    // Ensure pattern matches to end
    if (!regexPattern.endsWith("$")) {
      regexPattern = regexPattern + ".*";
    }

    const regex = new RegExp(regexPattern);
    return regex.test(path);
  }

  /**
   * Map Deno FsEvent kind to our event kind
   */
  private mapEventKind(denoKind: Deno.FsEvent["kind"]): FileEvent["kind"] {
    switch (denoKind) {
      case "create":
        return "create";
      case "modify":
        return "modify";
      case "remove":
        return "remove";
      default:
        return "any";
    }
  }

  /**
   * Check if watcher is currently running
   */
  get running(): boolean {
    return this.isRunning;
  }
}