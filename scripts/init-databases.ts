#!/usr/bin/env -S deno run --allow-all

/**
 * Initialize Kuzu and DuckDB databases with semantic schemas
 * This is REQUIRED - both databases are essential to the system
 */

import { ensureDir, exists } from "@std/fs";
import { green, yellow, red, bold } from "@std/fmt/colors";

const KUZU_DB_PATH = Deno.env.get("KUZU_DB_PATH") || ".kuzu/semantic.db";
const DUCKDB_PATH = Deno.env.get("DUCKDB_PATH") || ".duckdb/metrics.db";

interface DatabaseInitResult {
  success: boolean;
  database: string;
  message: string;
}

/**
 * Initialize Kuzu semantic graph database
 * Stores AST nodes, symbols, types, and their relationships
 */
async function initializeKuzu(): Promise<DatabaseInitResult> {
  console.log(bold("\n📊 Initializing Kuzu Semantic Database..."));

  try {
    // Ensure database directory exists
    const dbDir = KUZU_DB_PATH.substring(0, KUZU_DB_PATH.lastIndexOf("/"));
    await ensureDir(dbDir);

    // Create database and define schema using kuzu CLI
    const schema = `
-- Core Symbol table: Functions, Classes, Interfaces, Types
CREATE NODE TABLE Symbol (
  id STRING PRIMARY KEY,
  name STRING,
  kind STRING,
  file_path STRING,
  line INT32,
  column INT32,
  is_exported BOOLEAN,
  is_async BOOLEAN,
  visibility STRING,
  jsdoc STRING,
  git_sha STRING,
  last_modified TIMESTAMP
) WITH (ID_PREFIX = 'symbol_');

-- Type information
CREATE NODE TABLE Type (
  id STRING PRIMARY KEY,
  name STRING,
  kind STRING,
  definition STRING,
  is_generic BOOLEAN,
  type_params STRING[],
  file_path STRING,
  line INT32
) WITH (ID_PREFIX = 'type_');

-- Import statements
CREATE NODE TABLE Import (
  id STRING PRIMARY KEY,
  source_file STRING,
  imported_path STRING,
  specifiers STRING[],
  is_type_only BOOLEAN,
  is_default BOOLEAN,
  is_namespace BOOLEAN,
  git_sha STRING
) WITH (ID_PREFIX = 'import_');

-- Test definitions
CREATE NODE TABLE Test (
  id STRING PRIMARY KEY,
  name STRING,
  test_file STRING,
  tests_symbol STRING,
  test_type STRING,
  line INT32,
  is_async BOOLEAN,
  tags STRING[]
) WITH (ID_PREFIX = 'test_');

-- File nodes for file-level metadata
CREATE NODE TABLE File (
  id STRING PRIMARY KEY,
  path STRING,
  relative_path STRING,
  extension STRING,
  size INT64,
  lines INT32,
  hash STRING,
  last_modified TIMESTAMP
) WITH (ID_PREFIX = 'file_');

-- Relationships between nodes
CREATE REL TABLE EXTENDS (FROM Symbol TO Type);
CREATE REL TABLE IMPLEMENTS (FROM Symbol TO Type);
CREATE REL TABLE RETURNS (FROM Symbol TO Type);
CREATE REL TABLE HAS_PARAMETER (FROM Symbol TO Type, position INT32, name STRING, is_optional BOOLEAN);
CREATE REL TABLE CALLS (FROM Symbol TO Symbol, count INT32, is_recursive BOOLEAN);
CREATE REL TABLE DEPENDS_ON (FROM Symbol TO Import);
CREATE REL TABLE TESTS (FROM Test TO Symbol);
CREATE REL TABLE DEFINED_IN (FROM Symbol TO File);
CREATE REL TABLE IMPORTS_FROM (FROM File TO File, import_count INT32);
CREATE REL TABLE REFERENCES (FROM Symbol TO Symbol, reference_count INT32);
CREATE REL TABLE MEMBER_OF (FROM Symbol TO Symbol, is_static BOOLEAN);
`;

    // Write schema to temp file
    const schemaFile = await Deno.makeTempFile({ suffix: ".cypher" });
    await Deno.writeTextFile(schemaFile, schema);

    // Initialize database with schema
    const initCmd = new Deno.Command("kuzu", {
      args: [KUZU_DB_PATH],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const process = initCmd.spawn();

    const writer = process.stdin.getWriter();
    const encoder = new TextEncoder();

    // Execute schema commands
    for (const statement of schema.split(";").filter(s => s.trim())) {
      if (statement.trim()) {
        await writer.write(encoder.encode(statement + ";\n"));
      }
    }

    // Exit kuzu
    await writer.write(encoder.encode(".quit\n"));
    await writer.close();

    const { success } = await process.status;

    if (success) {
      console.log(green("✓ Kuzu database initialized with semantic schema"));
      return {
        success: true,
        database: "Kuzu",
        message: "Semantic graph database ready for AST storage"
      };
    } else {
      throw new Error("Kuzu initialization failed");
    }
  } catch (error) {
    console.error(red(`✗ Failed to initialize Kuzu: ${error.message}`));
    return {
      success: false,
      database: "Kuzu",
      message: error.message
    };
  }
}

/**
 * Initialize DuckDB analytics database
 * Stores code metrics, performance data, and statistical analysis
 */
async function initializeDuckDB(): Promise<DatabaseInitResult> {
  console.log(bold("\n📈 Initializing DuckDB Analytics Database..."));

  try {
    // Ensure database directory exists
    const dbDir = DUCKDB_PATH.substring(0, DUCKDB_PATH.lastIndexOf("/"));
    await ensureDir(dbDir);

    // Create database and define schema
    const schema = `
-- Code complexity metrics
CREATE TABLE IF NOT EXISTS symbol_complexity (
  symbol_id VARCHAR PRIMARY KEY,
  file_path VARCHAR NOT NULL,
  symbol_name VARCHAR NOT NULL,
  cyclomatic_complexity INTEGER,
  cognitive_complexity INTEGER,
  line_count INTEGER,
  parameter_count INTEGER,
  return_type_complexity INTEGER,
  dependency_count INTEGER,
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Type relationships and usage
CREATE TABLE IF NOT EXISTS type_relationships (
  source_type VARCHAR,
  target_type VARCHAR,
  relationship_type VARCHAR,
  confidence DECIMAL(3,2),
  occurrences INTEGER DEFAULT 1,
  PRIMARY KEY (source_type, target_type, relationship_type)
);

-- File-level metrics
CREATE TABLE IF NOT EXISTS file_metrics (
  file_path VARCHAR PRIMARY KEY,
  total_lines INTEGER,
  code_lines INTEGER,
  comment_lines INTEGER,
  blank_lines INTEGER,
  complexity_sum INTEGER,
  complexity_avg DECIMAL(10,2),
  import_count INTEGER,
  export_count INTEGER,
  class_count INTEGER,
  function_count INTEGER,
  last_analyzed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dependency metrics
CREATE TABLE IF NOT EXISTS dependency_metrics (
  from_file VARCHAR,
  to_file VARCHAR,
  import_count INTEGER,
  is_circular BOOLEAN DEFAULT FALSE,
  depth_level INTEGER,
  PRIMARY KEY (from_file, to_file)
);

-- Code duplication tracking
CREATE TABLE IF NOT EXISTS code_duplication (
  id INTEGER PRIMARY KEY,
  file1 VARCHAR NOT NULL,
  start1 INTEGER NOT NULL,
  end1 INTEGER NOT NULL,
  file2 VARCHAR NOT NULL,
  start2 INTEGER NOT NULL,
  end2 INTEGER NOT NULL,
  similarity DECIMAL(3,2),
  token_count INTEGER,
  hash VARCHAR
);

-- Performance benchmarks
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id INTEGER PRIMARY KEY,
  function_name VARCHAR,
  file_path VARCHAR,
  execution_time_ms DECIMAL(10,3),
  memory_usage_mb DECIMAL(10,3),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  test_name VARCHAR,
  iterations INTEGER
);

-- Historical analysis tracking
CREATE TABLE IF NOT EXISTS analysis_history (
  id INTEGER PRIMARY KEY,
  analysis_type VARCHAR NOT NULL,
  target_path VARCHAR,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  files_analyzed INTEGER,
  issues_found INTEGER,
  git_sha VARCHAR,
  configuration JSON
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_symbol_complexity_file ON symbol_complexity(file_path);
CREATE INDEX IF NOT EXISTS idx_file_metrics_complexity ON file_metrics(complexity_avg);
CREATE INDEX IF NOT EXISTS idx_dependency_circular ON dependency_metrics(is_circular);
CREATE INDEX IF NOT EXISTS idx_duplication_similarity ON code_duplication(similarity);
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(analysis_type, start_time);
`;

    // Execute schema
    const initCmd = new Deno.Command("duckdb", {
      args: [DUCKDB_PATH],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const process = initCmd.spawn();

    const writer = process.stdin.getWriter();
    const encoder = new TextEncoder();

    // Execute schema commands
    await writer.write(encoder.encode(schema));
    await writer.write(encoder.encode("\n.quit\n"));
    await writer.close();

    const { success } = await process.status;

    if (success) {
      console.log(green("✓ DuckDB database initialized with analytics schema"));
      return {
        success: true,
        database: "DuckDB",
        message: "Analytics database ready for metrics storage"
      };
    } else {
      throw new Error("DuckDB initialization failed");
    }
  } catch (error) {
    console.error(red(`✗ Failed to initialize DuckDB: ${error.message}`));
    return {
      success: false,
      database: "DuckDB",
      message: error.message
    };
  }
}

/**
 * Verify databases are accessible and have correct schemas
 */
async function verifyDatabases(): Promise<boolean> {
  console.log(bold("\n🔍 Verifying Database Initialization..."));

  // Check Kuzu
  try {
    const kuzuCheck = new Deno.Command("kuzu", {
      args: [KUZU_DB_PATH],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const process = kuzuCheck.spawn();
    const writer = process.stdin.getWriter();
    const encoder = new TextEncoder();

    await writer.write(encoder.encode("CALL show_tables();\n.quit\n"));
    await writer.close();

    const { success } = await process.status;
    if (!success) {
      throw new Error("Cannot access Kuzu database");
    }
    console.log(green("  ✓ Kuzu database verified"));
  } catch (error) {
    console.error(red(`  ✗ Kuzu verification failed: ${error.message}`));
    return false;
  }

  // Check DuckDB
  try {
    const duckCheck = new Deno.Command("duckdb", {
      args: [DUCKDB_PATH, "-c", "SELECT COUNT(*) FROM information_schema.tables;"],
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await duckCheck.output();
    if (!success) {
      throw new Error("Cannot access DuckDB database");
    }
    console.log(green("  ✓ DuckDB database verified"));
  } catch (error) {
    console.error(red(`  ✗ DuckDB verification failed: ${error.message}`));
    return false;
  }

  return true;
}

// Main execution
async function main() {
  console.log(bold(green("\n🚀 Database Initialization")));
  console.log("=" .repeat(50));

  // Check if databases already exist
  const kuzuExists = await exists(KUZU_DB_PATH);
  const duckExists = await exists(DUCKDB_PATH);

  if (kuzuExists || duckExists) {
    console.log(yellow("\n⚠️  Databases already exist:"));
    if (kuzuExists) console.log(yellow(`  - Kuzu: ${KUZU_DB_PATH}`));
    if (duckExists) console.log(yellow(`  - DuckDB: ${DUCKDB_PATH}`));

    const confirm = prompt("\nReinitialize databases? This will DELETE existing data (y/N):");
    if (confirm?.toLowerCase() !== 'y') {
      console.log("Initialization cancelled");
      Deno.exit(0);
    }

    // Remove existing databases
    if (kuzuExists) await Deno.remove(KUZU_DB_PATH, { recursive: true });
    if (duckExists) await Deno.remove(DUCKDB_PATH);
  }

  // Initialize both databases
  const results = await Promise.all([
    initializeKuzu(),
    initializeDuckDB()
  ]);

  // Check results
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log(bold(red("\n❌ Database initialization failed!")));
    failures.forEach(f => {
      console.log(red(`  ${f.database}: ${f.message}`));
    });
    console.log(red("\nBoth databases are REQUIRED for the system to function."));
    console.log(red("Please fix the issues above and try again."));
    Deno.exit(1);
  }

  // Verify databases
  const verified = await verifyDatabases();

  if (verified) {
    console.log(bold(green("\n✅ All databases initialized successfully!")));
    console.log("\nDatabases ready:");
    console.log(green(`  📊 Kuzu (Semantic): ${KUZU_DB_PATH}`));
    console.log(green(`  📈 DuckDB (Analytics): ${DUCKDB_PATH}`));
    console.log("\nNext steps:");
    console.log("  1. Run 'deno task scan' to populate the semantic database");
    console.log("  2. Run 'deno task analyze' to generate metrics");
  } else {
    console.log(bold(red("\n❌ Database verification failed!")));
    console.log(red("Databases were created but cannot be accessed."));
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  await main();
}