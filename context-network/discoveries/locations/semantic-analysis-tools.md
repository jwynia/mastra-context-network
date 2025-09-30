# Semantic Analysis Tools - Key Locations

## Purpose
Index of key code locations in the semantic analysis tooling system for quick navigation and understanding.

## Classification
- **Domain:** Discovery
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** Established

## Content

### Entry Points

#### Main CLI Router
- **What**: CLI application entry point (planned, not yet implemented)
- **Where**: `scripts/cli.ts` (to be created in Phase 2.1)
- **Purpose**: Command registration and routing
- **Technology**: Cliffy command framework
- **Related**: All command implementations

#### Health Check
- **What**: Environment validation and health checking
- **Where**: `scripts/doctor.ts:1-200`
- **Purpose**: Verify all tools and databases are working
- **Key Functions**:
  - `checkCommand()` - Verify CLI tools exist
  - `checkDatabase()` - Verify database connectivity
  - Main health check orchestration
- **Related**: [[init.ts]], [[config.ts]]

#### Database Initialization
- **What**: Initialize Kuzu and DuckDB schemas
- **Where**: `scripts/init-databases.ts:1-300`
- **Purpose**: Set up database schemas and tables
- **Key Sections**:
  - Lines 45-120: Kuzu schema (nodes and relationships)
  - Lines 150-200: DuckDB schema (metrics tables)
- **Related**: [[kuzu-client]], [[duckdb-client]]

---

### Command Implementations

#### Scan Command
- **What**: Core codebase scanning implementation
- **Where**: `scripts/commands/scan.ts:1-350`
- **Purpose**: Extract AST and populate semantic databases
- **Key Functions**:
  - `scanDirectory()` - Recursively scan files (lines 45-80)
  - `processFile()` - Parse single file (lines 85-150)
  - `main()` - Command orchestration (lines 300-350)
- **Uses**: [[ast-analyzer]], [[kuzu-client]], [[duckdb-client]]
- **Related**: [[init-databases]], [[watch]]

#### Query Command
- **What**: Semantic graph querying interface
- **Where**: `scripts/commands/query.ts:1-150`
- **Purpose**: Execute natural language or Cypher queries
- **Key Functions**:
  - `parseQuery()` - Parse natural language (lines 20-60)
  - `executeQuery()` - Run Cypher query (lines 65-100)
  - `formatResults()` - Format output (lines 105-140)
- **Uses**: [[kuzu-client]]
- **Related**: [[scan]], [[analyze]]

---

### Library Modules

#### AST Analyzer
- **What**: TypeScript AST parsing and extraction
- **Where**: `scripts/lib/ast-analyzer.ts:1-320`
- **Purpose**: Extract symbols, types, and relationships from TypeScript
- **Key Classes/Functions**:
  - `AstAnalyzer` class - Main analyzer (lines 15-300)
  - `extractSymbols()` - Extract all symbols (lines 45-120)
  - `extractTypes()` - Extract type information (lines 125-180)
  - `extractRelationships()` - Find CALLS, EXTENDS, etc. (lines 185-280)
- **Technology**: ts-morph npm package
- **Discovery**: `discoveries/implementation/ast-scanner.md`

#### Kuzu Client
- **What**: Kuzu graph database client wrapper
- **Where**: `scripts/lib/kuzu-client.ts:1-420`
- **Purpose**: Provide typed interface to Kuzu database
- **Key Classes/Functions**:
  - `KuzuClient` class - Main client (lines 20-400)
  - `insertSymbol()` - Add symbol node (lines 80-120)
  - `insertType()` - Add type node (lines 125-160)
  - `createRelationship()` - Add edge (lines 165-220)
  - `query()` - Execute Cypher (lines 230-290)
- **Critical Discovery**: Lines 217, 244, 281-284 - Semicolons required for Cypher execution
- **Discovery**: `discoveries/implementation/kuzu-client.md`

#### DuckDB Client
- **What**: DuckDB analytics database client wrapper
- **Where**: `scripts/lib/duckdb-client.ts:1-350`
- **Purpose**: Store and query code metrics
- **Key Classes/Functions**:
  - `DuckDBClient` class - Main client (lines 20-330)
  - `insertFileMetrics()` - Store file stats (lines 80-140)
  - `insertComplexity()` - Store complexity scores (lines 145-200)
  - `query()` - Execute SQL (lines 210-270)
- **Discovery**: `discoveries/implementation/duckdb-metrics.md`

---

### Utility Modules

