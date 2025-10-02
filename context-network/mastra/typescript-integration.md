# TypeScript Analysis Integration with Mastra

## Overview

This document explains how our TypeScript code analysis foundation enhances Mastra framework development. Stage 1 built solid TypeScript analysis capabilities, and Stage 2 layers Mastra-specific knowledge on top.

## Stage 1 Foundation (Complete)

### What We Built
1. **AST Scanning** - Extracts symbols, types, relationships from TypeScript/JavaScript
2. **Graph Database (Kuzu)** - Stores semantic relationships
3. **Analytics Database (DuckDB)** - Stores metrics and complexity data
4. **Incremental Watch System** - Hash-based change detection, auto-rescan
5. **Natural Language Queries** - Query code with plain English
6. **Query Templates** - 13 pre-built query patterns

### How It Works with Any TypeScript
- Scans any `.ts`/`.tsx`/`.js`/`.jsx` files
- Extracts functions, classes, interfaces, types
- Maps relationships: calls, imports, extends, implements
- Tracks file metrics and complexity
- Enables querying code structure

## Stage 2: Mastra Enhancement (Current)

### Mastra-Specific Analysis

The TypeScript foundation **already works** with Mastra code because Mastra is TypeScript. What Stage 2 adds is **Mastra-aware querying and patterns**.

### Mastra Code Patterns We Can Now Detect

**1. Agents** (`createAgent()` calls)
```typescript
// Detected as: Symbol kind='function', name='createAgent'
// Can query: "find all agents" → finds createAgent() calls
const myAgent = createAgent({
  name: "my-agent",
  tools: [myTool],
  model: { ... }
});
```

**2. Workflows** (`createWorkflow()` calls)
```typescript
// Detected as: Symbol with workflow structure
// Can query: "show workflows" → finds createWorkflow() calls
const myWorkflow = createWorkflow({
  name: "checkout-flow",
  steps: { ... }
});
```

**3. Tools** (`createTool()` calls)
```typescript
// Detected as: Symbol with tool definition
// Can query: "find tools" → finds createTool() calls
const myTool = createTool({
  id: "my-tool",
  execute: async (params) => { ... }
});
```

**4. Integrations** (import patterns)
```typescript
// Detected as: Import relationships
// Can query: "what uses OpenAI" → finds OpenAI imports
import { OpenAI } from '@mastra/core';
```

### Enhanced Queries for Mastra

**Agent Analysis:**
- Find all agents in codebase
- Show which tools an agent uses
- Find agents using specific models
- Track agent dependencies

**Workflow Analysis:**
- Find all workflows
- Show workflow step structure
- Find workflows using specific tools
- Trace data flow through workflows

**Tool Analysis:**
- Find all tool definitions
- Show tool dependencies
- Find unused tools
- Track tool usage across agents

**Integration Analysis:**
- Find all external integrations (OpenAI, Anthropic, etc.)
- Show integration dependencies
- Track API usage patterns

## Practical Workflow

### Scenario 1: Understanding a Mastra Project

```bash
# 1. Initial scan
deno task scan --path ./my-mastra-project

# 2. Discover structure
deno task query "show all agents"
deno task query "show all workflows"
deno task query "find all tools"

# 3. Analyze specific component
deno task query "dependencies of src/agents/customer-service.ts"
deno task query "who calls createWorkflow"
```

### Scenario 2: Developing New Agent

```bash
# 1. Watch mode for live updates
deno task watch --path src/agents

# 2. As you code, query relationships
deno task query "what tools does MyAgent use"
deno task query "show agent dependencies"

# 3. Find patterns to follow
deno task query "find agents using OpenAI"
deno task query "show workflow patterns"
```

### Scenario 3: Debugging Workflow

```bash
# 1. Find workflow definition
deno task query "symbols in src/workflows/checkout.ts"

# 2. Trace data flow
deno task query "call graph of processPayment depth 3"

# 3. Find issues
deno task query "unused exports in src/workflows"
deno task query "dead code"
```

## Database Schema for Mastra

### Kuzu (Graph) - Unchanged
Works perfectly for Mastra because it's TypeScript:
- **Symbol nodes**: Agents, workflows, tools are all symbols
- **Type nodes**: Mastra types and custom types
- **Import nodes**: Framework and integration imports
- **Relationships**: CALLS, USES, DEPENDS_ON work naturally

### DuckDB (Analytics) - Can Be Extended

Current metrics work for Mastra:
- File complexity → Workflow complexity
- Symbol counts → Agent/tool counts
- Import tracking → Integration tracking

Optional Mastra-specific extensions:
```sql
-- Agent metrics
CREATE TABLE agent_metrics (
  agent_id VARCHAR PRIMARY KEY,
  tool_count INTEGER,
  model_type VARCHAR,
  avg_response_time DECIMAL
);

-- Workflow metrics
CREATE TABLE workflow_metrics (
  workflow_id VARCHAR PRIMARY KEY,
  step_count INTEGER,
  avg_duration DECIMAL,
  error_rate DECIMAL
);
```

## Bridge Patterns

### Pattern 1: Agent Discovery
```typescript
// What the scanner sees:
const agent = createAgent({ name: "support" });

// What you can query:
"find all agents" → Searches for createAgent() calls
"show agent support" → Finds specific agent definition
```

### Pattern 2: Workflow Tracing
```typescript
// What the scanner sees:
const workflow = createWorkflow({
  steps: {
    step1: createStep(...),
    step2: createStep(...)
  }
});

// What you can query:
"show workflows" → Finds createWorkflow() calls
"call graph of step1" → Traces step execution
```

### Pattern 3: Tool Integration
```typescript
// What the scanner sees:
import { OpenAI } from '@mastra/core';
const tool = createTool({ ... });

// What you can query:
"dependencies of tool.ts" → Shows OpenAI import
"who uses OpenAI" → Finds all OpenAI usage
```

## Future Enhancements

### Phase 3 Possibilities (After Stage 2)
1. **Mastra-Specific AST Analysis**
   - Deep understanding of agent structure
   - Workflow step validation
   - Tool contract checking

2. **Runtime Integration**
   - Live agent monitoring
   - Workflow execution tracing
   - Performance profiling

3. **Mastra Linting**
   - Agent best practices
   - Workflow patterns validation
   - Tool integration checks

## Summary

**What Works Today:**
- ✅ Scan any Mastra codebase
- ✅ Query agents, workflows, tools as TypeScript symbols
- ✅ Track dependencies and relationships
- ✅ Watch mode for live development
- ✅ Natural language queries

**What Stage 2 Adds:**
- Mastra-specific query templates
- Agent/workflow/tool discovery patterns
- Mastra development workflows
- Integration with Mastra knowledge base

**The Power:**
Our TypeScript foundation is Mastra-ready. We just need to add Mastra-aware queries and patterns on top of the solid analysis base we built.
