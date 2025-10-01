#!/usr/bin/env -S deno run -A
/**
 * TypeScript Semantic Analysis CLI
 *
 * Main entry point for all analysis commands.
 * Provides a unified interface using the Cliffy command framework.
 */

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/colors.ts";

// Import command implementations
import { scanCommand } from "./commands/scan.ts";
import { queryCommand } from "./commands/query.ts";
import { watchCommand } from "./commands/watch.ts";

// Version from deno.json or hardcoded
const VERSION = "0.1.0";

// Main CLI application
const cli = new Command()
  .name("ts-agent")
  .version(VERSION)
  .description("TypeScript Semantic Analysis Agent - Deep code understanding for developers and AI")
  .meta("Author", "TypeScript Agent Team")
  .meta("Source", "https://github.com/your-org/mastra-context-network")

  // Global options available to all commands
  .option("-v, --verbose", "Enable verbose logging", { global: true })
  .option("--json", "Output results in JSON format", { global: true })
  .option("-o, --output <file:string>", "Write output to file", { global: true })

  // Register commands
  .command("scan", scanCommand)
  .command("query", queryCommand)
  .command("watch", watchCommand)

  // Health check command (wraps doctor.ts)
  .command(
    "doctor",
    new Command()
      .description("Check system health and dependencies")
      .option("--deep", "Run comprehensive health checks (planned)")
      .option("--fix", "Attempt to fix issues automatically (planned)")
      .action(async (options) => {
        // Run the existing doctor script
        const cmd = new Deno.Command("deno", {
          args: ["run", "-A", "scripts/doctor.ts"],
        });

        const { code } = await cmd.output();
        Deno.exit(code);
      })
  )

  // Database management commands
  .command(
    "db",
    new Command()
      .description("Database management commands")
      .command(
        "init",
        new Command()
          .description("Initialize database schemas")
          .option("--force", "Drop existing databases and recreate")
          .action(async (options) => {
            const cmd = new Deno.Command("deno", {
              args: ["run", "-A", "scripts/init-databases.ts"],
            });

            const { code } = await cmd.output();
            Deno.exit(code);
          })
      )
      .command(
        "stats",
        new Command()
          .description("Show database statistics (planned)")
          .action(() => {
            console.log("Database statistics command not yet implemented");
            console.log("Will show:");
            console.log("  - Kuzu: node counts, relationship counts, graph size");
            console.log("  - DuckDB: table sizes, row counts, file size");
            Deno.exit(1);
          })
      )
  )

  // Analysis commands (placeholders)
  .command(
    "analyze",
    new Command()
      .description("Comprehensive codebase analysis (planned)")
      .option("--scope <scope:string>", "Analysis scope: module|file|function")
      .option("--depth <depth:string>", "Traversal depth: shallow|deep")
      .option("--focus <focus:string>", "Analysis focus: types|deps|complexity")
      .action(() => {
        console.log(colors.yellow("⏳ Analyze command not yet implemented"));
        console.log("\nPlanned capabilities:");
        console.log("  - Comprehensive code analysis");
        console.log("  - Type system analysis");
        console.log("  - Dependency analysis");
        console.log("  - Complexity metrics");
        console.log("\n See: context-network/architecture/command_reference.md");
        Deno.exit(1);
      })
  )


  // Help is built-in by Cliffy
  .example(
    "Scan codebase",
    "ts-agent scan"
  )
  .example(
    "Query semantic graph",
    'ts-agent query "find all interfaces extending BaseEntity"'
  )
  .example(
    "Check system health",
    "ts-agent doctor"
  )
  .example(
    "Initialize databases",
    "ts-agent db init"
  );

// Run the CLI
if (import.meta.main) {
  try {
    await cli.parse(Deno.args);
  } catch (error) {
    console.error(colors.red("Error:"), error.message);
    Deno.exit(1);
  }
}

// Export for testing
export { cli };