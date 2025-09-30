#!/usr/bin/env -S deno run --allow-all

/**
 * Core AST Scanner - Extracts TypeScript/JavaScript code structure into databases
 * This is the heart of the semantic analysis system
 */

import { walk } from "@std/fs";
import { relative } from "https://deno.land/std@0.224.0/path/mod.ts";
import { parse } from "@std/flags";
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

import { ASTAnalyzer } from "../lib/ast-analyzer.ts";
import { kuzuClient } from "../lib/kuzu-client.ts";
import { duckdbClient, type FileMetrics } from "../lib/duckdb-client.ts";
import { logger } from "../utils/logger.ts";
import { config } from "../utils/config.ts";

interface ScanOptions {
  path: string;
  incremental: boolean;
  verbose: boolean;
  include?: string[];
  exclude?: string[];
  maxDepth?: number;
  clear?: boolean;
}

class CodebaseScanner {
  private analyzer: ASTAnalyzer;
  private options: ScanOptions;
  private fileCount = 0;
  private symbolCount = 0;
  private typeCount = 0;
  private importCount = 0;
  private relationshipCount = 0;

  constructor(options: ScanOptions) {
    this.options = options;
    this.analyzer = new ASTAnalyzer({
      defaultCompilerOptions: {
        target: 22, // ES2022
        module: 199, // NodeNext
        lib: ["es2022"],
        allowJs: true,
        checkJs: false,
        strict: true,
      }
    });
  }

  async scan(): Promise<void> {
    logger.section("Scanning Codebase");

    // Initialize databases
    await this.initializeDatabases();

    // Clear existing data if requested
    if (this.options.clear) {
      await this.clearData();
    }

    // Collect files to scan
    const files = await this.collectFiles();

    if (files.length === 0) {
      logger.warn("No TypeScript/JavaScript files found to scan");
      return;
    }

    logger.info(`Found ${files.length} files to scan`);

    // Process files
    for (const file of files) {
      await this.processFile(file);
    }

    // Report results
    await this.reportResults();
  }

  private async initializeDatabases(): Promise<void> {
    logger.subsection("Initializing Databases");

    try {
      await kuzuClient.initialize();
      logger.success("Kuzu database connected");
    } catch (error) {
      logger.error(`Failed to connect to Kuzu: ${error}`);
      throw error;
    }

    try {
      await duckdbClient.initialize();
      logger.success("DuckDB database connected");
    } catch (error) {
      logger.error(`Failed to connect to DuckDB: ${error}`);
      throw error;
    }
  }

  private async clearData(): Promise<void> {
    logger.subsection("Clearing Existing Data");

    await kuzuClient.clearAll();
    await duckdbClient.clearTable("file_metrics");

    logger.success("Cleared all existing data");
  }

