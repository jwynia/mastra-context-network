# TypeScript Agent Tools Structure

## Directory Layout
```
.devcontainer/
├── Dockerfile
├── devcontainer.json
├── .env
├── agent-tools/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── cli.ts                 # Main CLI entry point
│   │   ├── init-db.ts            # Initialize Kuzu database schema
│   │   ├── watchers.ts           # File system watchers
│   │   ├── analyze.ts            # Core analysis engine
│   │   ├── commands/
│   │   │   ├── scan.ts           # Scan codebase into DB
│   │   │   ├── query.ts          # Query semantic graph
│   │   │   ├── impact.ts         # Impact analysis
│   │   │   ├── refactor.ts       # Automated refactoring
│   │   │   ├── deps.ts           # Dependency analysis
│   │   │   └── types.ts          # Type hierarchy analysis
│   │   ├── extractors/
│   │   │   ├── ast-extractor.ts  # AST to graph nodes
│   │   │   ├── type-extractor.ts # Type relationship extraction
│   │   │   └── import-graph.ts   # Module dependency graph
│   │   ├── db/
│   │   │   ├── schema.ts         # Kuzu schema definition
│   │   │   ├── client.ts         # Kuzu client wrapper
│   │   │   └── queries.ts        # Common query patterns
│   │   └── utils/
│   │       ├── git.ts            # Git integration
│   │       ├── cache.ts          # Caching layer
│   │       └── logger.ts         # Logging utilities
│   └── tests/
└── git-hooks/
    └── post-commit               # Auto-update semantic DB

## CLI Commands

### Basic Usage
```bash
# Initial scan of the codebase
ts-agent scan

# Query the semantic graph
ts-agent query "find all interfaces that extend BaseEntity"
ts-agent query "show type hierarchy for UserService"

# Impact analysis
ts-agent impact --file src/models/User.ts
ts-agent impact --symbol "UserRepository.findById"

# Find issues
ts-agent deps --circular
ts-agent deps --unused
ts-agent types --conflicts

# Refactoring
ts-agent refactor --rename-symbol "oldName" "newName"
ts-agent refactor --extract-interface "src/services/UserService.ts"

# Watch mode (auto-updates on file changes)
ts-agent watch
```

## Kuzu Database Schema

### Nodes
- **Module**: file, path, package, lastModified, gitSha
- **Symbol**: name, kind (class/interface/function/type/enum), exported, file, line, column
- **Type**: name, primitive, generic, nullable, readonly
- **Import**: source, target, specifiers, kind (named/default/namespace)

### Relationships
- **DECLARES**: Module -> Symbol
- **EXTENDS**: Symbol -> Symbol
- **IMPLEMENTS**: Symbol -> Symbol
- **REFERENCES**: Symbol -> Symbol
- **IMPORTS**: Module -> Module
- **EXPORTS**: Module -> Symbol
- **HAS_TYPE**: Symbol -> Type
- **RETURNS**: Symbol -> Type
- **PARAMETER_TYPE**: Symbol -> Type
- **GENERIC_CONSTRAINT**: Type -> Type

## Python Helper Script (for Kuzu interaction)
```python
#!/usr/bin/env python3
# /workspace/.agent-tools/scripts/kuzu_query.py

import kuzu
import json
import sys
from pathlib import Path

def query_semantic_graph(query_str):
    db = kuzu.Database(Path(os.environ['KUZU_DB_PATH']))
    conn = kuzu.Connection(db)
    
    result = conn.execute(query_str)
    rows = []
    while result.hasNext():
        rows.append(result.getNext())
    
    return json.dumps(rows, indent=2)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(query_semantic_graph(" ".join(sys.argv[1:])))
```

## Integration with LLM Agent

The agent can use these tools via subprocess calls:
```typescript
// In the LLM agent code
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function analyzeCodebase(query: string) {
  const { stdout } = await execAsync(`ts-agent query "${query}"`);
  return JSON.parse(stdout);
}

async function findImpact(file: string) {
  const { stdout } = await execAsync(`ts-agent impact --file ${file} --json`);
  return JSON.parse(stdout);
}
```

## Key Features

1. **Incremental Updates**: Git hooks automatically update the semantic graph on commits
2. **Watch Mode**: File system watchers keep the database in sync during development
3. **Rich Queries**: Cypher-like queries on TypeScript relationships
4. **Impact Analysis**: Understand cascading effects of changes
5. **Type Flow**: Track how types propagate through the codebase
6. **Historical Analysis**: Query past states using git SHA references
7. **JSON Output**: All commands support --json flag for LLM consumption