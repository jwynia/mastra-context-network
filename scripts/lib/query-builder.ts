/**
 * QueryBuilder - Fluent API for building Cypher queries
 * Provides type-safe query construction and common query patterns
 */

export interface QueryBuilderOptions {
  parameters?: Record<string, any>;
}

export class QueryBuilder {
  private matchClauses: string[] = [];
  private whereClauses: string[] = [];
  private returnClauses: string[] = [];
  private orderByClauses: string[] = [];
  private limitValue?: number;
  private skipValue?: number;
  private parameters: Record<string, any> = {};

  constructor(options?: QueryBuilderOptions) {
    if (options?.parameters) {
      this.parameters = { ...options.parameters };
    }
  }

  /**
   * Add a MATCH clause
   */
  match(pattern: string): this {
    this.matchClauses.push(pattern);
    return this;
  }

  /**
   * Add a WHERE clause (conditions are AND'd together)
   */
  where(condition: string): this {
    this.whereClauses.push(condition);
    return this;
  }

  /**
   * Add a RETURN clause
   */
  return(expression: string): this {
    this.returnClauses.push(expression);
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(expression: string, direction: "ASC" | "DESC" = "ASC"): this {
    this.orderByClauses.push(`${expression} ${direction}`);
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Set SKIP
   */
  skip(count: number): this {
    this.skipValue = count;
    return this;
  }

  /**
   * Build the complete Cypher query
   */
  build(): string {
    const parts: string[] = [];

    // MATCH clauses
    if (this.matchClauses.length > 0) {
      parts.push(`MATCH ${this.matchClauses.join(", ")}`);
    }

    // WHERE clauses
    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(" AND ")}`);
    }

    // RETURN clauses
    if (this.returnClauses.length > 0) {
      parts.push(`RETURN ${this.returnClauses.join(", ")}`);
    }

    // ORDER BY
    if (this.orderByClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderByClauses.join(", ")}`);
    }

    // SKIP
    if (this.skipValue !== undefined) {
      parts.push(`SKIP ${this.skipValue}`);
    }

    // LIMIT
    if (this.limitValue !== undefined) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    return parts.join("\n");
  }

  /**
   * Get the query with parameters
   */
  getQuery(): { query: string; parameters: Record<string, any> } {
    return {
      query: this.build(),
      parameters: this.parameters,
    };
  }
}

/**
 * Query template builder for common patterns
 */
export class QueryTemplates {
  /**
   * Find all callers of a specific function
   */
  static findCallers(symbolName: string): QueryBuilder {
    return new QueryBuilder()
      .match("(caller:Symbol)-[:CALLS]->(target:Symbol)")
      .where(`target.name = '${this.escapeCypher(symbolName)}'`)
      .return("caller.name AS caller", "caller.file AS file", "caller.line AS line")
      .orderBy("caller.file");
  }

  /**
   * Find what a function calls
   */
  static findCallees(symbolName: string): QueryBuilder {
    return new QueryBuilder()
      .match("(caller:Symbol)-[:CALLS]->(callee:Symbol)")
      .where(`caller.name = '${this.escapeCypher(symbolName)}'`)
      .return("callee.name AS callee", "callee.file AS file", "callee.line AS line")
      .orderBy("callee.name");
  }

