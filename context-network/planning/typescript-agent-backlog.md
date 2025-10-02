# TypeScript Agent Development Environment - Implementation Backlog & Testing Philosophy

## Testing Philosophy
**Unit tests for design, manual testing for integration**

✅ **Unit Tests (Worth Writing)**
- Pure functions with clear inputs/outputs
- Business logic in library modules
- Algorithm implementations
- Query builders (test the string generation, not the execution)
- Pattern matchers and parsers
- **Why:** Forces good design, decoupling, and clear interfaces

❌ **Integration Tests (Skip)**
- Database operations
- File system operations
- CLI command execution
- End-to-end workflows
- **Why:** Manual testing is more honest and efficient; integration tests enable poor design

### Key Insight
When integration tests fail, you end up manually testing anyway to understand what's wrong. So skip the middleman - just manually test integrations from the start. Meanwhile, unit tests actually drive better architecture by forcing you to decouple and create clear interfaces.

---

## Implementation Backlog

### Phase 1: Core Infrastructure Completion 🏗️
*Prerequisites: Current setup (✅ DONE)*

#### 1.1 Restructure Project Layout
- [ ] Create proper `scripts/commands/` directory structure
- [ ] Create `scripts/lib/` for reusable modules
- [ ] Create `scripts/utils/` for utilities
- [ ] Move existing scripts to appropriate locations
- [ ] Update import paths and deno.json tasks

#### 1.2 Extract Library Modules
- [ ] Extract AST analyzer logic from scan-codebase.ts → `lib/ast-analyzer.ts`
- [ ] Create `lib/graph-querier.ts` for Kuzu queries
- [ ] Create `lib/metrics-collector.ts` for DuckDB operations
- [ ] Create `lib/database-client.ts` for DB connections
- [ ] Add proper TypeScript interfaces for all data structures
- [ ] **Unit test pure functions in these modules**

#### 1.3 Implement Core Utilities ✅
- [x] Create `utils/logger.ts` with levels and formatting
- [x] Create `utils/cache.ts` for query result caching
- [x] Create `utils/git.ts` for git operations
- [x] Create `utils/file-hash.ts` for incremental scanning
- [x] Create `utils/config.ts` for configuration management
- [x] **Unit test utility functions**

---

### Phase 2: Command System Foundation 🎯
*Prerequisites: Phase 1.1, 1.2*

#### 2.1 CLI Router Implementation
- [ ] Create `cli.ts` using Cliffy command framework
- [ ] Implement command registration pattern
- [ ] Add global options (--json, --verbose, --output)
- [ ] Add help system and command documentation
- [ ] Create command validation and error handling
- [ ] **Manual test: Run CLI with various commands**

#### 2.2 Query System
- [ ] Implement `commands/query.ts` for Cypher queries
- [ ] Create `lib/query-builder.ts` for query construction
- [ ] Add `lib/natural-language-parser.ts` for NL→Cypher
- [ ] Implement common query templates
- [ ] Add query result formatting (table, json, graph)
- [ ] **Unit test query builder and NL parser logic**
- [ ] **Manual test: Run actual queries against DB**

#### 2.3 Basic Analysis Command
- [ ] Create `commands/analyze.ts` orchestrator
- [ ] Implement --scope option (file/module/function)
- [ ] Implement --depth option (shallow/deep)
- [ ] Add JSON output support
- [ ] Connect to both Kuzu and DuckDB
- [ ] **Manual test: Analyze real code**

---

### Phase 3: File Watching & Incremental Updates 🔄
*Prerequisites: Phase 1.3*

#### 3.1 Watch System ✅
- [x] Implement `watch.ts` using Deno.watchFs
- [x] Add debouncing for rapid changes
- [x] Create incremental scan logic
- [x] Implement file hash tracking
- [ ] Add background/daemon mode support (deferred)
- [x] **Manual test: Edit files and observe updates**

