# Discovery: AST Scanner Implementation

## Purpose
Document key discoveries and insights from implementing the TypeScript AST scanner.

## Classification
- **Domain:** Discovery
- **Stability:** Semi-stable
- **Abstraction:** Detailed
- **Confidence:** Established

## Content

### Overview
The AST scanner extracts semantic information from TypeScript code using ts-morph, then stores it in Kuzu (graph) and DuckDB (metrics) databases.

### Implementation Location
**Primary File**: `scripts/lib/ast-analyzer.ts`
**Command**: `scripts/commands/scan.ts`
**Lines**: 320 total in ast-analyzer, 350 in scan command

---

## Key Discoveries

### Discovery 1: ts-morph Project Pattern
**Location**: `scripts/lib/ast-analyzer.ts:20-45`

**What We Found**:
```typescript
const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});
```

**Significance**:
- Creating a `Project` instance is the entry point for ts-morph
- Setting `skipAddingFilesFromTsConfig: true` gives us manual control
- We can then add files selectively with `project.addSourceFileAtPath()`
- This pattern allows incremental scanning

**Why It Matters**:
- Enables processing files one at a time
- Allows respecting .gitignore patterns
- Makes incremental updates possible
- Reduces memory usage for large codebases

---

### Discovery 2: Symbol Kind Extraction
**Location**: `scripts/lib/ast-analyzer.ts:80-150`

**What We Found**:
```typescript
for (const sourceFile of project.getSourceFiles()) {
  const classes = sourceFile.getClasses();
  const interfaces = sourceFile.getInterfaces();
  const functions = sourceFile.getFunctions();
  const typeAliases = sourceFile.getTypeAliases();
  const enums = sourceFile.getEnums();
}
```

**Significance**:
- ts-morph provides specific methods for each declaration type
- Each type has different properties we need to extract
- Need to handle each type separately

**Patterns Found**:
- **Classes**: Have methods, properties, constructor, extends, implements
- **Interfaces**: Have properties, methods, extends
- **Functions**: Have parameters, return type, body
- **Type Aliases**: Have type definition
- **Enums**: Have members with values

**Why It Matters**:
- Determines database schema structure
- Each symbol type maps to different graph patterns
- Affects query capabilities

---

### Discovery 3: Relationship Extraction is Complex
**Location**: `scripts/lib/ast-analyzer.ts:185-280`

**What We Found**:
Different relationships require different extraction strategies:

1. **MEMBER_OF** (Symbol → Module): Easy
   - Just track which file the symbol came from

2. **HAS_TYPE** (Symbol → Type): Moderate
   - Get type from declaration: `node.getType()`
   - Convert TypeScript type to string representation

3. **CALLS** (Function → Function): Hard
   - Need to traverse function body AST
   - Find all CallExpression nodes
   - Resolve what function is being called
   - Handle indirect calls (callbacks, method chaining)

4. **EXTENDS/IMPLEMENTS**: Moderate
   - Get heritage clauses from class/interface
   - Resolve what's being extended/implemented

**Current Status**:
- ✅ MEMBER_OF: Fully implemented
- ✅ HAS_TYPE: Basic implementation
- ⚠️ CALLS: Partial (direct calls only)
- ⚠️ EXTENDS/IMPLEMENTS: Partial

**Why It Matters**:
- More complex relationships = more powerful queries
- CALLS relationship enables call graph analysis
- Need incremental improvements over time

---

### Discovery 4: Type Information is Rich
**Location**: `scripts/lib/ast-analyzer.ts:125-180`

**What We Found**:
TypeScript's type system is incredibly detailed:
```typescript
const type = node.getType();
type.getText()  // "Promise<User[]>"
type.isArray()  // false (it's a Promise)
type.getTypeArguments()  // [User[]]
```

**Challenges**:
- Generic types have type parameters
- Union types can have many alternatives
- Intersection types combine multiple types
- Type inference happens everywhere
- Some types are very long strings

**Solution**:
- Store simplified type string in Symbol node
- Create separate Type nodes for interesting types
- Link symbols to types via HAS_TYPE relationship
- Let Kuzu handle complex type queries

---

### Discovery 5: File Metrics are Straightforward
**Location**: `scripts/lib/duckdb-client.ts:80-140`

**What We Found**:
DuckDB metrics are simpler than graph relationships:
```sql
INSERT INTO file_metrics (
  file_path, lines, symbol_count, complexity_sum
) VALUES (?, ?, ?, ?)
```

**Metrics We Track**:
- File path
- Line count
- Symbol count per file
- Sum of complexity scores

**Future Metrics** (planned):
- Cyclomatic complexity per symbol
- Cognitive complexity
- Dependency count
- Test coverage percentage