  /**
   * Find all exports from a file
   */
  static findExports(filePath: string): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where(`s.file = '${this.escapeCypher(filePath)}'`)
      .where("s.exported = true")
      .return("s.name AS name", "s.kind AS kind", "s.line AS line")
      .orderBy("s.line");
  }

  /**
   * Find all imports in a file
   */
  static findImports(filePath: string): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where(`i.source_file = '${this.escapeCypher(filePath)}'`)
      .return("i.imported_path AS path", "i.specifiers AS specifiers")
      .orderBy("i.imported_path");
  }

  /**
   * Find all symbols in a file
   */
  static findSymbolsInFile(filePath: string): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where(`s.file = '${this.escapeCypher(filePath)}'`)
      .return("s.name AS name", "s.kind AS kind", "s.line AS line", "s.exported AS exported")
      .orderBy("s.line");
  }

  /**
   * Find dependencies of a file (what it imports from)
   */
  static findDependencies(filePath: string): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where(`i.source_file = '${this.escapeCypher(filePath)}'`)
      .return("DISTINCT i.imported_path AS dependency")
      .orderBy("dependency");
  }

  /**
   * Find dependents of a file (what imports from it)
   */
  static findDependents(filePath: string): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where(`i.imported_path CONTAINS '${this.escapeCypher(filePath)}'`)
      .return("DISTINCT i.source_file AS dependent")
      .orderBy("dependent");
  }

  /**
   * Find all classes
   */
  static findClasses(): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where("s.kind = 'class'")
      .return("s.name AS name", "s.file AS file", "s.line AS line")
      .orderBy("s.name");
  }

  /**
   * Find class members
   */
  static findClassMembers(className: string): QueryBuilder {
    return new QueryBuilder()
      .match("(member:Symbol)-[:MEMBER_OF]->(class:Symbol)")
      .where(`class.name = '${this.escapeCypher(className)}'`)
      .return("member.name AS name", "member.kind AS kind", "member.line AS line")
      .orderBy("member.line");
  }

  /**
   * Find type hierarchy (what a class/interface extends)
   */
  static findExtends(symbolName: string): QueryBuilder {
    return new QueryBuilder()
      .match("(symbol:Symbol)-[:EXTENDS]->(type:Type)")
      .where(`symbol.name = '${this.escapeCypher(symbolName)}'`)
      .return("type.name AS extends")
      .orderBy("type.name");
  }

  /**
   * Find implementations (what implements an interface)
   */
  static findImplementations(typeName: string): QueryBuilder {
    return new QueryBuilder()
      .match("(symbol:Symbol)-[:IMPLEMENTS]->(type:Type)")
      .where(`type.name = '${this.escapeCypher(typeName)}'`)
      .return("symbol.name AS implementation", "symbol.file AS file", "symbol.line AS line")
      .orderBy("symbol.name");
  }

  /**
   * Find call graph at depth N
   */
  static findCallGraph(symbolName: string, depth: number = 2): QueryBuilder {
    return new QueryBuilder()
      .match(`(start:Symbol)-[:CALLS*1..${depth}]->(end:Symbol)`)
      .where(`start.name = '${this.escapeCypher(symbolName)}'`)
      .return("end.name AS symbol", "end.file AS file", "end.line AS line")
      .orderBy("end.file");
  }

  /**
   * Find unused exports (exported but never imported)
   */
  static findUnusedExports(): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where("s.exported = true")
      .where("NOT exists((i:Import) WHERE i.specifiers CONTAINS s.name)")
      .return("s.name AS unused_export", "s.file AS file", "s.line AS line")
      .orderBy("s.file");
  }

  /**
   * Escape Cypher special characters
   */
  private static escapeCypher(str: string): string {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  // ============================================================================
  // MASTRA-SPECIFIC QUERY TEMPLATES
  // ============================================================================

  /**
   * Find all Mastra agents (createAgent calls)
   */
  static findMastraAgents(): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where("s.name = 'createAgent'")
      .return("s.file AS file", "s.line AS line")
      .orderBy("s.file");
  }

  /**
   * Find all Mastra workflows (createWorkflow calls)
   */
  static findMastraWorkflows(): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where("s.name = 'createWorkflow'")
      .return("s.file AS file", "s.line AS line")
      .orderBy("s.file");
  }

  /**
   * Find all Mastra tools (createTool calls)
   */
  static findMastraTools(): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where("s.name = 'createTool'")
      .return("s.file AS file", "s.line AS line")
      .orderBy("s.file");
  }

  /**
   * Find Mastra integrations (imports from @mastra/*)
   */
  static findMastraIntegrations(): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where("i.imported_path CONTAINS '@mastra/'")
      .return("DISTINCT i.source_file AS file", "i.imported_path AS integration")
      .orderBy("file");
  }

  /**
   * Find agent tool usage (what tools does an agent use)
   */
  static findAgentTools(agentFile: string): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where(`i.source_file = '${this.escapeCypher(agentFile)}'`)
      .where("i.imported_path CONTAINS 'tool'")
      .return("i.imported_path AS tool", "i.specifiers AS imported")
      .orderBy("tool");
  }

  /**
   * Find workflow steps (createStep calls in a workflow file)
   */
  static findWorkflowSteps(workflowFile: string): QueryBuilder {
    return new QueryBuilder()
      .match("(s:Symbol)")
      .where(`s.file = '${this.escapeCypher(workflowFile)}'`)
      .where("s.name = 'createStep'")
      .return("s.name AS step", "s.line AS line")
      .orderBy("s.line");
  }

  /**
   * Find model usage (OpenAI, Anthropic, etc.)
   */
  static findModelUsage(): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where("i.imported_path CONTAINS 'openai' OR i.imported_path CONTAINS 'anthropic' OR i.imported_path CONTAINS '@mastra/'")
      .return("DISTINCT i.source_file AS file", "i.imported_path AS model_provider")
      .orderBy("file");
  }

  /**
   * Find LLM provider usage
   */
  static findLLMProviders(): QueryBuilder {
    return new QueryBuilder()
      .match("(i:Import)")
      .where("i.imported_path CONTAINS 'openai' OR i.imported_path CONTAINS 'anthropic' OR i.imported_path CONTAINS 'claude' OR i.imported_path CONTAINS 'llama'")
      .return("DISTINCT i.imported_path AS provider", "COUNT(i.source_file) AS usage_count")
      .orderBy("usage_count", "DESC");
  }
}
