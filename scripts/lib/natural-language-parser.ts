/**
 * Natural Language Query Parser
 * Converts simple natural language queries to Cypher using query templates
 */

import { QueryBuilder, QueryTemplates } from "./query-builder.ts";

export interface ParsedQuery {
  builder: QueryBuilder | null;
  rawCypher?: string;
  pattern: string;
  confidence: number;
}

export class NaturalLanguageParser {
  /**
   * Parse a natural language query and convert to Cypher
   */
  static parse(input: string): ParsedQuery {
    const normalized = input.toLowerCase().trim();

    // Pattern: "who calls X" / "what calls X" / "callers of X"
    if (this.matchPattern(normalized, ["who calls", "what calls", "callers of", "find callers"])) {
      const symbolName = this.extractSymbolName(normalized, ["who calls", "what calls", "callers of", "find callers"]);
      return {
        builder: QueryTemplates.findCallers(symbolName),
        pattern: "find-callers",
        confidence: 0.9,
      };
    }

    // Pattern: "what does X call" / "callees of X"
    if (this.matchPattern(normalized, ["what does", "callees of", "calls what"])) {
      const symbolName = this.extractSymbolName(normalized, ["what does", "callees of", "calls what", "call"]);
      return {
        builder: QueryTemplates.findCallees(symbolName),
        pattern: "find-callees",
        confidence: 0.9,
      };
    }

    // Pattern: "exports in X" / "what exports X" / "show exports"
    if (this.matchPattern(normalized, ["exports in", "exports from", "show exports", "list exports"])) {
      const filePath = this.extractFilePath(normalized, ["exports in", "exports from", "show exports", "list exports"]);
      return {
        builder: QueryTemplates.findExports(filePath),
        pattern: "find-exports",
        confidence: 0.85,
      };
    }

    // Pattern: "imports in X" / "what imports X"
    if (this.matchPattern(normalized, ["imports in", "imports from", "show imports", "list imports"])) {
      const filePath = this.extractFilePath(normalized, ["imports in", "imports from", "show imports", "list imports"]);
      return {
        builder: QueryTemplates.findImports(filePath),
        pattern: "find-imports",
        confidence: 0.85,
      };
    }

    // Pattern: "dependencies of X" / "what depends on X" / "deps of X"
    if (this.matchPattern(normalized, ["dependencies of", "deps of", "what does", "imports what"])) {
      const filePath = this.extractFilePath(normalized, ["dependencies of", "deps of", "what does", "import"]);
      return {
        builder: QueryTemplates.findDependencies(filePath),
        pattern: "find-dependencies",
        confidence: 0.9,
      };
    }

    // Pattern: "dependents of X" / "who depends on X" / "who imports X"
    if (this.matchPattern(normalized, ["dependents of", "who depends on", "who imports", "used by"])) {
      const filePath = this.extractFilePath(normalized, ["dependents of", "who depends on", "who imports", "used by"]);
      return {
        builder: QueryTemplates.findDependents(filePath),
        pattern: "find-dependents",
        confidence: 0.9,
      };
    }

    // Pattern: "show classes" / "list classes" / "all classes"
    if (this.matchPattern(normalized, ["show classes", "list classes", "all classes", "find classes"])) {
      return {
        builder: QueryTemplates.findClasses(),
        pattern: "find-classes",
        confidence: 1.0,
      };
    }

    // Pattern: "members of X" / "methods in X" / "properties of X"
    if (this.matchPattern(normalized, ["members of", "methods in", "properties of", "fields in"])) {
      const className = this.extractSymbolName(normalized, ["members of", "methods in", "properties of", "fields in"]);
      return {
        builder: QueryTemplates.findClassMembers(className),
        pattern: "find-members",
        confidence: 0.85,
      };
    }

    // Pattern: "what extends X" / "extends X" / "inheritance of X"
    if (this.matchPattern(normalized, ["what extends", "extends", "inheritance of", "parent of"])) {
      const symbolName = this.extractSymbolName(normalized, ["what extends", "extends", "inheritance of", "parent of"]);
      return {
        builder: QueryTemplates.findExtends(symbolName),
        pattern: "find-extends",
        confidence: 0.9,
      };
    }

    // Pattern: "implementations of X" / "who implements X" / "implements X"
    if (this.matchPattern(normalized, ["implementations of", "who implements", "what implements"])) {
      const typeName = this.extractSymbolName(normalized, ["implementations of", "who implements", "what implements", "implements"]);
      return {
        builder: QueryTemplates.findImplementations(typeName),
        pattern: "find-implementations",
        confidence: 0.9,
      };
    }

    // Pattern: "call graph of X" / "calls from X" (with optional depth)
    if (this.matchPattern(normalized, ["call graph", "calls from"])) {
      const symbolName = this.extractSymbolName(normalized, ["call graph", "calls from", "of"]);
      const depth = this.extractDepth(normalized) || 2;
      return {
        builder: QueryTemplates.findCallGraph(symbolName, depth),
        pattern: "find-call-graph",
        confidence: 0.85,
      };
    }

    // Pattern: "unused exports" / "dead exports"
    if (this.matchPattern(normalized, ["unused exports", "dead exports", "unreferenced exports"])) {
      return {
        builder: QueryTemplates.findUnusedExports(),
        pattern: "find-unused-exports",
        confidence: 1.0,
      };
    }

    // Pattern: "symbols in X" / "functions in X" / "code in X"
    if (this.matchPattern(normalized, ["symbols in", "functions in", "code in", "show file"])) {
      const filePath = this.extractFilePath(normalized, ["symbols in", "functions in", "code in", "show file"]);
      return {
        builder: QueryTemplates.findSymbolsInFile(filePath),
        pattern: "find-symbols-in-file",
        confidence: 0.85,
      };
    }

    // ========== MASTRA-SPECIFIC PATTERNS ==========

    // Pattern: "show agents" / "find agents" / "list agents" / "all agents"
    if (this.matchPattern(normalized, ["show agents", "find agents", "list agents", "all agents", "mastra agents"])) {
      return {
        builder: QueryTemplates.findMastraAgents(),
        pattern: "find-mastra-agents",
        confidence: 1.0,
      };
    }

    // Pattern: "show workflows" / "find workflows" / "list workflows"
    if (this.matchPattern(normalized, ["show workflows", "find workflows", "list workflows", "all workflows", "mastra workflows"])) {
      return {
        builder: QueryTemplates.findMastraWorkflows(),
        pattern: "find-mastra-workflows",
        confidence: 1.0,
      };
    }

    // Pattern: "show tools" / "find tools" / "list tools" / "mastra tools"
    if (this.matchPattern(normalized, ["show tools", "find tools", "list tools", "all tools", "mastra tools"])) {
      return {
        builder: QueryTemplates.findMastraTools(),
        pattern: "find-mastra-tools",
        confidence: 1.0,
      };
    }

    // Pattern: "show integrations" / "find integrations" / "mastra integrations"
    if (this.matchPattern(normalized, ["show integrations", "find integrations", "list integrations", "mastra integrations"])) {
      return {
        builder: QueryTemplates.findMastraIntegrations(),
        pattern: "find-mastra-integrations",
        confidence: 1.0,
      };
    }

    // Pattern: "agent tools in X" / "tools in agent X" / "what tools does X use"
    if (this.matchPattern(normalized, ["agent tools", "tools in agent", "what tools"])) {
      const filePath = this.extractFilePath(normalized, ["agent tools", "tools in agent", "what tools", "use"]);
      return {
        builder: QueryTemplates.findAgentTools(filePath),
        pattern: "find-agent-tools",
        confidence: 0.9,
      };
    }

    // Pattern: "workflow steps in X" / "steps in workflow X"
    if (this.matchPattern(normalized, ["workflow steps", "steps in workflow"])) {
      const filePath = this.extractFilePath(normalized, ["workflow steps", "steps in workflow", "in"]);
      return {
        builder: QueryTemplates.findWorkflowSteps(filePath),
        pattern: "find-workflow-steps",
        confidence: 0.9,
      };
    }

    // Pattern: "show models" / "find models" / "model usage" / "llm usage"
    if (this.matchPattern(normalized, ["show models", "find models", "model usage", "llm usage", "ai providers"])) {
      return {
        builder: QueryTemplates.findModelUsage(),
        pattern: "find-model-usage",
        confidence: 1.0,
      };
    }

    // Pattern: "show llm providers" / "llm providers" / "ai providers"
    if (this.matchPattern(normalized, ["llm providers", "ai providers", "show providers"])) {
      return {
        builder: QueryTemplates.findLLMProviders(),
        pattern: "find-llm-providers",
        confidence: 1.0,
      };
    }

    // No pattern matched - might be raw Cypher
    return {
      builder: null,
      rawCypher: input,
      pattern: "raw-cypher",
      confidence: 0.5,
    };
  }

