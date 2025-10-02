/**
 * Kuzu Graph Database Client - Handles all graph database operations
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { config } from "../utils/config.ts";
import { logger } from "../utils/logger.ts";
import type { ExtractedSymbol, ExtractedType, ExtractedImport, Relationship } from "./ast-analyzer.ts";

const execAsync = promisify(exec);

export interface QueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  executionTime?: number;
}

export interface NodeData {
  id: string;
  [key: string]: any;
}

export interface EdgeData {
  from: string;
  to: string;
  type: string;
  [key: string]: any;
}

export class KuzuClient {
  private dbPath: string;
  private isInitialized = false;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || config.get("kuzuDbPath");
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!existsSync(this.dbPath)) {
      throw new Error(`Kuzu database not found at ${this.dbPath}. Run 'deno task db:init' first.`);
    }

    // Test connection with a simple query
    try {
      await this.query("MATCH (n) RETURN COUNT(n) as count LIMIT 1");
      this.isInitialized = true;
      logger.debug(`Kuzu client initialized with database at ${this.dbPath}`);
    } catch (error) {
      throw new Error(`Failed to connect to Kuzu database: ${error}`);
    }
  }

  /**
   * Execute a Cypher query
   */
  async query(cypher: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Write query to temp file
      const tempFile = `/tmp/kuzu_query_${Date.now()}.cypher`;
      await Deno.writeTextFile(tempFile, cypher);

      // Debug: Check what's in the file
      if (cypher.includes("CREATE")) {
        const fileContent = await Deno.readTextFile(tempFile);
        logger.debug(`Temp file ${tempFile} contains: ${fileContent.substring(0, 200)}`);
      }

      // Use Deno's Command API with file input
      const command = new Deno.Command("sh", {
        args: ["-c", `kuzu ${this.dbPath} < ${tempFile} 2>&1`],
        stdout: "piped",
        stderr: "piped",
      });

      const { stdout, success, code } = await command.output();
      const stdoutText = new TextDecoder().decode(stdout);

      // Clean up temp file
      try {
        await Deno.remove(tempFile);
      } catch {}

      if (!success) {
        logger.error(`Kuzu command failed with code ${code}`);
        logger.error(`Output: ${stdoutText}`);
        throw new Error(`Kuzu query failed with exit code ${code}`);
      }

      // Debug output for CREATE queries
      if (cypher.includes("CREATE") && logger) {
        logger.debug(`Kuzu output for CREATE: ${stdoutText.substring(0, 200)}`);
      }

      const result = this.parseQueryOutput(stdoutText);
      result.executionTime = Date.now() - startTime;

      return result;
    } catch (error) {
      logger.error(`Query failed: ${cypher}`);
      throw error;
    }
  }

  /**
   * Parse Kuzu query output into structured result
   */
  private parseQueryOutput(output: string): QueryResult {
    // Remove ANSI escape codes and control characters
    const cleanOutput = output
      .replace(/\x1b\[[0-9;]*m/g, '') // Remove color codes
      .replace(/\x1b\[[0-9]*[A-Z]/g, '') // Remove cursor movement
      .replace(/\[2K/g, ''); // Remove clear line codes

    const lines = cleanOutput.trim().split('\n').filter(line => line.trim());

    // Handle empty results
    if (lines.length === 0) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    // Skip initial database opening message
    const dataStartIndex = lines.findIndex(l => l.includes('┌') || l.includes('│'));
    if (dataStartIndex === -1) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    const dataLines = lines.slice(dataStartIndex);

    // Extract column names from the table
    const headerLine = dataLines.find(l => l.includes('│') && !l.includes('┌') && !l.includes('└') && !l.includes('├'));
    if (!headerLine) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    const columns = headerLine
      .split('│')
      .map(c => c.trim())
      .filter(c => c.length > 0 && c !== '');

    // Extract data rows (skip header, type row, and separators)
    const rows: any[] = [];
    let inDataSection = false;

    for (const line of dataLines) {
      // Skip decorative lines
      if (line.includes('┌') || line.includes('└') || line.includes('├') || line.includes('─')) {
        if (line.includes('├')) {
          inDataSection = true;
        }
        continue;
      }

      // Skip type row (e.g., "│ INT64 │")
      if (!inDataSection) {
        continue;
      }

      // Process data rows
      if (line.includes('│') && !line.includes('tuple') && !line.includes('column')) {
        const values = line
          .split('│')
          .map(v => v.trim())
          .filter(v => v !== '');

        if (values.length === columns.length) {
          const row: any = {};
          columns.forEach((col, i) => {
            // Try to parse numbers
            const val = values[i];
            if (/^\d+$/.test(val)) {
              row[col] = parseInt(val);
            } else if (/^\d+\.\d+$/.test(val)) {
              row[col] = parseFloat(val);
            } else if (val === 'true' || val === 'false') {
              row[col] = val === 'true';
            } else {
              row[col] = val;
            }
          });
          rows.push(row);
        }
      }
    }

    return {
      rows,
      columns,
      rowCount: rows.length
    };
  }

  /**
   * Insert symbols into the graph
   */
  async insertSymbols(symbols: ExtractedSymbol[]): Promise<void> {
    if (symbols.length === 0) return;

    const queries: string[] = [];
    
    for (const symbol of symbols) {
      const props = this.escapeProperties({
        id: symbol.id,
        name: symbol.name,
        kind: symbol.kind,
        file: symbol.filePath,
        line: symbol.line,
        col: symbol.column,
        exported: symbol.isExported,
        gitSha: '' // We'll add git support later
      });

      const query = `CREATE (:Symbol ${this.formatProperties(props)});`;  // Added semicolon
      queries.push(query);
    }

    // Execute in batches
    await this.executeBatch(queries);
  }

  /**
   * Insert types into the graph
   */
  async insertTypes(types: ExtractedType[]): Promise<void> {
    if (types.length === 0) return;

    const queries: string[] = [];
    
    for (const type of types) {
      const props = this.escapeProperties({
        id: type.id,
        name: type.name,
        primitive: false, // We'll determine this based on the type
        generic: type.isGeneric,
        nullable: false, // We'll add nullable detection later
        readonly: false // We'll add readonly detection later
      });

      queries.push(
        `CREATE (:Type ${this.formatProperties(props)});`
      );
    }

    await this.executeBatch(queries);
  }

  /**
   * Insert imports into the graph
   */
  async insertImports(imports: ExtractedImport[]): Promise<void> {
    // TODO: The Import node table doesn't exist in the current schema
    // We'll need to update the schema to support imports
    // For now, we'll skip import insertion
    return;
  }

  /**
   * Insert relationships into the graph
   */
  async insertRelationships(relationships: Relationship[]): Promise<void> {
    if (relationships.length === 0) return;

    const queries: string[] = [];

    for (const rel of relationships) {
      // For MEMBER_OF relationships, the 'from' is a method/property name and 'to' is a class name
      // We need to match by name since we don't have IDs for the relationship endpoints
      // Skip creating the nodes - they should already exist from symbol insertion

      // Create relationship between existing nodes
      const metadata = rel.metadata ? this.formatProperties(rel.metadata) : "";
      queries.push(
        `MATCH (from:Symbol {name: '${this.escapeCypher(rel.from)}'}), ` +
        `(to:Symbol {name: '${this.escapeCypher(rel.to)}'}) ` +
        `CREATE (from)-[:${rel.type}${metadata}]->(to);`
      );
    }

    await this.executeBatch(queries);
  }

  /**
   * Execute queries in batches for performance
   */
  private async executeBatch(queries: string[], batchSize = 10): Promise<void> {
    logger.debug(`Executing ${queries.length} queries in batches of ${batchSize}`);

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);

      // Execute queries one by one for now (batching might not work with CREATE)
      for (const q of batch) {
        try {
          const result = await this.query(q);
          if (result.rowCount === 0 && q.startsWith('CREATE')) {
            // For CREATE queries, no rows returned is normal
            logger.debug(`Created node/edge successfully`);
          }
        } catch (error) {
          logger.error(`Failed to execute query: ${q}`);
          logger.error(`Error: ${error}`);
          throw error; // Re-throw to stop batch
        }
      }

      logger.debug(`Executed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(queries.length / batchSize)}`);
    }
  }

  /**
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    await this.query("MATCH (n) DETACH DELETE n");
    logger.info("Cleared all data from Kuzu database");
  }

  /**
   * Get statistics about the graph
   */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    // Count nodes by label
    const nodeLabels = ['Symbol', 'Type', 'Import', 'File', 'Module'];
    for (const label of nodeLabels) {
      const result = await this.query(`MATCH (n:${label}) RETURN COUNT(n) as count`);
      stats[`${label.toLowerCase()}s`] = parseInt(result.rows[0]?.count || '0');
    }

    // Count relationships
    const relTypes = ['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS', 'MEMBER_OF'];
    for (const relType of relTypes) {
      const result = await this.query(`MATCH ()-[r:${relType}]->() RETURN COUNT(r) as count`);
      stats[`rel_${relType.toLowerCase()}`] = parseInt(result.rows[0]?.count || '0');
    }

    return stats;
  }

  /**
   * Find symbols by pattern
   */
  async findSymbols(pattern: Partial<ExtractedSymbol>): Promise<ExtractedSymbol[]> {
    const conditions: string[] = [];
    
    if (pattern.name) conditions.push(`s.name =~ '.*${this.escapeCypher(pattern.name)}.*'`);
    if (pattern.kind) conditions.push(`s.kind = '${this.escapeCypher(pattern.kind)}'`);
    if (pattern.filePath) conditions.push(`s.filePath =~ '.*${this.escapeCypher(pattern.filePath)}.*'`);
    if (pattern.isExported !== undefined) conditions.push(`s.isExported = ${pattern.isExported}`);
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `MATCH (s:Symbol) ${whereClause} RETURN s`;
    
    const result = await this.query(query);
    return result.rows.map(row => this.parseSymbolNode(row.s));
  }

  /**
   * Get call graph for a function
   */
  async getCallGraph(functionName: string, depth = 2): Promise<any> {
    const query = `
      MATCH path = (start:Symbol {name: '${this.escapeCypher(functionName)}'})
        -[:CALLS*1..${depth}]->(end:Symbol)
      RETURN path
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Get dependency graph for a module
   */
  async getDependencyGraph(filePath: string): Promise<any> {
    const query = `
      MATCH (file:File {path: '${this.escapeCypher(filePath)}'})
        -[:IMPORTS]->(imported:File)
      RETURN file, imported
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Helper to escape Cypher string
   */
  private escapeCypher(str: string): string {
    return str.replace(/'/g, "\\'")
              .replace(/"/g, '\\"')
              .replace(/\\/g, '\\\\');
  }

  /**
   * Helper to escape property values
   */
  private escapeProperties(props: Record<string, any>): Record<string, any> {
    const escaped: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        escaped[key] = this.escapeCypher(value);
      } else {
        escaped[key] = value;
      }
    }
    
    return escaped;
  }

  /**
   * Format properties for Cypher
   */
  private formatProperties(props: Record<string, any>): string {
    const pairs = Object.entries(props).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: '${value}'`;
      } else if (typeof value === 'boolean') {
        return `${key}: ${value}`;
      } else if (typeof value === 'number') {
        return `${key}: ${value}`;
      } else {
        return `${key}: '${JSON.stringify(value)}'`;
      }
    });
    
    return pairs.length > 0 ? `{${pairs.join(', ')}}` : '';
  }

  /**
   * Delete all symbols for a specific file
   */
  async deleteSymbolsByFile(filePath: string): Promise<void> {
    logger.debug(`Deleting symbols for file: ${filePath}`);

    // First, delete relationships connected to symbols from this file
    // This prevents orphaned relationships
    const deleteRelQuery = `
      MATCH (s:Symbol)-[r]->()
      WHERE s.file = '${this.escapeCypher(filePath)}'
      DELETE r;
    `;

    const deleteRelQuery2 = `
      MATCH ()-[r]->(s:Symbol)
      WHERE s.file = '${this.escapeCypher(filePath)}'
      DELETE r;
    `;

    // Delete the symbols themselves
    const deleteSymbolsQuery = `
      MATCH (s:Symbol)
      WHERE s.file = '${this.escapeCypher(filePath)}'
      DELETE s;
    `;

    try {
      await this.query(deleteRelQuery);
      await this.query(deleteRelQuery2);
      await this.query(deleteSymbolsQuery);
      logger.debug(`Deleted all symbols for ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to delete symbols for ${filePath}: ${error}`);
    }
  }

  /**
   * Delete all types for a specific file
   */
  async deleteTypesByFile(filePath: string): Promise<void> {
    logger.debug(`Deleting types for file: ${filePath}`);

    // Delete relationships to types from this file
    const deleteRelQuery = `
      MATCH (t:Type)-[r]->()
      WHERE t.file_path = '${this.escapeCypher(filePath)}'
      DELETE r;
    `;

    const deleteRelQuery2 = `
      MATCH ()-[r]->(t:Type)
      WHERE t.file_path = '${this.escapeCypher(filePath)}'
      DELETE r;
    `;

    // Delete the types themselves
    const deleteTypesQuery = `
      MATCH (t:Type)
      WHERE t.file_path = '${this.escapeCypher(filePath)}'
      DELETE t;
    `;

    try {
      await this.query(deleteRelQuery);
      await this.query(deleteRelQuery2);
      await this.query(deleteTypesQuery);
      logger.debug(`Deleted all types for ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to delete types for ${filePath}: ${error}`);
    }
  }

  /**
   * Delete all imports for a specific file
   */
  async deleteImportsByFile(filePath: string): Promise<void> {
    logger.debug(`Deleting imports for file: ${filePath}`);

    // Delete relationships to imports from this file
    const deleteRelQuery = `
      MATCH (i:Import)-[r]->()
      WHERE i.source_file = '${this.escapeCypher(filePath)}'
      DELETE r;
    `;

    const deleteRelQuery2 = `
      MATCH ()-[r]->(i:Import)
      WHERE i.source_file = '${this.escapeCypher(filePath)}'
      DELETE r;
    `;

    // Delete the imports themselves
    const deleteImportsQuery = `
      MATCH (i:Import)
      WHERE i.source_file = '${this.escapeCypher(filePath)}'
      DELETE i;
    `;

    try {
      await this.query(deleteRelQuery);
      await this.query(deleteRelQuery2);
      await this.query(deleteImportsQuery);
      logger.debug(`Deleted all imports for ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to delete imports for ${filePath}: ${error}`);
    }
  }

  /**
   * Delete all data for a specific file (symbols, types, imports, relationships)
   */
  async deleteFileData(filePath: string): Promise<void> {
    logger.info(`Removing all data for deleted file: ${filePath}`);

    await this.deleteSymbolsByFile(filePath);
    await this.deleteTypesByFile(filePath);
    await this.deleteImportsByFile(filePath);

    logger.success(`Cleaned up all data for ${filePath}`);
  }

  /**
   * Parse a symbol node from query result
   */
  private parseSymbolNode(nodeStr: string): ExtractedSymbol {
    // Parse the node string representation
    // This is a simplified parser - adjust based on actual Kuzu output format
    const props: any = {};
    const matches = nodeStr.match(/{([^}]+)}/);

    if (matches) {
      const propsStr = matches[1];
      const propPairs = propsStr.split(',').map(p => p.trim());

      for (const pair of propPairs) {
        const [key, value] = pair.split(':').map(s => s.trim());
        props[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }

    return {
      id: props.id || '',
      name: props.name || '',
      kind: props.kind || '',
      filePath: props.filePath || '',
      line: parseInt(props.line || '0'),
      column: parseInt(props.column || '0'),
      isExported: props.isExported === 'true',
      isAsync: props.isAsync === 'true',
      visibility: props.visibility || 'public',
      jsdoc: props.jsdoc || ''
    };
  }
}

// Export singleton instance for convenience
export const kuzuClient = new KuzuClient();