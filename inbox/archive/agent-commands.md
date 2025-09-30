# TypeScript Agent Commands for Deno+Node Setup

## Core Analysis Commands

### `/analyze [options]`
**Purpose**: Perform comprehensive codebase analysis using AST and semantic graph
```bash
Options:
  --scope [module|file|function]  # Analysis granularity
  --depth [shallow|deep]           # How deep to traverse dependencies
  --output [json|markdown|graph]   # Output format
  --focus [types|deps|complexity]  # Specific analysis focus
  
Examples:
  /analyze --scope module --focus types
  /analyze src/services --depth deep --output json
```

### `/scan-codebase`
**Purpose**: Initial or full rescan of codebase into Kuzu semantic database
```bash
Options:
  --incremental              # Only scan changed files since last scan
  --force                    # Force full rescan
  --exclude [pattern]        # Exclude file patterns
  --include-tests            # Include test files in scan
  
Examples:
  /scan-codebase --incremental
  /scan-codebase --force --exclude "**/*.generated.ts"
```

### `/query-semantic [query]`
**Purpose**: Query the semantic graph database directly
```bash
Examples:
  /query-semantic "find all interfaces extending BaseEntity"
  /query-semantic "show circular dependencies"
  /query-semantic "find unused exports"
  /query-semantic "trace path from ComponentA to ComponentB"
```

## Type System Commands

### `/type-check [options]`
**Purpose**: Analyze type coverage and safety
```bash
Options:
  --strict               # Apply strictest type checking
  --coverage            # Show type coverage percentage
  --find-any            # Locate all 'any' usage
  --suggest-types       # Suggest type improvements
  
Examples:
  /type-check --coverage
  /type-check src/api --find-any
```

### `/type-impact [type-name]`
**Purpose**: Analyze impact of type changes
```bash
Examples:
  /type-impact UserInterface
  /type-impact "OrderStatus enum"
```

### `/generate-types [source]`
**Purpose**: Generate TypeScript types from various sources
```bash
Options:
  --from [json|api|database]   # Source type
  --output [file]               # Output file path
  --strict                      # Generate strict types
  
Examples:
  /generate-types --from json data/sample.json --output types/generated.ts
  /generate-types --from api https://api.example.com/swagger
```

## Dependency Commands

### `/deps-analyze [options]`
**Purpose**: Analyze dependencies at multiple levels
```bash
Options:
  --circular              # Find circular dependencies
  --unused                # Find unused dependencies
  --outdated              # Check for outdated packages
  --security              # Run security audit
  --visualize             # Generate dependency graph
  
Examples:
  /deps-analyze --circular
  /deps-analyze --unused --outdated
```

### `/deps-impact [package]`
**Purpose**: Analyze impact of dependency changes
```bash
Examples:
  /deps-impact react@18
  /deps-impact --remove lodash
```

## Code Intelligence Commands

### `/find-pattern [pattern]`
**Purpose**: Find code patterns using AST matching
```bash
Options:
  --lang [ts|tsx|js]     # Language variant
  --fix                  # Apply automatic fixes
  --explain              # Explain why pattern matters
  
Examples:
  /find-pattern "console.log($$$)"
  /find-pattern "await $func() catch" --explain
  /find-pattern "useState($val)" --lang tsx
```

### `/suggest-refactor [target]`
**Purpose**: Suggest refactoring opportunities
```bash
Options:
  --type [extract|inline|rename|move]
  --complexity-threshold [number]
  --preview                        # Show before/after
  
Examples:
  /suggest-refactor src/utils --type extract
  /suggest-refactor calculateTotal --type inline
```

### `/dead-code`
**Purpose**: Find and optionally remove dead code
```bash
Options:
  --remove              # Automatically remove dead code
  --include-exports     # Include unused exports
  --dry-run            # Show what would be removed
  
Examples:
  /dead-code --dry-run
  /dead-code --remove --include-exports
```

## Test Intelligence Commands

### `/test-coverage [path]`
**Purpose**: Analyze test coverage with semantic understanding
```bash
Options:
  --missing            # Show untested code paths
  --suggest            # Suggest test cases
  --complexity         # Weight by code complexity
  
Examples:
  /test-coverage src/services --missing
  /test-coverage --suggest --complexity
```

### `/generate-tests [target]`
**Purpose**: Generate test cases from types and implementation
```bash
Options:
  --style [unit|integration|e2e]
  --framework [vitest|jest|deno]
  --properties                    # Property-based tests
  
Examples:
  /generate-tests src/utils/validator.ts
  /generate-tests UserService --style integration
```

## Migration & Upgrade Commands

### `/migrate-code [from] [to]`
**Purpose**: Automated code migration between versions/patterns
```bash
Examples:
  /migrate-code "promise" "async-await"
  /migrate-code "class-component" "function-component"
  /migrate-code "commonjs" "esm"
```

### `/upgrade-deps [strategy]`
**Purpose**: Smart dependency upgrades with impact analysis
```bash
Options:
  --strategy [safe|latest|major]
  --test                         # Run tests after each upgrade
  --rollback                     # Enable rollback on failure
  
Examples:
  /upgrade-deps --strategy safe --test
  /upgrade-deps react --strategy major
```

