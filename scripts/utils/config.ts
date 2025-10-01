/**
 * Configuration management utility
 */

interface Config {
  // Database paths
  kuzuDbPath: string;
  duckdbPath: string;

  // Agent configuration
  agentContextWindow: number;
  agentMaxFiles: number;
  agentCacheDir: string;

  // Analysis configuration
  analysisMaxDepth: number;
  analysisIncludeTests: boolean;
  analysisIncludeNodeModules: boolean;

  // Watch configuration
  watchPollInterval: number;
  watchDebounceMs: number;
  watchIgnorePatterns: string[];

  // Deno configuration
  denoDir: string;

  // Node environment
  nodeEnv: string;
}

class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    // Fix paths that have /workspace/ prefix (should be relative or /workspaces/)
    const fixPath = (path: string | undefined, defaultPath: string): string => {
      if (!path) return defaultPath;
      // If path starts with /workspace/ (singular), make it relative
      if (path.startsWith("/workspace/")) {
        return path.replace("/workspace/", "./");
      }
      return path;
    };

    return {
      // Database paths (use relative paths from workspace root)
      kuzuDbPath: fixPath(Deno.env.get("KUZU_DB_PATH"), ".kuzu/semantic.db"),
      duckdbPath: fixPath(Deno.env.get("DUCKDB_PATH"), ".duckdb/metrics.db"),

      // Agent configuration
      agentContextWindow: parseInt(Deno.env.get("AGENT_CONTEXT_WINDOW") || "20"),
      agentMaxFiles: parseInt(Deno.env.get("AGENT_MAX_FILES") || "20"),
      agentCacheDir: Deno.env.get("AGENT_CACHE_DIR") || ".agent",

      // Analysis configuration
      analysisMaxDepth: parseInt(Deno.env.get("ANALYSIS_MAX_DEPTH") || "5"),
      analysisIncludeTests: Deno.env.get("ANALYSIS_INCLUDE_TESTS") === "true",
      analysisIncludeNodeModules: Deno.env.get("ANALYSIS_INCLUDE_NODE_MODULES") === "true",

      // Watch configuration
      watchPollInterval: parseInt(Deno.env.get("WATCH_POLL_INTERVAL") || "1000"),
      watchDebounceMs: parseInt(Deno.env.get("WATCH_DEBOUNCE_MS") || "500"),
      watchIgnorePatterns: (Deno.env.get("WATCH_IGNORE_PATTERNS") || "**/*.test.ts,**/node_modules/**,**/.git/**").split(","),

      // Deno configuration
      denoDir: Deno.env.get("DENO_DIR") || ".cache/deno",

      // Node environment
      nodeEnv: Deno.env.get("NODE_ENV") || "development",
    };
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  getAll(): Config {
    return { ...this.config };
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void {
    // Validate the value before setting
    this.validateSingleValue(key, value);
    this.config[key] = value;
  }

  reload(): void {
    this.config = this.loadConfig();
  }

  /**
   * Validate all configuration values
   * @returns Array of error messages (empty if valid)
   */
  async validate(): Promise<string[]> {
    const errors: string[] = [];

    // Validate database paths exist
    try {
      await Deno.stat(this.config.kuzuDbPath);
    } catch {
      errors.push(`kuzuDbPath does not exist: ${this.config.kuzuDbPath}`);
    }

    try {
      await Deno.stat(this.config.duckdbPath);
    } catch {
      errors.push(`duckdbPath does not exist: ${this.config.duckdbPath}`);
    }

    return errors;
  }

  /**
   * Validate a single config value
   * @throws Error if validation fails
   */
  private validateSingleValue<K extends keyof Config>(key: K, value: Config[K]): void {
    // Numeric validations
    if (typeof value === "number") {
      // All numbers must be positive
      if (value < 0) {
        throw new Error(`${String(key)} must be positive`);
      }

      // Specific validations
      if (key === "agentContextWindow" || key === "agentMaxFiles") {
        if (value === 0) {
          throw new Error(`${String(key)} must be positive`);
        }
      }

      if (key === "watchDebounceMs") {
        if (value < 50) {
          throw new Error(`watchDebounceMs must be at least 50ms`);
        }
      }

      if (key === "analysisMaxDepth") {
        if (value < 1 || value > 10) {
          throw new Error(`analysisMaxDepth must be between 1 and 10`);
        }
      }
    }
  }
}

// Create singleton instance
export const config = new ConfigManager();

// Export for testing or custom instances
export { ConfigManager };
export type { Config };