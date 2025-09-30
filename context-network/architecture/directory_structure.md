# Directory Structure

## Purpose
This document describes the complete directory structure of the TypeScript semantic analysis development environment, explaining the purpose and contents of each directory.

## Classification
- **Domain:** Architecture
- **Stability:** Semi-stable
- **Abstraction:** Detailed
- **Confidence:** Established

## Content

### Complete Directory Tree

```
project-root/
├── .context-network.md          # Discovery file pointing to context network
├── README.md                    # Project overview
├── CLAUDE.md                    # AI agent instructions
├── .gitignore                   # Root-level git ignores
│
├── .devcontainer/               # Development container configuration
│   ├── Dockerfile              # Container image definition
│   ├── devcontainer.json       # VS Code dev container config
│   ├── .env                    # Environment variables
│   └── env.example             # Environment variable template
│
├── context-network/             # All planning & architecture docs
│   ├── discovery.md            # Navigation guide for context network
│   ├── foundation/             # Core project information
│   ├── architecture/           # System architecture (THIS FILE)
│   ├── decisions/              # Architecture Decision Records
│   ├── processes/              # Process documentation
│   ├── planning/               # Roadmaps and milestones
│   ├── tasks/                  # Task tracking
│   ├── discoveries/            # Discovery records
│   ├── cross_cutting/          # Cross-cutting concerns
│   ├── evolution/              # Technical debt and refactoring
│   └── meta/                   # Context network maintenance
│
├── scripts/                     # ALL Deno scripts (tooling)
│   ├── cli.ts                  # Main CLI entry point
│   ├── init.ts                 # Initialize environment
│   ├── doctor.ts               # Health check
│   ├── init-databases.ts       # Database initialization
│   ├── test-libs.ts            # Library testing script
│   │
│   ├── commands/               # CLI command implementations
│   │   ├── scan.ts            # Scan codebase into DB
│   │   ├── query.ts           # Query semantic graph
│   │   ├── analyze.ts         # Comprehensive analysis (placeholder)
│   │   ├── watch.ts           # File system watcher (placeholder)
│   │   └── [other commands]   # Future command modules
│   │
│   ├── lib/                    # Reusable library modules
│   │   ├── ast-analyzer.ts    # TypeScript AST analysis
│   │   ├── kuzu-client.ts     # Kuzu database client
│   │   ├── duckdb-client.ts   # DuckDB database client
│   │   └── [other libs]       # Future library modules
│   │
│   └── utils/                  # Cross-cutting utilities
│       ├── config.ts          # Configuration management
│       └── [other utils]      # Future utility modules
│
├── src/                        # Node.js application code
│   └── [app code]             # Application being developed
│
├── tests/                      # Node.js application tests
│   └── [test files]           # Vitest test files
│
├── bench/                      # Deno benchmarks
│   └── [bench files]          # Performance benchmarks
│
├── hooks/                      # Git hooks
│   ├── post-commit            # Auto-update semantic DB
│   └── pre-push               # Validation hook
│
├── inbox/                      # Brainstorming and planning docs
│   ├── implementation-guide.md
│   ├── agent-commands.md
│   ├── structure-docs.md
│   └── archive/               # Processed inbox documents
│
├── reference/                  # Reference documentation
│   └── mastra-docs/           # Mastra framework documentation
│
├── config/                     # Configuration files
│   ├── deno.json              # Deno configuration
│   ├── tsconfig.json          # Node TypeScript config
│   └── [other configs]
│
├── .agent/                     # Agent workspace/cache
│
├── .kuzu/                      # Kuzu database files
│   └── semantic.db            # Graph database
│
├── .duckdb/                    # DuckDB database files
│   └── metrics.db             # Analytics database
│
├── .cache/                     # Deno cache
│
├── .vscode/                    # VS Code workspace settings
│   └── settings.json          # Editor configuration
│
├── deno.json                   # Root Deno configuration
├── deno.lock                   # Deno dependency lock file
├── package.json                # Node.js dependencies
├── package-lock.json           # npm lock file
├── tsconfig.json              # Node TypeScript configuration
└── .env.example                # Environment variables template
```

### Directory Purposes

#### `/context-network/`
**Purpose**: ALL planning, architecture, and decision documentation

**Contents**:
- Architecture decisions (ADRs)
- System design documents
- Task tracking and planning
- Discovery records from implementation
- Process documentation
- Cross-cutting concerns

**Access Pattern**: Read by developers and AI agents for understanding system design and decisions

**DO NOT PLACE HERE**: Code, configuration files, tests, or any executable artifacts

#### `/scripts/`
**Purpose**: ALL development tooling written in Deno

**Contents**:
- CLI command implementations
- Analysis engines
- Database clients
- Utility functions
- Tool scripts

**Runtime**: Deno only (TypeScript-native, no transpilation)

**Access Pattern**: Executed via `deno task [command]` or `deno run -A scripts/cli.ts [command]`

**Import Style**: Deno-style imports (`https://...`, `npm:...`, `jsr:...`)

#### `/scripts/commands/`
**Purpose**: Individual CLI command implementations

**Pattern**: Each command is a separate file implementing a specific CLI action

**Responsibilities**:
- Parse command-specific options
- Coordinate library modules
- Format output
- Handle errors gracefully

**Testing**: Manual integration testing (not unit tested)

#### `/scripts/lib/`
**Purpose**: Reusable business logic modules

**Pattern**: Pure functions and classes with no CLI dependencies

**Responsibilities**:
- AST parsing and analysis
- Database operations
- Query building
- Algorithm implementations

**Testing**: Unit tested (pure functions)

#### `/scripts/utils/`
**Purpose**: Cross-cutting utility functions

