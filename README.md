# TypeScript Code Analysis Template

A complete foundation for building TypeScript code analysis tools with semantic graph databases, incremental file watching, and natural language queries.

## 🚀 What This Template Provides

**Semantic Code Analysis:**
- AST parsing for TypeScript/JavaScript
- Symbol extraction (functions, classes, types, interfaces)
- Relationship tracking (calls, imports, extends, implements)
- Type hierarchy analysis

**Graph Database (Kuzu):**
- Semantic relationships stored as a graph
- Cypher query support
- Fast relationship traversal
- Historical code analysis (git SHA tracking)

**Analytics Database (DuckDB):**
- File-level metrics (lines, complexity, dependencies)
- Performance benchmarks
- Code quality trends
- Incremental scan tracking

**Incremental Development Workflow:**
- File watching with automatic rescanning
- Hash-based change detection
- Database persistence across restarts
- Deletion handling (clean removal from databases)

**Natural Language Queries:**
- "who calls fetchUser"
- "show exports of src/utils/helper.ts"
- "dependencies of app.ts"
- 13 query templates + raw Cypher support

## ⚡ Quick Start (5 Minutes)

### 1. Prerequisites

```bash
# Deno runtime
curl -fsSL https://deno.land/install.sh | sh

# Kuzu database
# (Installation varies by platform - see https://kuzudb.com)

# DuckDB
brew install duckdb  # macOS
# or download from https://duckdb.org
```

### 2. Initialize Databases

```bash
# Create database schemas
deno task db:init
```

### 3. Initial Scan

```bash
# Scan your codebase (this repo or any TypeScript project)
deno task scan

# Or scan a specific directory
deno task scan --path ./src
```

### 4. Start Watching (Optional)

```bash
# Enable incremental development mode
deno task watch

# Now edit files - changes auto-update the databases!
```

### 5. Query Your Code

```bash
# Natural language queries
deno task query "who calls initialize"
deno task query "show classes"
deno task query "exports in src/lib/scanner.ts"

# Use templates
deno task query -t find-callers initialize
deno task query -t find-dependencies src/app.ts

# Raw Cypher
deno task query "MATCH (n:Symbol) WHERE n.exported = true RETURN n.name, n.file LIMIT 10"

# Get help
deno task query --nl-help
deno task query --templates
```

## 📚 Available Commands

### Scanning

```bash
# Full scan
deno task scan

# Incremental scan (only changed files)
deno task scan --incremental

# Scan specific path
deno task scan --path ./src

# Clear and rescan
deno task scan --clear

# Verbose output
deno task scan --verbose
```

### Querying

```bash
# Natural language
deno task query "who calls myFunction"

# Templates (see --templates for full list)
deno task query -t find-callers myFunction
deno task query -t find-classes
deno task query -t find-unused-exports

# Format options
deno task query "show classes" -f json
deno task query "show classes" -f tree
deno task query "show classes" -f count

# Enable caching (5min TTL)
deno task query "expensive query" --cache

# Verbose mode
deno task query "any query" -v
```

### Watching

```bash
# Watch current directory
deno task watch

# Watch specific path
deno task watch --path src

# Custom debounce (default 500ms)
deno task watch --debounce 1000

# Exclude patterns
deno task watch --exclude "*.test.ts,**/generated/**"

# Verbose logging
deno task watch --verbose
```

## 🏗️ Architecture

```
TypeScript/JavaScript Code
         ↓
    AST Parser (ts-morph)
         ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Kuzu (Graph DB)    DuckDB (Analytics)
 - Symbols           - Metrics
 - Types             - Complexity
 - Relationships     - Trends
    ↓                   ↓
    └─────────┬─────────┘
              ↓
      Query System
   (NL + Cypher + Templates)
```

### Key Components

**Scripts:**
- `scripts/commands/` - CLI commands (scan, watch, query)
- `scripts/lib/` - Core libraries (AST analyzer, DB clients, query builder)
- `scripts/utils/` - Utilities (hashing, git, caching, logging)

**Databases:**
- `.kuzu/` - Semantic graph database
- `.duckdb/` - Analytics database

**Context Network:**
- `context-network/` - Project documentation and architecture

## 🎯 Common Use Cases

### 1. Find All Callers of a Function

```bash
deno task query "who calls processPayment"
```

### 2. Analyze Dependencies

```bash
# What does this file import?
deno task query "dependencies of src/api/client.ts"

# Who imports this file?
deno task query "dependents of src/utils/logger.ts"
```

### 3. Find Unused Exports

```bash
deno task query "unused exports"
```

### 4. Explore Type Hierarchy

```bash
deno task query "what extends BaseController"
deno task query "implementations of IRepository"
```

### 5. Visualize Call Graphs

