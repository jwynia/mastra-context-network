#!/usr/bin/env -S deno run -A

/**
 * Test script to verify library modules work correctly
 */

import { ASTAnalyzer } from "./lib/ast-analyzer.ts";
import { kuzuClient } from "./lib/kuzu-client.ts";
import { duckdbClient } from "./lib/duckdb-client.ts";
import { logger } from "./utils/logger.ts";

logger.section("Testing Library Modules");

// Test AST Analyzer
logger.subsection("Testing AST Analyzer");
try {
  const analyzer = new ASTAnalyzer();
  logger.success("AST Analyzer instantiated");
  
  // Test with a simple TypeScript file
  const testCode = `
export function testFunction(x: number): number {
  return x * 2;
}

export interface TestInterface {
  id: string;
  value: number;
}

export class TestClass {
  constructor(private name: string) {}
  
  getName(): string {
    return this.name;
  }
}
  `;
  
  // Create a temporary test file
  await Deno.writeTextFile("/tmp/test.ts", testCode);
  
  // Analyze it
  const sourceFiles = analyzer.addSourceFiles(["/tmp/test.ts"]);
  const results = analyzer.analyzeFile(sourceFiles[0]);
  
  logger.info(`Found ${results.symbols.length} symbols`);
  logger.info(`Found ${results.types.length} types`);
  logger.info(`Found ${results.imports.length} imports`);
  logger.info(`Found ${results.relationships.length} relationships`);
  
  // Show some details
  for (const symbol of results.symbols) {
    logger.debug(`  Symbol: ${symbol.name} (${symbol.kind})`);
  }
  
  logger.success("AST Analyzer working correctly");
} catch (error) {
  logger.error(`AST Analyzer test failed: ${error}`);
}

// Test Kuzu Client
logger.subsection("Testing Kuzu Client");
try {
  await kuzuClient.initialize();
  logger.success("Kuzu Client initialized");
  
  // Test a simple query
  const result = await kuzuClient.query("RETURN 'Hello from Kuzu' as message");
  logger.info(`Query result: ${JSON.stringify(result.rows)}`);
  
  // Test stats
  const stats = await kuzuClient.getStats();
  logger.info(`Database stats: ${JSON.stringify(stats)}`);
  
  logger.success("Kuzu Client working correctly");
} catch (error) {
  logger.error(`Kuzu Client test failed: ${error}`);
}

// Test DuckDB Client
logger.subsection("Testing DuckDB Client");
try {
  await duckdbClient.initialize();
  logger.success("DuckDB Client initialized");
  
  // Test a simple query
  const result = await duckdbClient.query("SELECT 'Hello from DuckDB' as message");
  logger.info(`Query result: ${JSON.stringify(result.rows)}`);
  
  // Test stats
  const stats = await duckdbClient.getStats();
  logger.info(`Database stats:`);
  for (const [key, value] of Object.entries(stats)) {
    logger.info(`  ${key}: ${value}`);
  }
  
  logger.success("DuckDB Client working correctly");
} catch (error) {
  logger.error(`DuckDB Client test failed: ${error}`);
}

logger.section("All Library Tests Complete");

// Clean up
try {
  await Deno.remove("/tmp/test.ts");
} catch {}
