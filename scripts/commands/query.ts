#!/usr/bin/env -S deno run --allow-all

/**
 * Enhanced Query Command
 * Supports natural language queries, query templates, and raw Cypher
 */

import { Command } from "@cliffy/command/mod.ts";
import { Table } from "@cliffy/table/mod.ts";
import { kuzuClient, type QueryResult } from "../lib/kuzu-client.ts";
import { QueryBuilder, QueryTemplates } from "../lib/query-builder.ts";
import { NaturalLanguageParser } from "../lib/natural-language-parser.ts";
import { cache } from "../utils/cache.ts";
import { logger } from "../utils/logger.ts";

interface QueryCommandOptions {
  query?: string;
  template?: string;
  format?: "table" | "json" | "tree" | "count";
  cache?: boolean;
  verbose?: boolean;
}

/**
 * Execute a query and format results
 */
async function executeQuery(
  queryString: string,
  options: QueryCommandOptions
): Promise<void> {
  const startTime = Date.now();

  // Check cache if enabled
  const cacheKey = `query:${queryString}`;
  if (options.cache) {
    const cached = await cache.get<QueryResult>(cacheKey);
    if (cached) {
      logger.debug("Using cached result");
      formatResults(cached, options);
      return;
    }
  }

  // Initialize Kuzu client
  await kuzuClient.initialize();

  // Execute query
  try {
    const result = await kuzuClient.query(queryString);
    const executionTime = Date.now() - startTime;

    // Cache result if enabled
    if (options.cache) {
      await cache.set(cacheKey, result, { ttl: 300 }); // 5 minute TTL
    }

    // Format and display results
    formatResults(result, options);

    // Show execution time in verbose mode
    if (options.verbose) {
      logger.debug(`Query executed in ${executionTime}ms`);
      logger.debug(`Returned ${result.rowCount} rows`);
    }
  } catch (error) {
    logger.error(`Query failed: ${error.message}`);
    if (options.verbose) {
      logger.error(`Query: ${queryString}`);
    }
    Deno.exit(1);
  }
}

/**
 * Format and display query results
 */
function formatResults(result: QueryResult, options: QueryCommandOptions): void {
  if (result.rowCount === 0) {
    logger.warn("No results found");
    return;
  }

  switch (options.format) {
    case "json":
      console.log(JSON.stringify(result.rows, null, 2));
      break;

    case "count":
      console.log(`${result.rowCount} results`);
      break;

    case "tree":
      formatTree(result);
      break;

    case "table":
    default:
      formatTable(result);
      break;
  }
}

/**
 * Format results as a table
 */
function formatTable(result: QueryResult): void {
  if (result.columns.length === 0 || result.rows.length === 0) {
    logger.warn("No data to display");
    return;
  }

  const table = new Table()
    .header(result.columns)
    .body(result.rows.map(row => result.columns.map(col => formatValue(row[col]))));

  table.render();
}

/**
 * Format results as a tree (for hierarchical data)
 */
