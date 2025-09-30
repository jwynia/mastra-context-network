#!/usr/bin/env -S deno run --allow-run --allow-env --allow-read --allow-write

/**
 * Kuzu database query helper - TypeScript/Deno version
 * Replaces the Python script with pure TypeScript
 */

import { parse } from "@std/flags";
import { exec } from "https://deno.land/x/exec@0.0.5/mod.ts";

interface QueryOptions {
  query: string;
  format?: "json" | "csv" | "table";
  database?: string;
  output?: string;
}

async function executeKuzuQuery(options: QueryOptions) {
  const dbPath = options.database || Deno.env.get("KUZU_DB_PATH") || "/workspace/.kuzu-db";
  
  // Build the kuzu CLI command
  const kuzuCommand = [
    "kuzu",
    dbPath,
    "-c",
    options.query
  ];

  if (options.format === "csv") {
    kuzuCommand.push("--csv");
  }

  try {
    const result = await exec(kuzuCommand.join(" "));
    
    if (options.format === "json") {
      // Parse the output and convert to JSON
      const lines = result.output.trim().split("\n");
      const parsed = parseKuzuOutput(lines);
      const jsonOutput = JSON.stringify(parsed, null, 2);
      
      if (options.output) {
        await Deno.writeTextFile(options.output, jsonOutput);
        console.log(`Output written to ${options.output}`);
      } else {
        console.log(jsonOutput);
      }
    } else {
      console.log(result.output);
    }
  } catch (error) {
    console.error("Error executing Kuzu query:", error);
    Deno.exit(1);
  }
}

function parseKuzuOutput(lines: string[]): any[] {
  // Parse Kuzu table output into JSON
  // Skip header and separator lines
  const dataLines = lines.filter(line => 
    line.trim() && 
    !line.startsWith("+") && 
    !line.startsWith("|---")
  );
  
  if (dataLines.length === 0) return [];
  
  // Extract headers
  const headerLine = dataLines[0];
  const headers = headerLine.split("|")
    .map(h => h.trim())
    .filter(h => h);
  
  // Parse data rows
  const results = [];
  for (let i = 1; i < dataLines.length; i++) {
    const values = dataLines[i].split("|")
      .map(v => v.trim())
      .filter(v => v);
    
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = parseValue(values[idx]);
      });
      results.push(row);
    }
  }
  
  return results;
}

function parseValue(value: string): any {
  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  // Try to parse as boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  // Try to parse as null
  if (value.toLowerCase() === "null") return null;
  // Return as string
  return value;
}

// Predefined useful queries
const QUERY_TEMPLATES = {
  "find-interface": (name: string) => 
    `MATCH (s:Symbol {kind: 'interface', name: '${name}'}) RETURN s`,
  
  "find-implementations": (interfaceName: string) =>
    `MATCH (i:Symbol {kind: 'interface', name: '${interfaceName}'})<-[:IMPLEMENTS]-(c:Symbol) RETURN c`,
  
  "find-extends": (className: string) =>
    `MATCH (c:Symbol {name: '${className}'})-[:EXTENDS]->(p:Symbol) RETURN p`,
  
  "module-deps": (modulePath: string) =>
    `MATCH (m:Module {path: '${modulePath}'})-[:IMPORTS]->(dep:Module) RETURN dep.path as dependency`,
  
  "unused-exports": () =>
    `MATCH (s:Symbol {exported: true}) WHERE NOT EXISTS { MATCH (s)<-[:REFERENCES]-() } RETURN s.name as unused_export, s.file as file`,
  
  "circular-deps": () =>
    `MATCH path = (m1:Module)-[:IMPORTS*2..10]->(m1) RETURN nodes(path) as circular_path`,
  
  "type-hierarchy": (typeName: string) =>
    `MATCH path = (s:Symbol {name: '${typeName}'})-[:EXTENDS|IMPLEMENTS*]->(parent) RETURN path`
};

// Cliffy Command export for CLI router
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

export const queryCommand = new Command()
  .description("Query the semantic graph database using natural language or Cypher")
  .arguments("[query:string]")
  .option("-q, --query <query:string>", "Cypher query to execute")
  .option("-t, --template <template:string>", "Use a predefined query template")
  .option("-f, --format <format:string>", "Output format: json, csv, table", { default: "table" })
  .option("-d, --database <path:string>", "Database path (defaults to KUZU_DB_PATH env)")
  .option("-o, --output <file:string>", "Write output to file")
  .example("Direct query", 'ts-agent query "MATCH (n:Symbol) RETURN n LIMIT 10"')
  .example("Use template", 'ts-agent query -t find-interface User')
  .example("JSON output", 'ts-agent query -q "MATCH (n) RETURN n" -f json')
  .example("List templates", "ts-agent query --help")
  .action(async (options, ...args) => {
    let query: string;

    if (options.template) {
      const template = QUERY_TEMPLATES[options.template as keyof typeof QUERY_TEMPLATES];

      if (!template) {
        console.error(`Unknown template: ${options.template}`);
        console.log("Available templates:", Object.keys(QUERY_TEMPLATES).join(", "));
        Deno.exit(1);
      }

      query = typeof template === "function"
        ? (template as any)(...args)
        : template;
    } else {
      query = options.query || args[0]?.toString();

      if (!query) {
        console.error("No query provided. Use --query or provide as argument.");
        Deno.exit(1);
      }
    }

    await executeKuzuQuery({
      query,
      format: options.format as any,
      database: options.database,
      output: options.output
    });
  });

if (import.meta.main) {
  const flags = parse(Deno.args, {
    string: ["query", "q", "template", "t", "format", "f", "database", "d", "output", "o"],
    default: {
      format: "table"
    }
  });

  let query: string;

  if (flags.template || flags.t) {
    const templateName = flags.template || flags.t;
    const templateArgs = flags._.map(String);
    const template = QUERY_TEMPLATES[templateName as keyof typeof QUERY_TEMPLATES];

    if (!template) {
      console.error(`Unknown template: ${templateName}`);
      console.log("Available templates:", Object.keys(QUERY_TEMPLATES).join(", "));
      Deno.exit(1);
    }

    query = typeof template === "function"
      ? (template as any)(...templateArgs)
      : template;
  } else {
    query = flags.query || flags.q || flags._[0]?.toString();

    if (!query) {
      console.error("No query provided. Use --query or -q flag.");
      Deno.exit(1);
    }
  }

  await executeKuzuQuery({
    query,
    format: (flags.format || flags.f) as any,
    database: flags.database || flags.d,
    output: flags.output || flags.o
  });
}