## Performance Commands

### `/profile [target]`
**Purpose**: Performance profiling using Deno bench
```bash
Options:
  --compare [baseline]    # Compare against baseline
  --iterations [n]        # Number of iterations
  --memory               # Include memory profiling
  
Examples:
  /profile src/algorithms --iterations 1000
  /profile parseData --compare main
```

### `/optimize [target]`
**Purpose**: Suggest or apply performance optimizations
```bash
Options:
  --focus [speed|memory|bundle]
  --apply                      # Apply suggested optimizations
  --measure                    # Measure improvement
  
Examples:
  /optimize src/parser --focus speed
  /optimize build --focus bundle
```

## Architecture Commands

### `/arch-check`
**Purpose**: Validate architecture constraints
```bash
Options:
  --rules [file]         # Custom rules file
  --fix                  # Fix violations where possible
  --strict              # Fail on any violation
  
Examples:
  /arch-check --rules .architecture-rules.yml
  /arch-check --fix
```

### `/module-boundaries`
**Purpose**: Analyze and enforce module boundaries
```bash
Examples:
  /module-boundaries check
  /module-boundaries visualize
  /module-boundaries enforce src/core
```

## Documentation Commands

### `/doc-generate [target]`
**Purpose**: Generate documentation from code and types
```bash
Options:
  --format [markdown|html|json]
  --include-private
  --examples                    # Extract examples from tests
  
Examples:
  /doc-generate src/api --format markdown
  /doc-generate --examples
```

### `/doc-check`
**Purpose**: Verify documentation completeness and accuracy
```bash
Options:
  --public-only          # Only check public API
  --sync                 # Sync docs with implementation
  
Examples:
  /doc-check --public-only
  /doc-check --sync
```

## Database Commands

### `/db-query [database] [query]`
**Purpose**: Query Kuzu or DuckDB directly
```bash
Examples:
  /db-query kuzu "MATCH (n:Symbol) RETURN n LIMIT 10"
  /db-query duckdb "SELECT * FROM file_metrics WHERE lines > 500"
```

### `/db-stats`
**Purpose**: Show database statistics and health
```bash
Examples:
  /db-stats
  /db-stats --verbose
```

## Git Integration Commands

### `/git-impact [commit|branch]`
**Purpose**: Analyze impact of git changes using semantic understanding
```bash
Examples:
  /git-impact HEAD~1
  /git-impact feature/new-api
  /git-impact --since yesterday
```

### `/git-suggest-split`
**Purpose**: Suggest how to split large commits/PRs
```bash
Examples:
  /git-suggest-split
  /git-suggest-split --max-files 10
```

## Monitoring Commands

### `/watch [target]`
**Purpose**: Watch for changes and continuously analyze
```bash
Options:
  --mode [test|build|analyze]
  --notify                     # Desktop notifications
  --threshold [metrics]        # Alert on threshold breach
  
Examples:
  /watch src --mode analyze
  /watch --threshold "complexity > 10"
```

### `/health-check`
**Purpose**: Overall project health assessment
```bash
Options:
  --deep               # Comprehensive check
  --fix                # Auto-fix simple issues
  
Examples:
  /health-check
  /health-check --deep --fix
```

## Workflow Commands

### `/task-analyze [task-id]`
**Purpose**: Analyze a task's scope using semantic understanding
```bash
Examples:
  /task-analyze TASK-001
  /task-analyze FEAT-042 --estimate-complexity
```

### `/pr-analyze [pr-number]`
**Purpose**: Semantic analysis of PR changes
```bash
Examples:
  /pr-analyze 123
  /pr-analyze --current
```

### `/context-suggest`
**Purpose**: Suggest what context/files to load for current work
```bash
Examples:
  /context-suggest "implementing user authentication"
  /context-suggest --task TASK-001
```

## Meta Commands

### `/agent-stats`
**Purpose**: Show agent activity and performance statistics
```bash
Examples:
  /agent-stats
  /agent-stats --since "1 week ago"
```

### `/agent-learn [pattern]`
**Purpose**: Teach agent new patterns or preferences
```bash
Examples:
  /agent-learn "prefer composition over inheritance"
  /agent-learn --from src/examples/good-patterns
```

### `/agent-config [setting] [value]`
**Purpose**: Configure agent behavior
```bash
Examples:
  /agent-config context-window-limit 20
  /agent-config preferred-test-framework vitest
```

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

## Command Chaining

Commands can be chained with `&&`:
```bash
/scan-codebase --incremental && /analyze --focus types && /test-coverage --missing
```

## Output Redirection

All commands support output redirection:
```bash
/analyze --output json > analysis.json
/deps-analyze --circular | /context-network add
```

## Integration with Context Network

Commands can automatically update the context network:
```bash
/analyze --update-context
/arch-check --document-violations
```

## Remember

- Commands use Deno scripts in `scripts/` directory
- Analysis runs against Node code in `src/` directory  
- All data persists in Kuzu/DuckDB databases
- Commands respect `.gitignore` and custom ignore patterns
- Use `/help [command]` for detailed command documentation