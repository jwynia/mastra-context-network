# Command Reference

## Purpose
This document provides a complete reference for all CLI commands available in the TypeScript semantic analysis toolkit.

## Classification
- **Domain:** Architecture
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** Evolving

## Content

### Command Overview

The TypeScript Agent provides a rich set of CLI commands for code analysis, accessible through:
```bash
deno task [command]
# or directly:
deno run -A scripts/cli.ts [command]
```

### Global Options

Available for all commands:

```bash
--json              # Output in JSON format for programmatic use
--verbose, -v       # Enable verbose logging
--output <file>     # Write output to file instead of stdout
--help, -h          # Show command help
```

---

## Core Analysis Commands

### `/analyze [options]`
**Status**: ⏳ Planned (Phase 2.3)

Perform comprehensive codebase analysis using AST and semantic graph.

```bash
Options:
  --scope [module|file|function]  # Analysis granularity
  --depth [shallow|deep]          # Dependency traversal depth
  --output [json|markdown|graph]  # Output format
  --focus [types|deps|complexity] # Specific analysis focus

Examples:
  deno task analyze --scope module --focus types
  deno task analyze src/services --depth deep --output json
```

**What it does**:
- Queries both Kuzu (relationships) and DuckDB (metrics)
- Correlates graph data with metrics
- Generates comprehensive reports
- Identifies patterns and issues

---

### `/scan-codebase`
**Status**: ✅ Implemented (Phase 1)
**File**: `scripts/commands/scan.ts`

Initial or full rescan of codebase into Kuzu semantic database.

```bash
Options:
  --incremental              # Only scan changed files
  --force                    # Force full rescan
  --exclude [pattern]        # Exclude file patterns
  --include-tests           # Include test files in scan

Examples:
  deno task scan
  deno task scan --incremental
  deno task scan --exclude "**/*.generated.ts"
```

**What it does**:
- Parses TypeScript files using ts-morph
- Extracts symbols, types, and relationships
- Stores in Kuzu graph database
- Stores metrics in DuckDB
- Handles incremental updates efficiently

**Current Capabilities**:
- ✅ Symbol extraction (functions, classes, interfaces, types)
- ✅ Type relationships
- ✅ MEMBER_OF relationships
- ✅ CALLS relationships (basic)
- ⏳ Import graph analysis (planned)

---

### `/query-semantic [query]`
**Status**: ✅ Implemented (Phase 1)
**File**: `scripts/commands/query.ts`

Query the semantic graph database directly using natural language or Cypher.

```bash
Examples:
  deno task query "find all interfaces extending BaseEntity"
  deno task query "show circular dependencies"
  deno task query "find unused exports"
  deno task query "trace path from ComponentA to ComponentB"
```

**What it does**:
- Parses natural language queries
- Translates to Cypher (or executes Cypher directly)
- Queries Kuzu graph database
- Formats results for readability

**Query Templates** (Planned):
- Find circular dependencies
- Find unused exports
- Trace dependency paths
- Find all callers of a function
- Show type hierarchy

---

## Type System Commands

### `/type-check [options]`
**Status**: ⏳ Planned (Phase 4.1)

Analyze type coverage and safety.

```bash
Options:
  --strict               # Apply strictest type checking
  --coverage            # Show type coverage percentage
  --find-any            # Locate all 'any' usage
  --suggest-types       # Suggest type improvements

Examples:
  deno task type-check --coverage
  deno task type-check src/api --find-any
```

---

### `/type-impact [type-name]`
**Status**: ⏳ Planned (Phase 4.2)

Analyze impact of type changes.

```bash
Examples:
  deno task type-impact UserInterface
  deno task type-impact "OrderStatus enum"
```

---

### `/generate-types [source]`
**Status**: ⏳ Planned (Phase 2)

Generate TypeScript types from various sources.

