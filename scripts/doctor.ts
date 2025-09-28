#!/usr/bin/env -S deno run --allow-all

/**
 * Health check for the development environment
 * Validates that all tools are installed and configured correctly
 */

import { exists } from "@std/fs";
import { green, yellow, red, bold, dim } from "@std/fmt/colors";

interface Check {
  name: string;
  category: "runtime" | "tool" | "database" | "config";
  check: () => Promise<{ ok: boolean; message?: string; version?: string }>;
  fix?: string;
}

async function commandExists(cmd: string): Promise<string | null> {
  try {
    const command = new Deno.Command(cmd, {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code, stdout } = await command.output();
    
    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      const version = output.split("\n")[0].trim();
      return version;
    }
    return null;
  } catch {
    return null;
  }
}

const checks: Check[] = [
  // Runtimes
  {
    name: "Node.js",
    category: "runtime",
    check: async () => {
      const version = await commandExists("node");
      return {
        ok: version !== null,
        version,
        message: version ? undefined : "Node.js not found",
      };
    },
    fix: "Install Node.js 20+ from nodejs.org",
  },
  {
    name: "Deno",
    category: "runtime",
    check: async () => {
      const version = await commandExists("deno");
      return {
        ok: version !== null,
        version,
        message: version ? undefined : "Deno not found",
      };
    },
    fix: "curl -fsSL https://deno.land/install.sh | sh",
  },
  
  // Package managers
  {
    name: "npm",
    category: "tool",
    check: async () => {
      const version = await commandExists("npm");
      return {
        ok: version !== null,
        version,
      };
    },
  },
  
  // Analysis tools
  {
    name: "Kuzu Database",
    category: "tool",
    check: async () => {
      const version = await commandExists("kuzu");
      return {
        ok: version !== null,
        version,
        message: version ? undefined : "Kuzu CLI not installed",
      };
    },
    fix: "Install from https://github.com/kuzudb/kuzu/releases",
  },
  {
    name: "DuckDB",
    category: "tool",
    check: async () => {
      const version = await commandExists("duckdb");
      return {
        ok: version !== null,
        version,
      };
    },
    fix: "Install from https://duckdb.org/docs/installation",
  },
  {
    name: "ast-grep",
    category: "tool",
    check: async () => {
      const version = await commandExists("ast-grep");
      return {
        ok: version !== null,
        version,
      };
    },
    fix: "cargo install ast-grep or npm install -g @ast-grep/cli",
  },
  {
    name: "ripgrep",
    category: "tool",
    check: async () => {
      const version = await commandExists("rg");
      return {
        ok: version !== null,
        version,
      };
    },
    fix: "Install ripgrep from your package manager",
  },
  
  // Databases
  {
    name: "Kuzu Semantic DB",
    category: "database",
    check: async () => {
      const dbExists = await exists(".kuzu/semantic.db");
      return {
        ok: dbExists,
        message: dbExists ? "Database ready" : "Database not initialized",
      };
    },
    fix: "Run: deno task db:init",
  },
  {
    name: "DuckDB Metrics DB",
    category: "database",
    check: async () => {
      const dbExists = await exists(".duckdb/metrics.db");
      return {
        ok: dbExists,
        message: dbExists ? "Database ready" : "Database not initialized",
      };
    },
    fix: "Run: deno task db:init",
  },
  
  // Configuration files
  {
    name: "deno.json",
    category: "config",
    check: async () => {
      const configExists = await exists("deno.json");
      if (!configExists) {
        return { ok: false, message: "Deno config not found" };
      }
      
      try {
        const config = JSON.parse(await Deno.readTextFile("deno.json"));
        const hasTasks = config.tasks && Object.keys(config.tasks).length > 0;
        return {
          ok: hasTasks,
          message: hasTasks ? `${Object.keys(config.tasks).length} tasks defined` : "No tasks defined",
        };
      } catch {
        return { ok: false, message: "Invalid deno.json" };
      }
    },
    fix: "Copy config/deno.json from the devcontainer",
  },
  {
    name: "package.json",
    category: "config",
    check: async () => {
      const pkgExists = await exists("package.json");
      return {
        ok: pkgExists,
        message: pkgExists ? "Package.json found" : "No package.json",
      };
    },
    fix: "Run: deno task init",
  },
  {
    name: "TypeScript Config",
    category: "config",
    check: async () => {
      const tsConfigExists = await exists("tsconfig.json");
      return {
        ok: tsConfigExists,
        message: tsConfigExists ? "TypeScript configured" : "No tsconfig.json",
      };
    },
    fix: "Create a tsconfig.json for your Node.js code",
  },
  
  // Directory structure
  {
    name: "Directory Structure",
    category: "config",
    check: async () => {
      const required = ["src", "scripts", "tests", ".agent"];
      const missing = [];
      
      for (const dir of required) {
        if (!await exists(dir)) {
          missing.push(dir);
        }
      }
      
      return {
        ok: missing.length === 0,
        message: missing.length > 0 
          ? `Missing: ${missing.join(", ")}`
          : "All directories present",
      };
    },
    fix: "Run: deno task init",
  },
];

async function main() {
  console.log(bold("\n🩺 Environment Health Check\n"));
  console.log(dim("Checking your Deno+Node TypeScript development environment...\n"));
  
  const results = new Map<string, Check[]>();
  
  // Group by category
  for (const check of checks) {
    if (!results.has(check.category)) {
      results.set(check.category, []);
    }
    results.get(check.category)!.push(check);
  }
  
  let hasErrors = false;
  
  // Run checks by category
  for (const [category, categoryChecks] of results) {
    console.log(bold(`${getCategoryEmoji(category)} ${getCategoryName(category)}`));
    
    for (const check of categoryChecks) {
      const result = await check.check();
      
      if (result.ok) {
        console.log(
          "  ",
          green("✓"),
          check.name,
          result.version ? dim(`(${result.version})`) : "",
          result.message ? dim(`- ${result.message}`) : ""
        );
      } else {
        hasErrors = true;
        console.log(
          "  ",
          red("✗"),
          check.name,
          result.message ? red(`- ${result.message}`) : ""
        );
        if (check.fix) {
          console.log("    ", dim(`Fix: ${check.fix}`));
        }
      }
    }
    console.log();
  }
  
  // Summary
  if (hasErrors) {
    console.log(yellow("⚠️  Some checks failed. Run the suggested fixes above.\n"));
    Deno.exit(1);
  } else {
    console.log(green("✅ All checks passed! Your environment is ready.\n"));
    console.log(dim("Useful commands:"));
    console.log("  ", bold("deno task"), "- List all Deno tasks");
    console.log("  ", bold("npm run"), "- List all Node scripts");
    console.log("  ", bold("deno task analyze"), "- Analyze your codebase");
    console.log("  ", bold("deno task watch"), "- Start file watchers");
  }
}

function getCategoryEmoji(category: string): string {
  switch (category) {
    case "runtime": return "🚀";
    case "tool": return "🔧";
    case "database": return "💾";
    case "config": return "⚙️";
    default: return "📦";
  }
}

function getCategoryName(category: string): string {
  switch (category) {
    case "runtime": return "Runtimes";
    case "tool": return "Tools";
    case "database": return "Databases";
    case "config": return "Configuration";
    default: return category;
  }
}

if (import.meta.main) {
  await main();
}