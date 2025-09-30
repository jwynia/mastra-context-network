# TypeScript Agent Setup: Implementation & Integration Guide

## Mission Brief

You are setting up a TypeScript development environment with an intentional split:
- **Deno** for all tooling, analysis, and development scripts
- **Node.js** for the application runtime
- **Semantic databases** (Kuzu + DuckDB) for code intelligence
- **LLM agent optimization** with clear boundaries and no Python temptation

This guide will help you implement the complete system, filling gaps and ensuring everything works together.

## Phase 1: Core Infrastructure Setup

### 1.1 Directory Structure Verification

Create this exact structure:
```
project/
├── .devcontainer/
│   ├── Dockerfile
│   ├── devcontainer.json
│   ├── .env                      # Environment variables
│   ├── config/
│   │   ├── deno.json            # Deno configuration
│   │   ├── tsconfig.node.json   # Node TypeScript config
│   │   ├── .eslintrc.js         # ESLint for Node code
│   │   └── .prettierrc          # Prettier config
│   ├── agent-tools/             # (DEPRECATED - use scripts/)
│   ├── scripts/                 # All Deno scripts
│   │   ├── init.ts             # Environment setup
│   │   ├── doctor.ts           # Health check
│   │   ├── analyze.ts          # Main analysis engine
│   │   ├── scan-codebase.ts    # AST extraction to Kuzu
│   │   ├── query.ts            # Kuzu query interface
│   │   ├── watch.ts            # File watchers
│   │   └── [other scripts]     # Additional tools
│   └── hooks/
│       ├── post-commit         # Git hook for DB update
│       └── pre-push           # Validation hook
├── src/                        # Node.js application code
├── scripts/                    # Symlink to .devcontainer/scripts/
├── tests/                      # Node.js tests (Vitest)
├── bench/                      # Deno benchmarks
├── .agent/                     # Agent workspace/cache
├── .kuzu/                      # Kuzu database files
├── .duckdb/                    # DuckDB database files
├── .cache/                     # Deno cache
├── deno.json                   # Root Deno config
├── package.json                # Node dependencies
├── tsconfig.json              # Node TypeScript config
└── README.md
```

### 1.2 Missing Core Scripts to Implement

These essential scripts need to be created in `scripts/`:

#### `scripts/scan-codebase.ts`
```typescript
#!/usr/bin/env -S deno run --allow-all

/**
 * Scans TypeScript/JavaScript codebase and populates Kuzu semantic database
 * This is the heart of the semantic analysis system
 */

import { Project, Node, Type } from "npm:ts-morph@22.0.0";
import { parse } from "@std/flags/mod.ts";

// TODO: Implement
// 1. Use ts-morph to parse all TypeScript files
// 2. Extract symbols, types, relationships
// 3. Store in Kuzu database using schema from init.ts
// 4. Handle incremental updates efficiently
```

#### `scripts/analyze.ts`
```typescript
#!/usr/bin/env -S deno run --allow-all

/**
 * Main analysis orchestrator - coordinates different analysis types
 */

// TODO: Implement
// 1. Parse command options (scope, depth, focus)
// 2. Run appropriate analysis modules
// 3. Query Kuzu for semantic information
// 4. Query DuckDB for metrics
// 5. Generate unified analysis report
```

#### `scripts/watch.ts`
```typescript
#!/usr/bin/env -S deno run --allow-all

/**
 * File system watcher that keeps databases synchronized
 */

import { watch } from "@std/fs/mod.ts";

// TODO: Implement
// 1. Watch src/ directory for changes
// 2. On change, run incremental scan
// 3. Update Kuzu database
// 4. Optionally run tests/checks
// 5. Support daemon mode for background operation
```

### 1.3 Database Schema Implementation