```bash
Options:
  --from [json|api|database]   # Source type
  --output [file]              # Output file path
  --strict                     # Generate strict types

Examples:
  deno task gen:types --from json data/sample.json --output types/generated.ts
```

---

## Dependency Commands

### `/deps-analyze [options]`
**Status**: ⏳ Planned (Phase 5.1)

Analyze dependencies at multiple levels.

```bash
Options:
  --circular              # Find circular dependencies
  --unused                # Find unused dependencies
  --outdated              # Check for outdated packages
  --security              # Run security audit
  --visualize             # Generate dependency graph

Examples:
  deno task deps-analyze --circular
  deno task deps-analyze --unused --outdated
```

---

### `/deps-impact [package]`
**Status**: ⏳ Planned (Phase 5)

Analyze impact of dependency changes.

```bash
Examples:
  deno task deps-impact react@18
  deno task deps-impact --remove lodash
```

---

## Code Intelligence Commands

### `/find-pattern [pattern]`
**Status**: ⏳ Planned (Phase 6.1)

Find code patterns using AST matching.

```bash
Options:
  --lang [ts|tsx|js]     # Language variant
  --fix                  # Apply automatic fixes
  --explain              # Explain why pattern matters

Examples:
  deno task find-pattern "console.log($$$)"
  deno task find-pattern "await $func() catch" --explain
  deno task find-pattern "useState($val)" --lang tsx
```

**Uses**: ast-grep for pattern matching

---

### `/suggest-refactor [target]`
**Status**: ⏳ Planned (Phase 6.3)

Suggest refactoring opportunities.

```bash
Options:
  --type [extract|inline|rename|move]
  --complexity-threshold [number]
  --preview                        # Show before/after

Examples:
  deno task refactor src/utils --type extract
  deno task refactor calculateTotal --type inline
```

---

### `/dead-code`
**Status**: ⏳ Planned (Phase 6.2)

Find and optionally remove dead code.

```bash
Options:
  --remove              # Automatically remove dead code
  --include-exports     # Include unused exports
  --dry-run            # Show what would be removed

Examples:
  deno task dead-code --dry-run
  deno task dead-code --remove --include-exports
```

---

## Test Intelligence Commands

### `/test-coverage [path]`
**Status**: ⏳ Planned (Phase 7.1)

Analyze test coverage with semantic understanding.

```bash
Options:
  --missing            # Show untested code paths
  --suggest            # Suggest test cases
  --complexity         # Weight by code complexity

Examples:
  deno task test-coverage src/services --missing
  deno task test-coverage --suggest --complexity
```

---

### `/generate-tests [target]`
**Status**: ⏳ Planned (Phase 7.2)

Generate test cases from types and implementation.

```bash
Options:
  --style [unit|integration|e2e]
  --framework [vitest|jest|deno]
  --properties                    # Property-based tests

Examples:
  deno task gen:tests src/utils/validator.ts
  deno task gen:tests UserService --style integration
```

---

## Migration & Upgrade Commands

### `/migrate-code [from] [to]`
**Status**: ⏳ Planned (Phase 11.1)

Automated code migration between versions/patterns.

```bash
Examples:
  deno task migrate "promise" "async-await"
  deno task migrate "class-component" "function-component"
  deno task migrate "commonjs" "esm"
```

---

### `/upgrade-deps [strategy]`
**Status**: ⏳ Planned (Phase 11)

Smart dependency upgrades with impact analysis.

```bash
Options:
  --strategy [safe|latest|major]
  --test                         # Run tests after each upgrade
  --rollback                     # Enable rollback on failure

Examples:
  deno task upgrade-deps --strategy safe --test
  deno task upgrade-deps react --strategy major
```

---

## Performance Commands

### `/profile [target]`
**Status**: ⏳ Planned (Phase 8.1)

Performance profiling using Deno bench.

```bash
Options:
  --compare [baseline]    # Compare against baseline
  --iterations [n]        # Number of iterations
  --memory               # Include memory profiling

Examples:
  deno task profile src/algorithms --iterations 1000
  deno task profile parseData --compare main
```