#### Configuration
- **What**: Environment and configuration management
- **Where**: `scripts/utils/config.ts:1-150`
- **Purpose**: Load and validate configuration
- **Key Functions**:
  - `loadConfig()` - Main config loader (lines 20-80)
  - `fixPath()` - Path normalization (lines 42-53)
  - `validateConfig()` - Config validation (lines 85-130)
- **Critical Discovery**: Lines 42-53 - Path fixing for /workspace/ vs relative paths
- **Related**: All commands use this

---

### Database Schemas

#### Kuzu Schema
- **What**: Graph database schema definition
- **Where**: `scripts/init-databases.ts:45-120`
- **Purpose**: Define nodes and relationships for code graph
- **Node Tables**:
  - `Symbol` - Functions, classes, interfaces (lines 50-60)
  - `Type` - Type definitions (lines 65-72)
  - `Module` - File/module information (lines 75-82)
- **Relationship Tables**:
  - `MEMBER_OF` - Symbol belongs to module (line 90)
  - `CALLS` - Function calls function (line 95)
  - `HAS_TYPE` - Symbol has type (line 100)
  - `EXTENDS` - Type extends type (line 105)
  - `IMPLEMENTS` - Class implements interface (line 110)

#### DuckDB Schema
- **What**: Analytics database schema
- **Where**: `scripts/init-databases.ts:150-200`
- **Purpose**: Store metrics and statistics
- **Tables**:
  - `file_metrics` - Per-file statistics (lines 155-168)
  - `symbol_complexity` - Complexity scores (lines 172-185)
  - `type_relationships` - Type usage patterns (lines 188-195)

---

### Configuration Files

#### Deno Configuration
- **What**: Deno runtime and task configuration
- **Where**: `deno.json:1-85`
- **Purpose**: Define Deno tasks, imports, and compiler options
- **Key Sections**:
  - `tasks` (lines 2-35): CLI task definitions
  - `imports` (lines 37-46): Import map for dependencies
  - `compilerOptions` (lines 79-84): TypeScript settings

#### DevContainer
- **What**: Development container configuration
- **Where**: `.devcontainer/devcontainer.json:1-110`
- **Purpose**: Define VS Code dev container environment
- **Key Settings**:
  - Deno and Node runtime setup
  - VS Code extensions
  - Environment variables

---

## Navigation Patterns

### For New Features
1. Start with command in `scripts/commands/`
2. Use library modules from `scripts/lib/`
3. Add utilities in `scripts/utils/` if needed
4. Update schemas in `scripts/init-databases.ts`

### For Debugging
1. Check `scripts/doctor.ts` for environment issues
2. Review database clients for connection problems
3. Check AST analyzer for parsing issues
4. Use `config.ts` for path problems

### For Understanding
1. Read this location index first
2. Follow to specific discovery records
3. Review actual code with line number references
4. Check related ADRs for design decisions

---

## Quick Reference

**Most Important Files** (start here):
1. `scripts/commands/scan.ts` - How scanning works
2. `scripts/lib/ast-analyzer.ts` - How AST is parsed
3. `scripts/lib/kuzu-client.ts` - How graph DB works
4. `scripts/init-databases.ts` - Database schemas

**Configuration Files** (when things break):
1. `deno.json` - Task definitions
2. `scripts/utils/config.ts` - Path and env handling
3. `.devcontainer/devcontainer.json` - Container setup
4. `.env` - Environment variables

**Entry Points** (where execution starts):
1. `scripts/doctor.ts` - Health check
2. `scripts/init-databases.ts` - Database setup
3. `scripts/commands/scan.ts` - Scanning
4. `scripts/commands/query.ts` - Querying

---

## Relationships
- **Parent Nodes:**
  - [../../architecture/tooling_architecture.md] - documents - Architecture this implements
  - [../../architecture/directory_structure.md] - references - Physical layout
- **Child Nodes:**
  - [../implementation/ast-scanner.md] - details - AST scanning discoveries
  - [../implementation/kuzu-client.md] - details - Kuzu client discoveries
  - [../implementation/duckdb-metrics.md] - details - DuckDB discoveries
- **Related Nodes:**
  - [../../decisions/adr_002_deno_node_runtime_split.md] - explains - Why Deno for tools
  - [../../decisions/adr_004_kuzu_duckdb_databases.md] - explains - Why these databases

## Navigation Guidance
- **Access Context:** Use when looking for specific code or understanding implementation
- **Common Next Steps:** Follow line number references to actual code
- **Related Tasks:** Development, debugging, code review, onboarding
- **Update Patterns:** Update when new modules are added or major refactoring occurs

## Metadata
- **Created:** 2025-09-30
- **Last Updated:** 2025-09-30
- **Updated By:** Claude (AI Agent)

## Change History
- 2025-09-30: Initial creation based on current implementation