#### 3.2 Incremental Scanning (Partial ✅)
- [ ] Track file hashes in DuckDB (pending integration)
- [x] Implement diff detection (IncrementalScanner)
- [ ] Update only changed symbols in Kuzu (pending integration)
- [ ] Handle file moves/renames (pending)
- [ ] Maintain relationship integrity (pending)
- [x] **Unit test: Hash calculation and diff logic**
- [ ] **Manual test: Verify incremental updates work** (pending full integration)

#### 3.3 Git Hooks Integration
- [ ] Create `hooks/post-commit` script
- [ ] Create `hooks/pre-push` validation
- [ ] Add automatic incremental scan on commit
- [ ] Store git SHA with symbols
- [ ] Enable historical queries
- [ ] **Manual test: Make commits and check DB updates**

---

### Phase 4: Type System Analysis 🔍
*Prerequisites: Phase 2.1*

#### 4.1 Type Commands
- [ ] Implement `commands/types.ts`
- [ ] Create type hierarchy analyzer
- [ ] Add type coverage calculator
- [ ] Implement "find any" detector
- [ ] Add type suggestion engine
- [ ] **Unit test: Type analysis algorithms**
- [ ] **Manual test: Run on real TypeScript project**

#### 4.2 Type Impact Analysis
- [ ] Create `lib/type-impact.ts`
- [ ] Track type propagation paths
- [ ] Calculate change impact radius
- [ ] Generate breaking change reports
- [ ] Add migration suggestions
- [ ] **Unit test: Impact calculation logic**

---

### Phase 5: Dependency Analysis 📦
*Prerequisites: Phase 2.1*

#### 5.1 Dependency Commands
- [ ] Implement `commands/deps.ts`
- [ ] Create circular dependency detector
- [ ] Add unused dependency finder
- [ ] Implement import graph builder
- [ ] Add package.json analyzer
- [ ] **Unit test: Graph algorithms for cycle detection**
- [ ] **Manual test: Find real circular dependencies**

#### 5.2 Dependency Metrics
- [ ] Calculate coupling metrics
- [ ] Generate dependency matrix
- [ ] Add complexity scoring
- [ ] Create visualization exports
- [ ] Track historical trends
- [ ] **Unit test: Metric calculations**

---

### Phase 6: Code Intelligence Features 🧠
*Prerequisites: Phase 2.2, 4.1*

#### 6.1 Pattern Finding
- [ ] Implement `commands/find-pattern.ts`
- [ ] Integrate ast-grep for pattern matching
- [ ] Create pattern template library
- [ ] Add auto-fix suggestions
- [ ] Support custom pattern definitions
- [ ] **Unit test: Pattern parsing and matching logic**
- [ ] **Manual test: Find real patterns in code**

#### 6.2 Dead Code Detection
- [ ] Create `commands/dead-code.ts`
- [ ] Implement unreachable code detection
- [ ] Find unused exports
- [ ] Detect unused variables
- [ ] Add safe removal options
- [ ] **Unit test: Dead code detection algorithms**

#### 6.3 Refactoring Suggestions
- [ ] Implement `commands/refactor.ts`
- [ ] Add extract function/method
- [ ] Implement rename symbol
- [ ] Add inline variable/function
- [ ] Create move module functionality
- [ ] **Manual test: Apply refactorings to real code**

---

### Phase 7: Test Intelligence 🧪
*Prerequisites: Phase 2.1*

#### 7.1 Test Coverage Analysis
- [ ] Create `commands/test-coverage.ts`
- [ ] Map tests to source code
- [ ] Calculate semantic coverage
- [ ] Identify untested paths
- [ ] Weight by complexity
- [ ] **Unit test: Coverage calculation algorithms**
- [ ] **Manual test: Analyze test coverage on real project**

#### 7.2 Test Generation
- [ ] Implement `commands/generate-tests.ts`
- [ ] Create test templates
- [ ] Generate from types
- [ ] Add property-based test generation
- [ ] Support multiple test frameworks
- [ ] **Manual test: Generate and run actual tests**