**Pattern**: Small, focused utility modules

**Examples**:
- Logging
- Configuration loading
- File hashing
- Git operations
- Caching

**Testing**: Unit tested

#### `/src/`
**Purpose**: Node.js application code being developed

**Runtime**: Node.js

**Current State**: Mostly empty (this is a tooling project, not an app project)

**Future**: Will contain application code for projects using these tools

**Import Style**: Node-style imports (`from "package"`, `from "./file"`)

#### `/tests/`
**Purpose**: Node.js application tests

**Framework**: Vitest

**Current State**: Mostly empty

**Pattern**: Test files colocated with application code

#### `/bench/`
**Purpose**: Performance benchmarks for tooling

**Runtime**: Deno

**Framework**: Deno.bench

**Pattern**: `*.bench.ts` files

**Execution**: `deno task bench:all`

#### `/hooks/`
**Purpose**: Git hooks for automation

**Contents**:
- `post-commit` - Auto-update semantic database
- `pre-push` - Validation before pushing

**Installation**: Linked to `.git/hooks/` during setup

#### `/inbox/`
**Purpose**: Landing zone for brainstorming and unprocessed ideas

**Pattern**: Documents start here, then get processed into context network

**Archive**: Processed documents moved to `inbox/archive/`

**Current State**: Contains implementation guide and command specifications (to be processed)

#### `/.kuzu/`
**Purpose**: Kuzu graph database storage

**Contents**: Binary database files

**DO NOT COMMIT**: Added to .gitignore

**Access**: Via `scripts/lib/kuzu-client.ts`

#### `/.duckdb/`
**Purpose**: DuckDB analytics database storage

**Contents**: Binary database files

**DO NOT COMMIT**: Added to .gitignore

**Access**: Via `scripts/lib/duckdb-client.ts`

#### `/.agent/`
**Purpose**: Agent workspace for temporary files and caches

**Contents**: Agent-generated intermediate files

**DO NOT COMMIT**: Added to .gitignore

#### `/.cache/`
**Purpose**: Deno module cache

**Contents**: Downloaded Deno dependencies

**DO NOT COMMIT**: Added to .gitignore

### File Naming Conventions

**Deno Scripts** (`scripts/`):
- Use kebab-case: `scan-codebase.ts`, `analyze-types.ts`
- Command files: `[verb].ts` or `[verb]-[noun].ts`
- Library files: `[noun]-[noun].ts` (e.g., `kuzu-client.ts`)
- Test files: `[name].test.ts`

**Node Code** (`src/`):
- Use kebab-case or camelCase based on team preference
- Follow Node.js ecosystem conventions

**Context Network** (`context-network/`):
- Use snake_case: `project_definition.md`, `system_architecture.md`
- ADRs: `adr_NNN_title_with_underscores.md`
- Task records: `YYYY-MM-DD-task-name.md`

### Import Path Resolution

**Deno Scripts**:
```typescript
// Standard library
import { parse } from "@std/flags/mod.ts";

// npm packages
import { Project } from "npm:ts-morph@22.0.0";

// JSR packages
import { something } from "jsr:@scope/package";

// Local modules
import { analyze } from "./lib/ast-analyzer.ts";
```

**Node Code**:
```typescript
// npm packages
import { express } from "express";

// Local modules (relative)
import { helper } from "./utils/helper";

// Local modules (path alias)
import { service } from "@/services/service";
```

### Configuration Files

**Root Level**:
- `deno.json` - Deno tasks, imports, compiler options
- `package.json` - Node dependencies and scripts
- `tsconfig.json` - Node TypeScript configuration
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore patterns

**DevContainer**:
- `.devcontainer/Dockerfile` - Container image
- `.devcontainer/devcontainer.json` - VS Code settings
- `.devcontainer/.env` - Container environment variables

### Build Artifacts

**Deno**:
- `deno.lock` - Dependency lock file (committed)
- `.cache/` - Module cache (not committed)

**Node**:
- `node_modules/` - npm packages (not committed)
- `package-lock.json` - Dependency lock file (committed)
- `dist/` - Build output if applicable (not committed)

**Databases**:
- `.kuzu/` - Kuzu database files (not committed)
- `.duckdb/` - DuckDB files (not committed)

### Access Patterns by Role

**Developers**:
- Edit code in `src/` and `scripts/`
- Reference `context-network/` for understanding
- Run commands via `deno task`
- Update context network when making architectural changes

**AI Agents**:
- Read `context-network/` to understand system
- Execute commands via CLI
- Update context network with discoveries
- Create code in appropriate directories based on runtime

**New Team Members**:
- Start with README.md
- Navigate `context-network/` for orientation
- Review `scripts/` for tooling capabilities
- Use `deno task doctor` to validate setup

## Relationships
- **Parent Nodes:**
  - [tooling_architecture.md] - details - Physical layout of architecture
  - [adr_002_deno_node_runtime_split.md] - implements - Directory structure enforces runtime split
- **Child Nodes:** None
- **Related Nodes:**
  - [../foundation/structure.md] - complements - Project structure overview
  - [../decisions/decision_index.md] - explains - Decisions that shaped structure

## Navigation Guidance
- **Access Context:** Reference when creating new files or organizing code
- **Common Next Steps:** Review specific directory's contents or purpose
- **Related Tasks:** File organization, new feature planning, onboarding
- **Update Patterns:** Update when adding new directories or changing conventions

## Metadata
- **Created:** 2025-09-30
- **Last Updated:** 2025-09-30
- **Updated By:** Claude (AI Agent)

## Change History
- 2025-09-30: Initial creation based on structure-docs.md and actual project layout