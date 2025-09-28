#!/usr/bin/env -S deno run --allow-all

/**
 * Initialize the Deno+Node TypeScript development environment
 * Sets up databases, validates configuration, and prepares the workspace
 */

import { exists, ensureDir } from "@std/fs";
import { green, yellow, red, bold } from "@std/fmt/colors";

interface InitStep {
  name: string;
  check: () => Promise<boolean>;
  action: () => Promise<void>;
  required: boolean;
}

const steps: InitStep[] = [
  {
    name: "Create directory structure",
    check: async () => await exists("src") && await exists("scripts"),
    action: async () => {
      await ensureDir("src");
      await ensureDir("scripts");
      await ensureDir("tests");
      await ensureDir("bench");
      await ensureDir(".agent");
      await ensureDir(".kuzu");
      await ensureDir(".duckdb");
      await ensureDir(".cache/deno");
    },
    required: true,
  },
  {
    name: "Initialize Kuzu database",
    check: async () => await exists(".kuzu/semantic.db"),
    action: async () => {
      // Check if kuzu command is available
      try {
        const checkCmd = new Deno.Command("kuzu", {
          args: ["--version"],
          stdout: "piped",
          stderr: "piped",
        });
        await checkCmd.output();
      } catch {
        console.log("⚠️  Kuzu not installed - skipping database initialization");
        console.log("   Install Kuzu CLI to enable semantic analysis features");
        return;
      }

      const initScript = `
        CREATE NODE TABLE Module (
          path STRING PRIMARY KEY,
          name STRING,
          package STRING,
          lastModified TIMESTAMP,
          gitSha STRING
        );

        CREATE NODE TABLE Symbol (
          id STRING PRIMARY KEY,
          name STRING,
          kind STRING,
          exported BOOLEAN,
          file STRING,
          line INT32,
          column INT32,
          gitSha STRING
        );

        CREATE NODE TABLE Type (
          id STRING PRIMARY KEY,
          name STRING,
          primitive BOOLEAN,
          generic BOOLEAN,
          nullable BOOLEAN,
          readonly BOOLEAN
        );

        CREATE REL TABLE DECLARES (FROM Module TO Symbol);
        CREATE REL TABLE EXTENDS (FROM Symbol TO Symbol);
        CREATE REL TABLE IMPLEMENTS (FROM Symbol TO Symbol);
        CREATE REL TABLE REFERENCES (FROM Symbol TO Symbol);
        CREATE REL TABLE IMPORTS (FROM Module TO Module);
        CREATE REL TABLE HAS_TYPE (FROM Symbol TO Type);
      `;

      await Deno.writeTextFile(".kuzu/init.cypher", initScript);

      const cmd = new Deno.Command("kuzu", {
        args: [".kuzu/semantic.db", "-c", initScript],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await cmd.output();

      if (code !== 0) {
        throw new Error(`Kuzu init failed: ${new TextDecoder().decode(stderr)}`);
      }
    },
    required: false,
  },
  {
    name: "Initialize DuckDB database",
    check: async () => await exists(".duckdb/metrics.db"),
    action: async () => {
      const initScript = `
        CREATE TABLE IF NOT EXISTS file_metrics (
          path VARCHAR PRIMARY KEY,
          extension VARCHAR,
          lines INTEGER,
          size INTEGER,
          complexity INTEGER,
          imports INTEGER,
          exports INTEGER,
          last_modified TIMESTAMP,
          scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS type_coverage (
          date TIMESTAMP PRIMARY KEY,
          total_lines INTEGER,
          typed_lines INTEGER,
          coverage_percentage DECIMAL(5,2),
          any_count INTEGER,
          unknown_count INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS dependency_metrics (
          package_name VARCHAR PRIMARY KEY,
          version VARCHAR,
          size_kb INTEGER,
          direct BOOLEAN,
          usage_count INTEGER,
          last_updated TIMESTAMP
        );
      `;
      
      await Deno.writeTextFile(".duckdb/init.sql", initScript);
      
      const cmd = new Deno.Command("duckdb", {
        args: [".duckdb/metrics.db", "-c", initScript],
        stdout: "piped",
        stderr: "piped",
      });
      
      await cmd.output();
    },
    required: true,
  },
  {
    name: "Create package.json",
    check: async () => await exists("package.json"),
    action: async () => {
      const packageJson = {
        name: "typescript-project",
        version: "1.0.0",
        type: "module",
        scripts: {
          "dev": "tsx watch src/index.ts",
          "build": "tsc",
          "test": "vitest",
          "test:ui": "vitest --ui",
          "test:coverage": "vitest --coverage",
          "typecheck": "tsc --noEmit",
          "lint": "eslint src tests --ext .ts,.tsx",
          "format": "prettier --write 'src/**/*.{ts,tsx,json}'",
          "// Deno tasks": "Access via 'deno task'",
          "analyze": "deno task analyze",
          "deps:check": "deno task analyze:deps",
          "types:check": "deno task analyze:types"
        },
        devDependencies: {
          "@types/node": "^20.11.0",
          "@vitest/ui": "^1.2.0",
          "eslint": "^8.56.0",
          "prettier": "^3.2.0",
          "tsx": "^4.7.0",
          "typescript": "^5.3.0",
          "vite": "^5.0.0",
          "vitest": "^1.2.0"
        }
      };
      
      await Deno.writeTextFile(
        "package.json",
        JSON.stringify(packageJson, null, 2)
      );
    },
    required: false,
  },
  {
    name: "Create .envrc for direnv",
    check: async () => await exists(".envrc"),
    action: async () => {
      const envrc = `
# Deno+Node Development Environment
export KUZU_DB_PATH="$PWD/.kuzu/semantic.db"
export DUCKDB_PATH="$PWD/.duckdb/metrics.db"
export DENO_DIR="$PWD/.cache/deno"

# Node environment
export NODE_ENV="development"

# Add scripts to PATH
export PATH="$PWD/scripts:$PATH"

# Project-specific aliases
alias analyze="deno task analyze"
alias bench="deno bench"
alias dt="deno task"

echo "🦕 Deno tooling + 🟢 Node runtime environment loaded"
      `.trim();
      
      await Deno.writeTextFile(".envrc", envrc);
      
      // Run direnv allow
      await new Deno.Command("direnv", {
        args: ["allow"],
        stdout: "inherit",
        stderr: "inherit",
      }).output();
    },
    required: false,
  },
  {
    name: "Create README",
    check: async () => await exists("README.md"),
    action: async () => {
      const readme = `
# TypeScript Project with Deno Tooling

This project uses an intentional split between Deno (for tooling) and Node.js (for application runtime).

## Directory Structure

- \`src/\` - Node.js application code
- \`scripts/\` - Deno tooling and automation scripts  
- \`tests/\` - Node.js tests (Vitest)
- \`bench/\` - Deno benchmarks
- \`.agent/\` - LLM agent workspace

## Quick Start

\`\`\`bash
# Node.js application
npm install
npm run dev

# Deno tooling
deno task analyze
deno task watch
\`\`\`

## Available Deno Tasks

Run \`deno task\` to see all available tooling commands.

## Why This Setup?

- **Deno for tooling**: Secure, TypeScript-native, no build step
- **Node for runtime**: Ecosystem compatibility, production-ready
- **Clear boundaries**: No confusion about which runtime to use
- **LLM-friendly**: Agent knows exactly where different code belongs
      `.trim();
      
      await Deno.writeTextFile("README.md", readme);
    },
    required: false,
  },
];

async function main() {
  console.log(bold("🚀 Initializing Deno+Node TypeScript Environment\n"));
  
  let failed = false;
  
  for (const step of steps) {
    const exists = await step.check();
    
    if (exists) {
      console.log(green("✓"), step.name, yellow("(already done)"));
      continue;
    }
    
    try {
      await step.action();
      console.log(green("✓"), step.name);
    } catch (error) {
      console.log(red("✗"), step.name);
      console.error("  ", red(error.message));
      
      if (step.required) {
        failed = true;
        break;
      }
    }
  }
  
  console.log();
  
  if (failed) {
    console.log(red("❌ Initialization failed. Please fix the errors above."));
    Deno.exit(1);
  } else {
    console.log(green("✅ Environment initialized successfully!"));
    console.log("\nNext steps:");
    console.log("  1. Run", bold("npm install"), "to install Node dependencies");
    console.log("  2. Run", bold("deno task db:scan"), "to analyze your codebase");
    console.log("  3. Run", bold("deno task watch"), "to start the file watcher");
  }
}

if (import.meta.main) {
  await main();
}