function formatTree(result: QueryResult): void {
  // Group by first column if present
  if (result.columns.length === 0) return;

  const groups = new Map<string, any[]>();

  for (const row of result.rows) {
    const key = String(row[result.columns[0]]);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  for (const [key, rows] of groups.entries()) {
    console.log(`\n${key}`);
    for (const row of rows) {
      const values = result.columns.slice(1).map(col => `${col}: ${formatValue(row[col])}`);
      console.log(`  └─ ${values.join(", ")}`);
    }
  }
}

/**
 * Format a value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Main query command
 */
export const queryCommand = new Command()
  .name("query")
  .description("Query the semantic graph database")
  .arguments("[query:string]")
  .option("-q, --query <query:string>", "Cypher query or natural language")
  .option("-t, --template <template:string>", "Use a query template")
  .option("-f, --format <format:string>", "Output format", {
    default: "table",
  })
  .option("--cache", "Enable query result caching (5min TTL)")
  .option("-v, --verbose", "Show execution details")
  .option("--nl-help", "Show natural language query help")
  .option("--templates", "List available query templates")
  .example("Natural language", 'query "who calls fetchUser"')
  .example("Template", "query -t find-callers fetchUser")
  .example("Raw Cypher", 'query "MATCH (n:Symbol) RETURN n LIMIT 10"')
  .example("JSON output", 'query "show classes" -f json')
  .action(async (options: QueryCommandOptions, ...args: string[]) => {
    // Show NL help
    if (options["nl-help"]) {
      console.log(NaturalLanguageParser.getHelp());
      return;
    }

    // Show templates
    if (options["templates"]) {
      showTemplates();
      return;
    }

    // Get query from various sources
    const inputQuery = options.query || args[0];

    if (!inputQuery) {
      logger.error("No query provided. Use --query, provide as argument, or --help for examples.");
      Deno.exit(1);
    }

    // Parse query
    let finalQuery: string;

    // Check if template specified
    if (options.template) {
      finalQuery = getTemplateQuery(options.template, args);
    } else {
      // Try natural language parsing first
      const parsed = NaturalLanguageParser.parse(inputQuery);

      if (parsed.builder) {
        if (options.verbose) {
          logger.info(`Detected pattern: ${parsed.pattern} (confidence: ${parsed.confidence})`);
        }
        finalQuery = parsed.builder.build();
      } else if (parsed.rawCypher) {
        // Use as raw Cypher
        finalQuery = parsed.rawCypher;
      } else {
        logger.error("Could not parse query");
        Deno.exit(1);
      }
    }

    if (options.verbose) {
      logger.debug(`Executing query:\n${finalQuery}`);
    }

    // Execute the query
    await executeQuery(finalQuery, options);
  });

/**
 * Get query from template
 */
function getTemplateQuery(templateName: string, args: string[]): string {
  const templates: Record<string, (...args: string[]) => QueryBuilder> = {
    "find-callers": (name: string) => QueryTemplates.findCallers(name),
    "find-callees": (name: string) => QueryTemplates.findCallees(name),
    "find-exports": (path: string) => QueryTemplates.findExports(path),
    "find-imports": (path: string) => QueryTemplates.findImports(path),
    "find-symbols": (path: string) => QueryTemplates.findSymbolsInFile(path),
    "find-dependencies": (path: string) => QueryTemplates.findDependencies(path),
    "find-dependents": (path: string) => QueryTemplates.findDependents(path),
    "find-classes": () => QueryTemplates.findClasses(),
    "find-members": (className: string) => QueryTemplates.findClassMembers(className),
    "find-extends": (name: string) => QueryTemplates.findExtends(name),
    "find-implementations": (name: string) => QueryTemplates.findImplementations(name),
    "find-call-graph": (name: string, depth?: string) =>
      QueryTemplates.findCallGraph(name, depth ? parseInt(depth) : 2),
    "find-unused-exports": () => QueryTemplates.findUnusedExports(),
  };

  const template = templates[templateName];
  if (!template) {
    logger.error(`Unknown template: ${templateName}`);
    logger.info(`Available templates: ${Object.keys(templates).join(", ")}`);
    Deno.exit(1);
  }

  return template(...args).build();
}

/**
 * Show available templates
 */
function showTemplates(): void {
  console.log(`
Available Query Templates:

📞 Call Analysis:
  find-callers <symbol>          - Find what calls a symbol
  find-callees <symbol>          - Find what a symbol calls
  find-call-graph <symbol> [depth] - Show call graph (default depth: 2)

📦 Imports/Exports:
  find-exports <file>            - Show exports from a file
  find-imports <file>            - Show imports in a file
  find-unused-exports            - Find exported but unused symbols

🔗 Dependencies:
  find-dependencies <file>       - Show what a file imports
  find-dependents <file>         - Show what imports a file

🏗️  Structure:
  find-classes                   - List all classes
  find-members <class>           - Show class members
  find-symbols <file>            - List symbols in a file

🔺 Type Hierarchy:
  find-extends <symbol>          - Show what a symbol extends
  find-implementations <type>    - Find implementations of an interface

Usage:
  query -t <template> [args...]
  query -t find-callers fetchUser
  query -t find-call-graph initialize 3
`);
}

// Direct execution support
if (import.meta.main) {
  await queryCommand.parse(Deno.args);
}