  /**
   * Check if input matches any of the patterns
   */
  private static matchPattern(input: string, patterns: string[]): boolean {
    return patterns.some(pattern => input.includes(pattern));
  }

  /**
   * Extract symbol name from query
   */
  private static extractSymbolName(input: string, prefixes: string[]): string {
    let remaining = input;

    // Remove prefix
    for (const prefix of prefixes) {
      if (remaining.includes(prefix)) {
        remaining = remaining.substring(remaining.indexOf(prefix) + prefix.length).trim();
        break;
      }
    }

    // Extract name (first word or quoted string)
    const quotedMatch = remaining.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Take first word
    const words = remaining.split(/\s+/);
    return words[0] || "Unknown";
  }

  /**
   * Extract file path from query
   */
  private static extractFilePath(input: string, prefixes: string[]): string {
    let remaining = input;

    // Remove prefix
    for (const prefix of prefixes) {
      if (remaining.includes(prefix)) {
        remaining = remaining.substring(remaining.indexOf(prefix) + prefix.length).trim();
        break;
      }
    }

    // Extract path (quoted or unquoted)
    const quotedMatch = remaining.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Take everything or first path-like token
    const pathMatch = remaining.match(/[^\s]+\.(ts|js|tsx|jsx)/);
    if (pathMatch) {
      return pathMatch[0];
    }

    return remaining.trim() || ".";
  }