#### Kuzu Schema (expand on init.ts)
```cypher
-- Additional tables and relationships needed:

CREATE NODE TABLE Import (
  id STRING PRIMARY KEY,
  source_file STRING,
  imported_path STRING,
  specifiers STRING[],
  is_type_only BOOLEAN,
  git_sha STRING
);

CREATE NODE TABLE Test (
  id STRING PRIMARY KEY,
  name STRING,
  test_file STRING,
  tests_symbol STRING,  -- What it tests
  type STRING,          -- unit/integration/e2e
  line INT32
);

CREATE REL TABLE TESTS (FROM Test TO Symbol);
CREATE REL TABLE DEPENDS_ON (FROM Symbol TO Import);
CREATE REL TABLE CALLS (FROM Symbol TO Symbol, count INT32);
```

#### DuckDB Schema (expand on init.sql)
```sql
-- Additional analysis tables needed:

CREATE TABLE symbol_complexity (
  symbol_id VARCHAR PRIMARY KEY,
  cyclomatic_complexity INTEGER,
  cognitive_complexity INTEGER,
  line_count INTEGER,
  parameter_count INTEGER,
  return_type_complexity INTEGER,
  last_calculated TIMESTAMP
);

CREATE TABLE type_relationships (
  source_type VARCHAR,
  target_type VARCHAR,
  relationship_type VARCHAR,  -- extends/implements/uses
  confidence DECIMAL(3,2),
  PRIMARY KEY (source_type, target_type, relationship_type)
);
```

## Phase 2: Command Implementation

### 2.1 Command Router Pattern

Create `scripts/cli.ts` as the main entry point:
```typescript
#!/usr/bin/env -S deno run --allow-all

import { Command } from "@cliffy/command";

// Import all command modules
import { analyzeCommand } from "./commands/analyze.ts";
import { scanCommand } from "./commands/scan.ts";
// ... etc

const cli = new Command()
  .name("ts-agent")
  .version("1.0.0")
  .description("TypeScript semantic analysis agent")
  .command("analyze", analyzeCommand)
  .command("scan", scanCommand)
  // ... register all commands
  ;

if (import.meta.main) {
  await cli.parse(Deno.args);
}
```

### 2.2 Core Analysis Engine

The analysis engine needs these components:

#### AST Analyzer (`scripts/lib/ast-analyzer.ts`)
```typescript
import { Project, SourceFile, Symbol } from "npm:ts-morph";

export class AstAnalyzer {
  private project: Project;
  
  async analyzeFile(filePath: string) {
    // Extract symbols, types, dependencies
    // Return structured data for database insertion
  }
  
  async findPattern(pattern: string) {
    // Use ast-grep for pattern matching
  }
  
  async calculateComplexity(node: Node) {
    // Calculate cyclomatic/cognitive complexity
  }
}
```

#### Graph Querier (`scripts/lib/graph-querier.ts`)
```typescript
export class GraphQuerier {
  async findCircularDependencies() {
    // Kuzu query for circular deps
  }
  
  async findUnusedExports() {
    // Query for exports with no references
  }
  
  async tracePath(from: string, to: string) {
    // Find connection path between symbols
  }
}
```

### 2.3 Integration Points

#### VS Code Settings (`.vscode/settings.json`)
```json
{
  "deno.enable": false,
  "deno.enablePaths": ["./scripts", "./bench"],
  "deno.config": "./deno.json",
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "files.associations": {
    "scripts/*.ts": "typescript-deno",
    "src/*.ts": "typescript"
  }
}
```

#### Git Hooks (`hooks/post-commit`)
```bash
#!/bin/bash
# Update semantic database after commits
cd "$(git rev-parse --show-toplevel)"
deno task scan --incremental --quiet
```

## Phase 3: LLM Agent Integration