  private async collectFiles(): Promise<string[]> {
    const files: string[] = [];
    const startPath = this.options.path || ".";

    const includePatterns = this.options.include || ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"];
    const excludePatterns = this.options.exclude || [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/build/**",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.d.ts"
    ];

    for await (const entry of walk(startPath)) {
      if (entry.isFile) {
        const relPath = relative(startPath, entry.path);

        // Check if file matches include patterns
        const shouldInclude = includePatterns.some(pattern =>
          this.matchPattern(relPath, pattern)
        );

        // Check if file matches exclude patterns
        const shouldExclude = excludePatterns.some(pattern =>
          this.matchPattern(relPath, pattern)
        );

        if (shouldInclude && !shouldExclude) {
          files.push(entry.path);
        }
      }
    }

    return files;
  }

  private matchPattern(path: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, ".");
    return new RegExp(`^${regex}$`).test(path);
  }

  private async processFile(filePath: string): Promise<void> {
    this.fileCount++;

    if (this.options.verbose) {
      logger.progress(`Processing ${filePath}`);
    }

    try {
      // Check if file needs scanning (incremental mode)
      if (this.options.incremental) {
        const needsScan = await this.checkIfFileNeedsScanning(filePath);
        if (!needsScan) {
          if (this.options.verbose) {
            logger.debug(`Skipping unchanged file: ${filePath}`);
          }
          return;
        }
      }

      // Add file to analyzer
      const sourceFiles = this.analyzer.addSourceFiles([filePath]);

      if (sourceFiles.length === 0) {
        logger.warn(`Could not parse file: ${filePath}`);
        return;
      }

      // Analyze the file
      const results = this.analyzer.analyzeFile(sourceFiles[0]);

      // Store results in databases
      await this.storeResults(filePath, results);

      // Update counters
      this.symbolCount += results.symbols.length;
      this.typeCount += results.types.length;
      this.importCount += results.imports.length;
      this.relationshipCount += results.relationships.length;

      // Store file metrics
      await this.storeFileMetrics(filePath, results);

    } catch (error) {
      logger.error(`Failed to process ${filePath}: ${error}`);
    }
  }

  private async checkIfFileNeedsScanning(filePath: string): Promise<boolean> {
    try {
      const fileInfo = await Deno.stat(filePath);
      const existingMetrics = await duckdbClient.getFileMetrics(filePath);

      if (!existingMetrics) {
        return true; // File not in database
      }

      // Check if file has changed since last analysis
      if (existingMetrics.lastAnalyzed) {
        return fileInfo.mtime!.getTime() > existingMetrics.lastAnalyzed.getTime();
      }

      return true; // No last analyzed date, rescan
    } catch {
      return true; // Scan on error
    }
  }

  private async calculateFileHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async storeResults(filePath: string, results: any): Promise<void> {
    // Store symbols
    if (results.symbols.length > 0) {
      await kuzuClient.insertSymbols(results.symbols);
    }

    // Store types
    if (results.types.length > 0) {
      await kuzuClient.insertTypes(results.types);
    }

    // Store imports
    if (results.imports.length > 0) {
      await kuzuClient.insertImports(results.imports);
    }

    // Store relationships
    if (results.relationships.length > 0) {
      await kuzuClient.insertRelationships(results.relationships);
    }
  }

  private async storeFileMetrics(filePath: string, results: any): Promise<void> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split('\n');
    const totalLines = lines.length;

    // Simple line classification
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }

    // Count different symbol types
    const classCount = results.symbols.filter((s: any) => s.kind === 'class').length;
    const functionCount = results.symbols.filter((s: any) =>
      s.kind === 'function' || s.kind === 'method'
    ).length;

    // Calculate complexity
    const complexitySum = results.symbols.length + results.types.length;
    const complexityAvg = functionCount > 0 ? complexitySum / functionCount : 0;

    const metrics: FileMetrics = {
      filePath,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      complexitySum,
      complexityAvg,
      importCount: results.imports.length,
      exportCount: results.symbols.filter((s: any) => s.isExported).length,
      classCount,
      functionCount,
      lastAnalyzed: new Date()
    };

    await duckdbClient.insertFileMetrics([metrics]);
  }

  private async reportResults(): Promise<void> {
    logger.section("Scan Complete");

    logger.info(`Files processed: ${this.fileCount}`);
    logger.info(`Symbols extracted: ${this.symbolCount}`);
    logger.info(`Types extracted: ${this.typeCount}`);
    logger.info(`Imports extracted: ${this.importCount}`);
    logger.info(`Relationships extracted: ${this.relationshipCount}`);

    // Get database statistics
    const kuzuStats = await kuzuClient.getStats();
    const duckdbStats = await duckdbClient.getStats();

    logger.subsection("Database Statistics");
    logger.info("Kuzu Graph Database:");
    for (const [key, value] of Object.entries(kuzuStats)) {
      logger.info(`  ${key}: ${value}`);
    }

    logger.info("DuckDB Analytics:");
    for (const [key, value] of Object.entries(duckdbStats)) {
      if (typeof value === 'object') continue;
      logger.info(`  ${key}: ${value}`);
    }

    // Show top complex files
    const complexFiles = await duckdbClient.getComplexityTrends(5);
    if (complexFiles.length > 0) {
      logger.subsection("Most Complex Files");
      for (const file of complexFiles) {
        logger.info(`  ${file.file_path}: complexity=${file.complexity}, lines=${file.line_count}`);
      }
    }
  }
}

// CLI Entry Point
async function main() {
  const args = parse(Deno.args, {
    string: ["path", "include", "exclude"],
    boolean: ["incremental", "verbose", "clear", "help"],
    default: {
      path: ".",
      incremental: false,
      verbose: false,
      clear: false,
    },
    alias: {
      p: "path",
      i: "incremental",
      v: "verbose",
      c: "clear",
      h: "help",
    },
  });

  if (args.help) {
    console.log(`
AST Code Scanner - Extract code structure into graph database

Usage: deno task scan [options]

Options:
  -p, --path <path>       Path to scan (default: current directory)
  -i, --incremental       Only scan changed files
  -v, --verbose           Verbose output
  -c, --clear             Clear existing data before scanning
  --include <patterns>    Include file patterns (comma-separated)
  --exclude <patterns>    Exclude file patterns (comma-separated)
  -h, --help             Show this help message

Examples:
  deno task scan
  deno task scan -p ./src --verbose
  deno task scan --incremental --include="src/**/*.ts"
  deno task scan --clear --exclude="**/*.test.ts,**/node_modules/**"
`);
    Deno.exit(0);
  }

  const options: ScanOptions = {
    path: args.path as string,
    incremental: args.incremental as boolean,
    verbose: args.verbose as boolean,
    clear: args.clear as boolean,
    include: args.include ? (args.include as string).split(",") : undefined,
    exclude: args.exclude ? (args.exclude as string).split(",") : undefined,
  };

  try {
    const scanner = new CodebaseScanner(options);
    await scanner.scan();
  } catch (error) {
    logger.error(`Scan failed: ${error}`);
    Deno.exit(1);
  }
}

// Cliffy Command export for CLI router
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

export const scanCommand = new Command()
  .description("Scan codebase and extract semantic structure into databases")
  .option("-p, --path <path:string>", "Path to scan", { default: "." })
  .option("-i, --incremental", "Only scan changed files")
  .option("-c, --clear", "Clear existing data before scanning")
  .option("--include <patterns:string>", "Include file patterns (comma-separated)")
  .option("--exclude <patterns:string>", "Exclude file patterns (comma-separated)")
  .example("Scan current directory", "ts-agent scan")
  .example("Scan with verbose output", "ts-agent scan -v")
  .example("Incremental scan", "ts-agent scan --incremental")
  .example("Scan specific path", "ts-agent scan --path ./src")
  .action(async (options) => {
    const scanOptions: ScanOptions = {
      path: options.path,
      incremental: options.incremental || false,
      verbose: options.verbose || false,
      clear: options.clear || false,
      include: options.include ? options.include.split(",") : undefined,
      exclude: options.exclude ? options.exclude.split(",") : undefined,
    };

    try {
      const scanner = new CodebaseScanner(scanOptions);
      await scanner.scan();
    } catch (error) {
      logger.error(`Scan failed: ${error}`);
      Deno.exit(1);
    }
  });

// Run if executed directly
if (import.meta.main) {
  main();
}