---

### Discovery 6: Performance Considerations
**Location**: `scripts/commands/scan.ts:45-150`

**What We Found**:
Performance bottlenecks:
1. **ts-morph parsing**: ~50ms per file (acceptable)
2. **Database inserts**: Batching is critical
3. **Relationship extraction**: Most expensive operation

**Optimization Strategies**:
- Parse files in sequence (avoid memory issues)
- Batch database inserts (100+ at a time)
- Skip node_modules and generated files
- Use file hashing for incremental updates (planned)

**Current Performance**:
- 7 files in ~2 seconds (acceptable for dev use)
- Scales linearly with file count
- Watch mode will improve perceived performance

---

### Discovery 7: Error Recovery is Important
**Location**: `scripts/lib/ast-analyzer.ts:290-318`

**What We Found**:
Files may have:
- Syntax errors (incomplete code while editing)
- Missing dependencies (imports that don't resolve)
- Complex types that crash the parser

**Solution**:
```typescript
try {
  const symbols = extractSymbols(sourceFile);
  await kuzu.insertSymbols(symbols);
} catch (error) {
  logger.warn(`Failed to process ${file}: ${error.message}`);
  // Continue with next file
}
```

**Why It Matters**:
- Development environments have incomplete code
- Partial information is better than no information
- Enables real-time analysis during coding

---

## Implementation Patterns

### Pattern 1: File → Symbols → Database
```
TypeScript File
    ↓ ts-morph
AST (SourceFile)
    ↓ extract methods
Symbols[] + Types[] + Relationships[]
    ↓ batch insert
Kuzu Graph DB + DuckDB Metrics
```

### Pattern 2: Incremental Updates (Planned)
```
File Changed
    ↓ hash check
Changed File Detected
    ↓ parse only this file
New Symbols
    ↓ delete old, insert new
Updated Database
```

### Pattern 3: Relationship Resolution
```
Symbol Reference (e.g., function call)
    ↓ get name/identifier
Symbol Name
    ↓ resolve in project
Target Symbol
    ↓ create edge
CALLS Relationship in Kuzu
```

---

## Challenges & Solutions

### Challenge 1: Path Handling
**Problem**: `/workspace/` prefix in paths didn't match actual paths
**Solution**: Path normalization in `config.ts:42-53`
**See**: ADR-002 for Deno/Node split context

### Challenge 2: Kuzu Query Execution
**Problem**: Queries weren't executing (missing semicolons)
**Solution**: Added semicolons to all Cypher statements
**Location**: `kuzu-client.ts:217,244,281-284`
**See**: `discoveries/implementation/kuzu-client.md`

### Challenge 3: Type Complexity
**Problem**: Some types are 100+ characters long
**Solution**: Truncate for display, store full in DB
**Status**: Partial solution, needs refinement

---

## Future Enhancements

### Short Term
- [ ] Better CALLS relationship extraction (closures, callbacks)
- [ ] EXTENDS and IMPLEMENTS relationships
- [ ] Import graph analysis (IMPORTS relationship)
- [ ] Incremental scanning with file hashing

### Medium Term
- [ ] JSDoc comment extraction
- [ ] Decorator information
- [ ] Test file special handling
- [ ] Cross-file type resolution

### Long Term
- [ ] Historical analysis (git SHA tracking)
- [ ] Complexity calculation per symbol
- [ ] Dead code detection
- [ ] Refactoring suggestions

---

## Testing Notes

**Unit Testable**:
- ✅ Symbol extraction logic
- ✅ Type string generation
- ✅ Relationship detection algorithms

**Manual Testing Required**:
- File system operations
- Database insertions
- End-to-end scanning

**Test Files Used**:
- Simple TypeScript files in `src/`
- Mock projects for edge cases
- Real codebase for integration testing

---

## Related Discoveries
- [kuzu-client.md] - Database client patterns
- [duckdb-metrics.md] - Metrics storage
- [../locations/semantic-analysis-tools.md] - Code locations

## Relationships
- **Parent Nodes:**
  - [../../architecture/tooling_architecture.md] - implements - AST analysis component
  - [../../decisions/adr_004_kuzu_duckdb_databases.md] - implements - Dual database strategy
- **Related Nodes:**
  - [../../tasks/2025-01-30-library-extraction.md] - documents - Initial implementation task
  - [kuzu-client.md] - uses - Database client
  - [duckdb-metrics.md] - uses - Metrics storage

## Metadata
- **Created:** 2025-09-30
- **Last Updated:** 2025-09-30
- **Updated By:** Claude (AI Agent)

## Change History
- 2025-09-30: Initial creation based on implementation analysis