### 3.1 Agent Context File (`.agent/context.md`)
```markdown
# TypeScript Agent Context

## Environment Rules
1. **Tooling scripts** → ALWAYS use Deno (scripts/*.ts)
2. **Application code** → ALWAYS use Node (src/*.ts)
3. **NEVER** create Python scripts (no interpreter available)
4. **NEVER** mix Deno and Node imports

## Available Commands
- Use `/analyze` for code analysis
- Use `/scan-codebase` to update semantic DB
- Use `/query-semantic` for graph queries
- See `/help` for all commands

## Database Access
- Kuzu: Semantic AST graph at .kuzu/semantic.db
- DuckDB: Metrics and analytics at .duckdb/metrics.db
```

### 3.2 Command Execution Pattern

Agents should execute commands via Deno:
```typescript
async function executeAgentCommand(command: string, args: string[]) {
  const cmd = new Deno.Command("deno", {
    args: ["task", command, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code, stdout, stderr } = await cmd.output();
  
  if (code !== 0) {
    throw new Error(`Command failed: ${new TextDecoder().decode(stderr)}`);
  }
  
  return JSON.parse(new TextDecoder().decode(stdout));
}
```

## Phase 4: Testing & Validation

### 4.1 System Validation Script (`scripts/validate-setup.ts`)
```typescript
#!/usr/bin/env -S deno run --allow-all

// Comprehensive validation of the entire setup
const checks = [
  { name: "Deno installed", check: () => checkCommand("deno") },
  { name: "Node installed", check: () => checkCommand("node") },
  { name: "Kuzu database initialized", check: () => checkKuzuDB() },
  { name: "DuckDB database initialized", check: () => checkDuckDB() },
  { name: "Scripts executable", check: () => checkScripts() },
  { name: "Git hooks installed", check: () => checkGitHooks() },
  { name: "No Python in scripts", check: () => checkNoPython() },
];

// Run all checks and report
```

### 4.2 Benchmark Suite (`bench/`)

Create benchmarks to validate performance:
```typescript
// bench/scan.bench.ts
Deno.bench("AST scanning performance", async () => {
  // Benchmark codebase scanning
});

// bench/query.bench.ts  
Deno.bench("Semantic query performance", async () => {
  // Benchmark graph queries
});
```

## Phase 5: Gaps to Fill

### Critical Missing Pieces

1. **Incremental Scanning Logic**
   - Track file hashes to detect changes
   - Only reparse modified files
   - Update graph relationships efficiently

2. **Type Resolution System**
   - Follow TypeScript's module resolution
   - Handle path aliases from tsconfig
   - Resolve node_modules types

3. **Query Language Parser**
   - Parse natural language queries to Cypher
   - Support common query patterns
   - Provide query suggestions

4. **Cache Layer**
   - Cache expensive AST operations
   - Cache common query results
   - Invalidate intelligently

5. **Error Recovery**
   - Handle parsing errors gracefully
   - Skip unparseable files with logging
   - Provide partial results

### Configuration Files to Create

#### `deno.lock` (auto-generated)
Run `deno cache scripts/*.ts` to generate

#### `.env.example`
```bash
# Kuzu database configuration
KUZU_DB_PATH=.kuzu/semantic.db
KUZU_MEMORY_LIMIT=1GB

# DuckDB configuration  
DUCKDB_PATH=.duckdb/metrics.db
DUCKDB_THREADS=4

# Agent configuration
AGENT_CONTEXT_WINDOW=20
AGENT_MAX_FILES=20
```

#### `.gitignore` additions
```
# Databases
.kuzu/
.duckdb/

# Caches
.cache/
.agent/

# Worktrees
.worktrees/

# Deno
deno.lock
```

## Phase 6: Operational Patterns

### Daily Workflow

1. **Morning Setup**
   ```bash
   deno task doctor        # Health check
   deno task scan          # Update semantic DB
   deno task analyze       # Get codebase overview
   ```

2. **During Development**
   ```bash
   deno task watch &       # Background watcher
   npm run dev            # Node app development
   ```

3. **Before Commits**
   ```bash
   deno task analyze --strict
   npm test
   ```

### Command Patterns for Agents