---

### `/optimize [target]`
**Status**: ⏳ Planned (Phase 8.2)

Suggest or apply performance optimizations.

```bash
Options:
  --focus [speed|memory|bundle]
  --apply                      # Apply suggested optimizations
  --measure                    # Measure improvement

Examples:
  deno task optimize src/parser --focus speed
  deno task optimize build --focus bundle
```

---

## Architecture Commands

### `/arch-check`
**Status**: ⏳ Planned (Phase 9.1)

Validate architecture constraints.

```bash
Options:
  --rules [file]         # Custom rules file
  --fix                  # Fix violations where possible
  --strict              # Fail on any violation

Examples:
  deno task arch-check --rules .architecture-rules.yml
  deno task arch-check --fix
```

---

### `/module-boundaries`
**Status**: ⏳ Planned (Phase 9.2)

Analyze and enforce module boundaries.

```bash
Examples:
  deno task module-boundaries check
  deno task module-boundaries visualize
  deno task module-boundaries enforce src/core
```

---

## Documentation Commands

### `/doc-generate [target]`
**Status**: ⏳ Planned (Phase 10.1)

Generate documentation from code and types.

```bash
Options:
  --format [markdown|html|json]
  --include-private
  --examples                    # Extract examples from tests

Examples:
  deno task doc-generate src/api --format markdown
  deno task doc-generate --examples
```

---

### `/doc-check`
**Status**: ⏳ Planned (Phase 10.2)

Verify documentation completeness and accuracy.

```bash
Options:
  --public-only          # Only check public API
  --sync                 # Sync docs with implementation

Examples:
  deno task doc-check --public-only
  deno task doc-check --sync
```

---

## Database Commands

### `/db-query [database] [query]`
**Status**: ⏳ Planned (Phase 2)

Query Kuzu or DuckDB directly.

```bash
Examples:
  deno task db:query kuzu "MATCH (n:Symbol) RETURN n LIMIT 10"
  deno task db:query duckdb "SELECT * FROM file_metrics WHERE lines > 500"
```

---

### `/db-stats`
**Status**: ⏳ Planned (Phase 2)

Show database statistics and health.

```bash
Examples:
  deno task db:stats
  deno task db:stats --verbose
```

---

## Git Integration Commands

### `/git-impact [commit|branch]`
**Status**: ⏳ Planned (Phase 3)

Analyze impact of git changes using semantic understanding.

```bash
Examples:
  deno task git-impact HEAD~1
  deno task git-impact feature/new-api
  deno task git-impact --since yesterday
```

---

### `/git-suggest-split`
**Status**: ⏳ Planned (Phase 11)

Suggest how to split large commits/PRs.

```bash
Examples:
  deno task git-suggest-split
  deno task git-suggest-split --max-files 10
```

---

## Monitoring Commands

### `/watch [target]`
**Status**: ⏳ Planned (Phase 3.1)
**File**: `scripts/watch.ts`

Watch for changes and continuously analyze.

```bash
Options:
  --mode [test|build|analyze]
  --notify                     # Desktop notifications
  --threshold [metrics]        # Alert on threshold breach

Examples:
  deno task watch src --mode analyze
  deno task watch --threshold "complexity > 10"
```

---

### `/health-check`
**Status**: ✅ Implemented
**Alias**: `doctor`
**File**: `scripts/doctor.ts`

Overall project health assessment.

```bash
Options:
  --deep               # Comprehensive check (planned)
  --fix                # Auto-fix simple issues (planned)

Examples:
  deno task doctor
  deno task health-check --deep --fix
```

**Current Checks**:
- ✅ Deno runtime
- ✅ Node runtime
- ✅ npm
- ✅ Kuzu database
- ✅ DuckDB
- ✅ ast-grep
- ✅ ripgrep
- ✅ Database connectivity
- ✅ Configuration files
- ✅ Directory structure