---

### Phase 8: Performance & Optimization ⚡
*Prerequisites: Phase 2.1*

#### 8.1 Performance Profiling
- [ ] Create `commands/profile.ts`
- [ ] Integrate with Deno.bench
- [ ] Add memory profiling
- [ ] Create baseline comparison
- [ ] Generate performance reports
- [ ] **Manual test: Profile real functions**

#### 8.2 Optimization Suggestions
- [ ] Implement `commands/optimize.ts`
- [ ] Detect performance anti-patterns
- [ ] Suggest algorithmic improvements
- [ ] Add bundle size analysis
- [ ] Create optimization reports
- [ ] **Unit test: Pattern detection algorithms**

---

### Phase 9: Architecture Validation 🏛️
*Prerequisites: Phase 5.1*

#### 9.1 Architecture Checking
- [ ] Create `commands/arch-check.ts`
- [ ] Implement layer validation
- [ ] Add boundary enforcement
- [ ] Support custom rules
- [ ] Generate violation reports
- [ ] **Unit test: Rule evaluation logic**
- [ ] **Manual test: Check real architecture**

#### 9.2 Module Boundaries
- [ ] Implement boundary detection
- [ ] Create dependency rules engine
- [ ] Add visualization generation
- [ ] Support architecture diagrams
- [ ] Track architectural drift
- [ ] **Unit test: Boundary detection algorithms**

---

### Phase 10: Documentation & Integration 📚
*Prerequisites: Phase 2.1*

#### 10.1 Documentation Generation
- [ ] Create `commands/doc-generate.ts`
- [ ] Extract from JSDoc comments
- [ ] Generate from types
- [ ] Create API documentation
- [ ] Support multiple formats
- [ ] **Manual test: Generate docs for real code**

#### 10.2 Agent Integration
- [ ] Add JSON output to all commands
- [ ] Create agent-friendly error messages
- [ ] Implement command chaining
- [ ] Add context network integration
- [ ] Create agent usage examples
- [ ] **Manual test: Run commands from agent context**

---

### Phase 11: Advanced Features 🚀
*Prerequisites: Multiple phases*

#### 11.1 Migration Tools
- [ ] Create `commands/migrate.ts`
- [ ] Implement pattern transformations
- [ ] Add framework migrations
- [ ] Support version upgrades
- [ ] Create rollback capability
- [ ] **Unit test: Transformation logic**
- [ ] **Manual test: Run actual migrations**

#### 11.2 Multi-file Operations
- [ ] Implement batch operations
- [ ] Add transaction support
- [ ] Create rollback mechanisms
- [ ] Support dry-run mode
- [ ] Add progress reporting
- [ ] **Manual test: Batch operations on real files**

---

### Phase 12: Polish & Optimization 💎
*Prerequisites: Most other phases*

#### 12.1 Performance Optimization
- [ ] Optimize database queries
- [ ] Implement query caching
- [ ] Add parallel processing
- [ ] Optimize AST parsing
- [ ] Reduce memory usage
- [ ] **Manual test: Benchmark improvements**

#### 12.2 User Experience
- [ ] Add progress bars
- [ ] Improve error messages
- [ ] Create interactive prompts
- [ ] Add command aliases
- [ ] Implement autocomplete
- [ ] **Manual test: User experience flow**

---

## Validation Strategy

### For Each Feature:

**Unit Test When:**
- Pure functions (input → output)
- Algorithms and calculations
- Parsers and formatters
- Business logic
- Data transformations

**Manual Test When:**
- Database operations
- File system interactions
- Network calls
- CLI commands
- End-to-end workflows

### Success Criteria:
1. Feature works on real code/data
2. Handles basic error cases gracefully
3. Has at least one documented example
4. Core logic has unit tests where valuable

---

## Quick Wins Priority Order 🎯