```typescript
// Pattern 1: Analyze before implementation
await exec("deno task analyze --scope function calculateTotal");
await exec("deno task type-impact OrderInterface");

// Pattern 2: Continuous validation
await exec("deno task watch --mode test");

// Pattern 3: Smart refactoring
await exec("deno task find-pattern 'console.log($$$)'");
await exec("deno task suggest-refactor --complexity-threshold 10");
```

## Success Criteria

The setup is complete when:

1. ✅ All Deno scripts run without Python dependencies
2. ✅ Kuzu database populates with AST data
3. ✅ DuckDB tracks code metrics
4. ✅ Agents naturally use TypeScript for tooling
5. ✅ Clear separation between Deno and Node contexts
6. ✅ Semantic queries return meaningful results
7. ✅ File watching keeps databases synchronized
8. ✅ Commands execute successfully via `deno task`
9. ✅ No Python scripts exist in the project
10. ✅ VS Code uses correct LSP per directory

## Troubleshooting Guide

### Common Issues

1. **"Cannot find module" in scripts/**
   - Wrong import style - use Deno URL imports
   - Should be `import { x } from "https://..."` or `import { x } from "npm:..."`

2. **"Cannot find module" in src/**
   - Wrong import style - use Node imports
   - Should be `import { x } from "package"` or `import { x } from "./file"`

3. **Kuzu connection errors**
   - Check database exists: `ls -la .kuzu/`
   - Reinitialize: `deno task init`

4. **Commands not found**
   - Ensure scripts are executable: `chmod +x scripts/*.ts`
   - Check deno.json tasks are defined

5. **Python creeping in**
   - Remove Python from Dockerfile
   - Check no pip/python in PATH
   - Enforce Deno-only policy

## Critical Context Network Integration

### Context Network Awareness

This project uses a Context Network for ALL planning and coordination. The implementing agent MUST:

1. **Check `.context-network.md`** first to locate the context network
2. **Read the context network's discovery guide** before any implementation
3. **Create discovery records** when implementing core scripts:
   ```markdown
   # Discovery: AST Scanner Implementation
   **Location**: `scripts/scan-codebase.ts:45-200`
   **Purpose**: Core engine that extracts TypeScript AST into Kuzu
   **Key Insights**: 
   - Uses ts-morph for AST traversal
   - Batches database inserts for performance
   - Handles circular dependencies via visited set
   ```

4. **Update location indexes** as you create scripts:
   ```markdown
   # Semantic Analysis Tools - Key Locations
   
   ## AST Extraction
   - **Entry Point**: `scripts/scan-codebase.ts:main()`
   - **Symbol Extractor**: `scripts/lib/ast-analyzer.ts:extractSymbols()`
   - **Database Writer**: `scripts/lib/kuzu-writer.ts:bulkInsert()`
   ```

### Required Context Network Updates

As you implement, create these documents in the context network:

1. **`decisions/typescript-agent-architecture.md`**
   - Why Deno for tooling, Node for runtime
   - Why Kuzu + DuckDB instead of other solutions
   - Why no Python in the environment

2. **`discoveries/implementation/[component].md`** for each major component:
   - AST scanner discoveries
   - Graph query patterns that work well
   - Performance optimizations found
   - Edge cases handled

3. **`planning/implementation-phases.md`**
   - Track which phases are complete
   - Document blockers or changes to the plan
   - Note follow-up tasks identified

### Integration with Existing Patterns

This project follows specific patterns documented in CLAUDE.md:

1. **Investigation Before Implementation**
   - Don't just start coding scripts
   - Research existing TypeScript AST tools first
   - Document findings in context network
   - Propose approach before implementing

2. **Friction = Information**
   - If something seems hard (like AST traversal), document why
   - Create discovery records for complex parts
   - Don't work around problems, understand them

3. **Small, Focused Documents**
   - Each script gets its own discovery record
   - Don't create one giant "implementation notes" file
   - Link between related discoveries

### Command Implementation Notes

When implementing the agent commands in `/ts-agent-commands`:

1. **Each command should update context network**:
   ```typescript
   // After analysis completes
   await updateContextNetwork({
     type: 'analysis-result',
     timestamp: new Date(),
     findings: analysisResults,
     queryUsed: userQuery
   });
   ```

2. **Commands should check context first**:
   ```typescript
   // Before executing analysis
   const contextGuidance = await loadContextNetwork('analysis-patterns');
   const previousResults = await checkPreviousAnalysis(similarQuery);
   ```

3. **Error handling should create discoveries**:
   ```typescript
   catch (error) {
     await createDiscoveryRecord({
       type: 'error-pattern',
       location: getCurrentStack(),
       error: error.message,
       resolution: attemptedFix
     });
   }
   ```

## Implementation Phases with Validation

### Phase 1: Foundation (MUST complete before Phase 2)
- [ ] Dockerfile builds successfully
- [ ] devcontainer.json works
- [ ] Basic directory structure created
- [ ] Deno and Node both functional
- [ ] **Context network entries created for setup decisions**

### Phase 2: Databases (MUST complete before Phase 3)
- [ ] Kuzu initializes with schema
- [ ] DuckDB initializes with schema
- [ ] Basic connectivity verified
- [ ] **Discovery records created for database patterns**

### Phase 3: Core Scripts (MUST complete before Phase 4)
- [ ] `init.ts` sets up environment
- [ ] `doctor.ts` validates setup
- [ ] `scan-codebase.ts` extracts AST
- [ ] **Location indexes updated for all scripts**

### Phase 4: Analysis Engine
- [ ] AST analyzer works with ts-morph
- [ ] Graph querier connects to Kuzu
- [ ] Metrics collector uses DuckDB
- [ ] **Analysis patterns documented in context network**

### Phase 5: Commands
- [ ] Command router established
- [ ] Core commands implemented
- [ ] Output formatting works
- [ ] **Command usage guide in context network**

### Phase 6: Integration
- [ ] Git hooks functional
- [ ] VS Code settings correct
- [ ] File watchers operational
- [ ] **Integration test results documented**

## Known Complexity Points

These areas will require careful investigation:

1. **TypeScript Module Resolution**
   - Following tsconfig paths
   - Resolving node_modules
   - Handling monorepos
   - Document findings in `discoveries/module-resolution.md`

2. **Incremental Scanning**
   - Detecting changed files efficiently
   - Updating graph without full rebuild
   - Maintaining relationship integrity
   - Create `discoveries/incremental-updates.md`

3. **Query Translation**
   - Natural language to Cypher/SQL
   - Common query patterns
   - Performance optimization
   - Document in `discoveries/query-patterns.md`

## Success Validation Checklist

Before considering the setup complete:

### Technical Validation
- [ ] All 10 success criteria from main guide met
- [ ] No Python files or references exist
- [ ] All tests pass in both Deno and Node
- [ ] Semantic queries return accurate results
- [ ] File watching maintains sync

### Context Network Validation
- [ ] Architecture decisions documented
- [ ] Discovery records created for key components
- [ ] Location indexes comprehensive
- [ ] Navigation guides updated
- [ ] Implementation phases tracked

### Agent Experience Validation
- [ ] Commands execute without confusion
- [ ] Clear errors when mixing Deno/Node
- [ ] Semantic analysis provides value
- [ ] No Python temptation exists

## Final Notes

This setup creates a powerful, TypeScript-native development environment where:
- Tooling stays in Deno (fast, secure, TypeScript-native)
- Application stays in Node (ecosystem compatibility)
- Semantic understanding via graph databases (not just text search)
- LLM agents have clear boundaries (no ambiguity about what goes where)
- No Python means no training-data gravity pulling agents away from TypeScript
- **Context network captures all learnings for future agents**

The key insight: By removing Python entirely, providing powerful TypeScript-native tools, AND maintaining comprehensive context network documentation, agents will naturally produce better TypeScript solutions that build on previous discoveries.