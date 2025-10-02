# Mastra Development Guide

## Overview

This template is **optimized for Mastra framework development**, providing deep insight into agents, workflows, tools, and integrations through semantic code analysis.

**What makes this Mastra-specific:**
- Pre-built query patterns for agents, workflows, and tools
- Natural language queries for Mastra components
- Integration tracking (OpenAI, Anthropic, etc.)
- Development workflows tailored to Mastra patterns

## Quick Start for Mastra Projects

### 1. Scan Your Mastra Codebase

```bash
# Initial scan
deno task scan --path ./your-mastra-project

# Or watch for live updates during development
deno task watch --path ./your-mastra-project/src
```

### 2. Discover Project Structure

```bash
# Find all Mastra components
deno task query "show all agents"
deno task query "show all workflows"
deno task query "show all tools"
deno task query "show integrations"
```

### 3. Explore Specific Components

```bash
# Analyze an agent
deno task query "dependencies of src/agents/customer-service.ts"
deno task query "agent tools in src/agents/customer-service.ts"

# Analyze a workflow
deno task query "workflow steps in src/workflows/checkout.ts"
deno task query "call graph of processPayment depth 2"
```

## Understanding Mastra Components

### Agents

Agents are detected by `createAgent()` calls.

**Find all agents:**
```bash
deno task query "show all agents"
deno task query "find agents"
deno task query "list agents"
```

**Analyze agent structure:**
```bash
# What tools does an agent use?
deno task query "agent tools in src/agents/sales.ts"

# What dependencies does an agent have?
deno task query "dependencies of src/agents/support.ts"

# What symbols are defined in an agent file?
deno task query "symbols in src/agents/customer-service.ts"

# Find agents using specific functionality
deno task query "who calls openai"
deno task query "who calls sendEmail"
```

**Example workflow:**
```bash
# 1. Find all agents
deno task query "show all agents"

# 2. Deep dive into a specific agent
deno task query "symbols in src/agents/customer-service.ts"

# 3. Understand its dependencies
deno task query "dependencies of src/agents/customer-service.ts"

# 4. Find what tools it uses
deno task query "agent tools in src/agents/customer-service.ts"
```

### Workflows

Workflows are detected by `createWorkflow()` calls.

**Find all workflows:**
```bash
deno task query "show workflows"
deno task query "find workflows"
deno task query "list workflows"
```

**Analyze workflow structure:**
```bash
# What steps are in a workflow?
deno task query "workflow steps in src/workflows/onboarding.ts"

# What does a workflow depend on?
deno task query "dependencies of src/workflows/checkout.ts"

# Trace workflow execution
deno task query "call graph of initiateCheckout depth 3"

# Find workflows using specific tools
deno task query "dependents of src/tools/stripe.ts"
```

**Example debugging workflow:**
```bash
# 1. Find the problematic workflow
deno task query "show workflows" | grep checkout

# 2. Examine its structure
deno task query "symbols in src/workflows/checkout.ts"

# 3. Trace the execution path
deno task query "call graph of processPayment depth 3"

# 4. Check dependencies
deno task query "dependencies of src/workflows/checkout.ts"
```

### Tools

Tools are detected by `createTool()` calls.

**Find all tools:**
```bash
deno task query "show tools"
deno task query "find tools"
deno task query "list tools"
```

**Analyze tool usage:**
```bash
# Who uses this tool?
deno task query "who calls weatherTool"
deno task query "dependents of src/tools/calendar.ts"

# What does a tool depend on?
deno task query "dependencies of src/tools/database.ts"

# Find unused tools
deno task query "unused exports" | grep -i tool
```

**Example tool analysis:**
```bash
# 1. List all available tools
deno task query "show tools"

# 2. Find who's using a specific tool
deno task query "who calls emailTool"

# 3. Check tool dependencies
deno task query "dependencies of src/tools/email.ts"

# 4. Trace tool usage in workflows
deno task query "call graph of sendEmail depth 2"
```

### Integrations

Integrations are tracked by imports from `@mastra/*` packages and external providers.

