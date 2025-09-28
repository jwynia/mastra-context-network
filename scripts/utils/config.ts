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
    return {
      // Database paths (use relative paths)
      kuzuDbPath: Deno.env.get("KUZU_DB_PATH")?.startsWith("/") ?
        Deno.env.get("KUZU_DB_PATH")! :
        (Deno.env.get("KUZU_DB_PATH") || ".kuzu/semantic.db"),
      duckdbPath: Deno.env.get("DUCKDB_PATH")?.startsWith("/") ?
        Deno.env.get("DUCKDB_PATH")! :
        (Deno.env.get("DUCKDB_PATH") || ".duckdb/metrics.db"),

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
    this.config[key] = value;
  }

  reload(): void {
    this.config = this.loadConfig();
  }
}

// Create singleton instance
export const config = new ConfigManager();

// Export for testing or custom instances
export { ConfigManager };
export type { Config };