1. **CLI Router** - Enables all other commands
2. **Query System** - Makes database useful
3. **Watch Mode** - Keeps DB synchronized
4. **Basic Analyze** - Core functionality
5. **Dependency Analysis** - High value, relatively simple

---

## Estimated Effort

- **Small** (1-2 hours): Individual utility files, simple commands
- **Medium** (3-4 hours): Complex commands, library modules
- **Large** (5-8 hours): Major systems like CLI router, watch mode
- **Total Estimate**: ~120-150 hours for complete implementation

---

## Current Status

### ✅ Stage 1: TypeScript Foundation (COMPLETE)
**Focus:** Build solid TypeScript analysis foundation without framework-specific features

**Completed Components:**
- Database installation (Kuzu + DuckDB)
- Database initialization with schemas
- AST scanning for TypeScript/JavaScript
- Symbol extraction (functions, classes, types, interfaces)
- Relationship tracking (calls, imports, extends, implements)
- Environment setup (Deno + Node)
- Configuration files
- **Phase 1.3: Core Utilities** (2025-09-30)
  - file-hash.ts, git.ts, cache.ts created
  - logger.ts enhanced with JSON mode
  - config.ts enhanced with validation
  - 48 test cases, 100% pass rate
- **Phase 2.2: Query System** (Complete)
  - query-builder.ts with 13 core query templates
  - natural-language-parser.ts with NL→Cypher conversion
  - Query command with multiple output formats
  - Help system with template documentation
- **Phase 3.1 & 3.2: Watch System & Incremental Scanning** (2025-09-30)
  - debounce.ts utility with 10 test cases
  - incremental-scanner.ts with 10 test cases
  - file-watcher.ts using Deno.watchFs
  - watch command CLI integrated
  - Hash-based change detection
  - Database persistence across restarts
  - Deletion handling
  - 68 total test cases, 100% pass rate

**Result:** Rock-solid TypeScript analysis infrastructure that works with any TypeScript codebase

### 🚧 Stage 2: Mastra Framework Integration (CURRENT)
**Focus:** Layer Mastra-specific knowledge on top of TypeScript foundation

**Completed:**
- ✅ Copied 11 Mastra documentation files to context-network/mastra/
- ✅ Created typescript-integration.md bridge document
- ✅ Created query-patterns.md with comprehensive Mastra examples
- ✅ Copied 23 .claude commands (4 Mastra-specific + 19 general)
- ✅ Added 8 Mastra query templates to query-builder.ts:
  - findMastraAgents(), findMastraWorkflows(), findMastraTools()
  - findMastraIntegrations(), findAgentTools(), findWorkflowSteps()
  - findModelUsage(), findLLMProviders()
- ✅ Added 8 Mastra natural language patterns to natural-language-parser.ts
- ✅ Updated README.md with Mastra use cases
- ✅ Created docs/mastra-guide.md with comprehensive workflows
- ✅ Updated docs/first-sprint.md with Mastra exercises
- ✅ Updated context-network/discovery.md with Mastra navigation
- ✅ Created context-network/mastra/index.md

**Result:** TypeScript foundation now Mastra-aware with agent/workflow/tool analysis built-in

**Total Query Templates:** 21 (13 TypeScript core + 8 Mastra-specific)

### 📋 Up Next
- **Stage 3: Advanced Mastra Features** (Optional)
  - Deep Mastra AST analysis (agent structure validation)
  - Workflow step validation
  - Tool contract checking
  - Runtime integration for live monitoring
  - Mastra-specific linting rules
- **Continue TypeScript Foundation Phases:**
  - Phase 3.3: Git Hooks Integration
  - Phase 4: Type System Analysis
  - Phase 5: Dependency Analysis
  - Phase 6: Code Intelligence Features

---

## Notes

- This backlog lives in the context network for tracking and updates
- Each phase builds on previous work
- Manual testing is preferred over integration tests
- Unit tests drive good design for core logic
- The goal is working features, not perfect test coverage