  /**
   * Extract depth number from query (for call graphs)
   */
  private static extractDepth(input: string): number | null {
    const depthMatch = input.match(/depth\s+(\d+)|level\s+(\d+)|(\d+)\s*levels?/);
    if (depthMatch) {
      return parseInt(depthMatch[1] || depthMatch[2] || depthMatch[3]);
    }
    return null;
  }

  /**
   * Get help text for natural language queries
   */
  static getHelp(): string {
    return `
Natural Language Query Examples:

**Finding Callers/Callees:**
- "who calls fetchUser"
- "what does handleClick call"
- "callers of processData"

**Exports/Imports:**
- "exports in src/utils/helper.ts"
- "imports from src/api/client.ts"
- "show exports of lib/index.ts"

**Dependencies:**
- "dependencies of src/app.ts"
- "who depends on utils/logger.ts"
- "what imports config.ts"

**Classes:**
- "show classes"
- "members of UserService"
- "what extends BaseController"
- "implementations of IRepository"

**Code Structure:**
- "symbols in src/main.ts"
- "call graph of initialize depth 3"
- "unused exports"

**Mastra Framework (NEW!):**
- "show agents" / "find agents" / "list agents"
- "show workflows" / "find workflows"
- "show tools" / "find tools" / "list tools"
- "show integrations" / "mastra integrations"
- "agent tools in src/agents/customer.ts"
- "workflow steps in src/workflows/checkout.ts"
- "show models" / "model usage" / "llm usage"
- "llm providers" / "show providers"

**Tip:** Use quotes for multi-word names: who calls "fetch user data"
`;
  }
}