**Find integrations:**
```bash
# All Mastra integrations
deno task query "show integrations"
deno task query "mastra integrations"

# Specific providers
deno task query "who imports openai"
deno task query "who imports anthropic"
deno task query "who imports @mastra/core"
```

**Model and LLM usage:**
```bash
# Show all model usage
deno task query "show models"
deno task query "model usage"
deno task query "llm usage"

# Find LLM providers
deno task query "llm providers"
deno task query "show providers"
```

## Common Development Workflows

### Workflow 1: Onboarding to a Mastra Project

```bash
# Step 1: Initial scan
deno task scan --path ./mastra-project

# Step 2: High-level overview
deno task query "show all agents"
deno task query "show all workflows"
deno task query "show all tools"

# Step 3: Understand entry points
deno task query "symbols in src/index.ts"
deno task query "exports in src/index.ts"

# Step 4: Explore main components
deno task query "dependencies of src/agents/main.ts"
deno task query "call graph of mainWorkflow depth 2"

# Step 5: Check integrations
deno task query "show integrations"
deno task query "llm providers"
```

### Workflow 2: Adding a New Agent

```bash
# Step 1: Find existing patterns
deno task query "show all agents"
deno task query "symbols in src/agents/example-agent.ts"

# Step 2: Check available tools
deno task query "show all tools"
deno task query "exports in src/tools"

# Step 3: Start watch mode
deno task watch --path src/agents

# Step 4: As you develop, verify structure
deno task query "symbols in src/agents/new-agent.ts"
deno task query "dependencies of src/agents/new-agent.ts"
deno task query "agent tools in src/agents/new-agent.ts"

# Step 5: Test integration
deno task query "who calls newAgent"
```

### Workflow 3: Building a Workflow

```bash
# Step 1: Find workflow patterns
deno task query "show all workflows"
deno task query "symbols in src/workflows/example.ts"

# Step 2: Identify required tools
deno task query "show all tools"
deno task query "exports in src/tools"

# Step 3: Start development with watch
deno task watch --path src/workflows

# Step 4: Verify workflow structure
deno task query "workflow steps in src/workflows/new-workflow.ts"
deno task query "dependencies of src/workflows/new-workflow.ts"

# Step 5: Trace execution
deno task query "call graph of workflowEntry depth 3"
```

### Workflow 4: Debugging a Mastra Application

```bash
# Step 1: Identify the problem area
deno task query "symbols in src/workflows/problematic.ts"

# Step 2: Trace execution flow
deno task query "call graph of failingStep depth 3"

# Step 3: Check dependencies
deno task query "dependencies of src/workflows/problematic.ts"

# Step 4: Find all usages
deno task query "who calls suspiciousFunction"

# Step 5: Compare with working examples
deno task query "show all workflows"
deno task query "workflow steps in src/workflows/working-example.ts"
```

### Workflow 5: Refactoring Agents or Workflows

```bash
# Step 1: Understand current usage
deno task query "who calls oldAgentFunction"

# Step 2: Find all dependencies
deno task query "dependencies of src/agents/old-agent.ts"

# Step 3: Check integration points
deno task query "dependents of src/agents/old-agent.ts"

# Step 4: After refactoring, verify
deno task query "who calls newAgentFunction"
deno task query "unused exports"
```

## Advanced Queries

### Finding Complex Patterns

**Multi-level call graphs:**
```bash
# Deep agent execution trace
deno task query "call graph of agentExecute depth 5"

# Workflow data flow
deno task query "call graph of step1 depth 3"
```

**Dependency analysis:**
```bash
# Find circular dependencies (manual cross-reference)
deno task query "dependencies of src/agents/a.ts"
deno task query "dependencies of src/agents/b.ts"

# Find all files depending on a utility
deno task query "dependents of src/utils/logger.ts"
```

**Architecture queries:**
```bash
# Show all classes
deno task query "show classes"

# Find type hierarchy
deno task query "what extends BaseAgent"
deno task query "implementations of ITool"

# Find interface implementations
deno task query "implementations of IWorkflowStep"
```

### Combining Queries

**Pipeline pattern with jq:**
```bash
# Find all agents and check their dependencies
deno task query "show agents" -f json | \
  jq '.[] | .file' | \
  xargs -I {} deno task query "dependencies of {}"
```