```bash
deno task query "call graph of initialize depth 3" -f tree
```

### 6. Monitor Code Changes

```bash
# Terminal 1: Start watching
deno task watch

# Terminal 2: Edit code, watch auto-updates databases
# Terminal 3: Query updated data
deno task query "show symbols in file-you-just-edited.ts"
```

## 🔧 Customization

### Adding New Query Templates

Edit `scripts/lib/query-builder.ts`:

```typescript
export class QueryTemplates {
  static myCustomQuery(param: string): QueryBuilder {
    return new QueryBuilder()
      .match("(n:Symbol)")
      .where(`n.name = '${this.escapeCypher(param)}'`)
      .return("n.name", "n.file", "n.line")
      .orderBy("n.file");
  }
}
```

### Adding Natural Language Patterns

Edit `scripts/lib/natural-language-parser.ts`:

```typescript
// In NaturalLanguageParser.parse():
if (this.matchPattern(normalized, ["my pattern", "alternative pattern"])) {
  const extracted = this.extractSymbolName(normalized, ["my pattern"]);
  return {
    builder: QueryTemplates.myCustomQuery(extracted),
    pattern: "my-pattern",
    confidence: 0.9,
  };
}
```

### Adding New Commands

1. Create `scripts/commands/my-command.ts`
2. Export a Cliffy `Command`
3. Register in `scripts/cli.ts`:

```typescript
import { myCommand } from "./commands/my-command.ts";

cli.command("my-command", myCommand);
```

See `docs/adding-commands.md` for detailed guide.

## 📖 Documentation

- **[First Sprint Guide](docs/first-sprint.md)** - Recommended tasks for your first 1-2 weeks
- **[Adding Commands](docs/adding-commands.md)** - How to extend the CLI
- **[Query Guide](docs/query-guide.md)** - Complete query reference
- **[Context Network](context-network/discovery.md)** - Architecture and design docs

## 🧪 Testing

```bash
# Run all tests
deno task test

# Run specific test file
deno test scripts/utils/debounce.test.ts

# Watch mode
deno test --watch
```

## 🛠️ Development

### Project Structure

```
.
├── scripts/
│   ├── commands/        # CLI commands
│   │   ├── scan.ts     # Code scanner
│   │   ├── watch.ts    # File watcher
│   │   └── query.ts    # Query system
│   ├── lib/            # Core libraries
│   │   ├── ast-analyzer.ts
│   │   ├── kuzu-client.ts
│   │   ├── duckdb-client.ts
│   │   ├── query-builder.ts
│   │   └── natural-language-parser.ts
│   └── utils/          # Utilities
│       ├── file-hash.ts
│       ├── git.ts
│       ├── cache.ts
│       └── logger.ts
├── context-network/    # Documentation
├── docs/              # User guides
└── deno.json          # Configuration
```

### Database Schemas

**Kuzu (Graph):**
- Symbol nodes (functions, classes, interfaces)
- Type nodes (type definitions)
- Import nodes (import statements)
- Relationships (CALLS, EXTENDS, IMPLEMENTS, DEPENDS_ON, etc.)

**DuckDB (Analytics):**
- file_metrics - Lines, complexity, counts
- file_hashes - Change tracking
- symbol_complexity - Per-symbol metrics
- analysis_history - Scan history

## 🚦 What's Included vs. What You Build

### ✅ Included in Template

**Phase 1-3 (Core Foundation):**
- Complete database setup (Kuzu + DuckDB)
- AST scanning and symbol extraction
- Incremental file watching
- Hash-based change detection
- Deletion handling
- Query system with NL support
- CLI framework
- Core utilities

### 🏗️ Build in Your Project

**Phase 4-12 (Project-Specific Features):**
- Type system analysis
- Dependency analysis
- Pattern finding and refactoring
- Test intelligence
- Performance profiling
- Architecture validation
- Documentation generation
- Migration tools

See `context-network/planning/typescript-agent-backlog.md` for complete roadmap.

## 🎁 What Makes This Template Valuable

1. **Incremental Development** - Watch mode means databases stay current automatically
2. **Natural Language Queries** - No Cypher knowledge required for common tasks
3. **Production-Ready Patterns** - TDD, error handling, logging, caching
4. **Extensible** - Add your domain-specific features on solid foundation
5. **Well-Documented** - Context network captures architectural decisions

## 🤝 Contributing

This is a template - fork it and make it yours! If you build something cool on top of it, share it back.

## 📜 License

MIT

## 🔗 Links

- **Kuzu Database**: https://kuzudb.com
- **DuckDB**: https://duckdb.org
- **Deno**: https://deno.land
- **ts-morph** (AST parsing): https://ts-morph.com

---

**Ready to build your code analysis tool? Start with the [First Sprint Guide](docs/first-sprint.md)!**