---

## Workflow Commands

### `/task-analyze [task-id]`
**Status**: ⏳ Planned (Phase 10)

Analyze a task's scope using semantic understanding.

```bash
Examples:
  deno task task-analyze TASK-001
  deno task task-analyze FEAT-042 --estimate-complexity
```

---

### `/pr-analyze [pr-number]`
**Status**: ⏳ Planned (Phase 10)

Semantic analysis of PR changes.

```bash
Examples:
  deno task pr-analyze 123
  deno task pr-analyze --current
```

---

### `/context-suggest`
**Status**: ⏳ Planned (Phase 10)

Suggest what context/files to load for current work.

```bash
Examples:
  deno task context-suggest "implementing user authentication"
  deno task context-suggest --task TASK-001
```

---

## Meta Commands

### `/agent-stats`
**Status**: ⏳ Planned

Show agent activity and performance statistics.

```bash
Examples:
  deno task agent-stats
  deno task agent-stats --since "1 week ago"
```

---

### `/agent-learn [pattern]`
**Status**: ⏳ Planned

Teach agent new patterns or preferences.

```bash
Examples:
  deno task agent-learn "prefer composition over inheritance"
  deno task agent-learn --from src/examples/good-patterns
```

---

### `/agent-config [setting] [value]`
**Status**: ⏳ Planned

Configure agent behavior.

```bash
Examples:
  deno task agent-config context-window-limit 20
  deno task agent-config preferred-test-framework vitest
```

---

## Command Aliases

For productivity, shorter aliases are available:

```bash
/a     -> /analyze
/s     -> /scan-codebase
/q     -> /query-semantic
/tc    -> /type-check
/d     -> /deps-analyze
/t     -> /test-coverage
/w     -> /watch
/h     -> /health-check
```

---

## Command Chaining

Commands can be chained with `&&`:

```bash
deno task scan --incremental && deno task analyze --focus types && deno task test-coverage --missing
```

---

## Output Redirection

All commands support output redirection:

```bash
deno task analyze --output json > analysis.json
deno task deps-analyze --circular | deno task context-network add
```

---

## Integration with Context Network

Commands can automatically update the context network:

```bash
deno task analyze --update-context
deno task arch-check --document-violations
```

---

## Implementation Status

### ✅ Implemented (Phase 1)
- `scan` - Codebase scanning
- `query` - Semantic queries
- `doctor` - Health check
- `init` - Database initialization

### 🚧 In Progress
- CLI Router (Phase 2.1)
- Watch system (Phase 3.1)

### ⏳ Planned by Phase
See `context-network/planning/typescript-agent-backlog.md` for complete implementation roadmap.

---

## Usage Notes

- Commands use Deno scripts in `scripts/` directory
- Analysis runs against Node code in `src/` directory
- All data persists in Kuzu/DuckDB databases
- Commands respect `.gitignore` and custom ignore patterns
- Use `/help [command]` for detailed command documentation

## Relationships
- **Parent Nodes:**
  - [tooling_architecture.md] - implements - Commands implement the tool architecture
- **Child Nodes:** None (individual command implementations in code)
- **Related Nodes:**
  - [../planning/typescript-agent-backlog.md] - tracks - Implementation status and priorities
  - [../cross_cutting/ai_agent_guidelines.md] - guides - How AI agents use commands

## Navigation Guidance
- **Access Context:** Reference when learning available commands or planning new features
- **Common Next Steps:** Execute commands or review implementation backlog
- **Related Tasks:** Command development, feature planning, AI agent integration
- **Update Patterns:** Update when new commands are implemented or specifications change

## Metadata
- **Created:** 2025-09-30
- **Last Updated:** 2025-09-30
- **Updated By:** Claude (AI Agent)

## Change History
- 2025-09-30: Initial creation based on agent-commands.md and current implementation