**Using grep for filtering:**
```bash
# Find tools but filter for specific patterns
deno task query "show tools" | grep -i "email\|notification"

# Find unused exports in tools directory
deno task query "unused exports" | grep "src/tools"
```

### Custom Cypher Queries

**Find agents with specific models:**
```bash
deno task query "MATCH (i:Import) WHERE i.imported_path CONTAINS 'gpt-4' RETURN DISTINCT i.source_file"
```

**Count workflow steps:**
```bash
deno task query "MATCH (s:Symbol) WHERE s.name = 'createStep' RETURN s.file, COUNT(*) as step_count"
```

**Find tool chains:**
```bash
deno task query "MATCH path = (a:Symbol)-[:CALLS*1..3]->(t:Symbol) WHERE a.name CONTAINS 'Agent' AND t.name CONTAINS 'Tool' RETURN path LIMIT 10"
```

## Output Formats

### Table Format (Default)

```bash
deno task query "show all agents"
# Outputs pretty-printed table
```

### JSON Format

```bash
deno task query "show all agents" -f json
# Perfect for piping to jq or other tools
```

### Tree Format

```bash
deno task query "call graph of initialize depth 3" -f tree
# Hierarchical visualization
```

### Count Format

```bash
deno task query "show all agents" -f count
# Just the number
```

## Performance Tips

### Use Caching for Expensive Queries

```bash
# Enable 5-minute cache
deno task query "expensive query" --cache
```

### Limit Results

```bash
# Using Cypher LIMIT
deno task query "MATCH (n:Symbol) RETURN n.name LIMIT 10"
```

### Watch Mode for Development

```bash
# Instead of re-scanning, use watch mode
deno task watch --path src

# Changes auto-update databases
# Queries always return current data
```

## Troubleshooting

### No Agents/Workflows/Tools Found

**Possible causes:**
1. Mastra code not yet scanned
2. Different naming patterns

**Solutions:**
```bash
# Rescan the codebase
deno task scan --path ./your-mastra-project --clear

# Verify files are detected
deno task query "symbols" | grep -i "createAgent\|createWorkflow\|createTool"

# Check if files are in database
deno task query "MATCH (s:Symbol) RETURN DISTINCT s.file LIMIT 20"
```

### Query Returns Unexpected Results

**Debug steps:**
```bash
# Use verbose mode to see generated Cypher
deno task query "your query" -v

# Try raw Cypher for precise control
deno task query "MATCH (s:Symbol) WHERE s.name = 'createAgent' RETURN s"

# Check what symbols exist
deno task query "symbols in problematic-file.ts"
```

### Database Out of Sync

**Fix:**
```bash
# Full rescan
deno task scan --clear

# Or use watch mode to keep in sync
deno task watch
```

### Performance Issues

**Solutions:**
```bash
# Use incremental scanning
deno task scan --incremental

# Reduce query depth
deno task query "call graph of func depth 2"  # Instead of depth 5

# Enable caching
deno task query "repeated query" --cache
```

## Integration with DuckDB Analytics

For deeper metrics analysis, query DuckDB directly:

```bash
# Find complex agents
duckdb .duckdb/metrics.db "
  SELECT file_path, complexity_sum, function_count
  FROM file_metrics
  WHERE file_path LIKE '%agents%'
  ORDER BY complexity_sum DESC
  LIMIT 10
"

# Find complex workflows
duckdb .duckdb/metrics.db "
  SELECT file_path, total_lines, complexity_avg
  FROM file_metrics
  WHERE file_path LIKE '%workflows%'
  AND complexity_avg > 5
"
```

## Next Steps

- **[Query Patterns](../context-network/mastra/query-patterns.md)** - Comprehensive Mastra query examples
- **[Mastra Architecture](../context-network/mastra/architecture.md)** - Deep dive into Mastra framework
- **[TypeScript Integration](../context-network/mastra/typescript-integration.md)** - How TS analysis enhances Mastra development

---

**Questions or issues?** Check the [troubleshooting guide](../context-network/mastra/troubleshooting.md) or review the [context network](../context-network/discovery.md) for architectural details.
