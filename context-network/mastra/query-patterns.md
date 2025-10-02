# Mastra Query Patterns

## Overview

This document provides Mastra-specific query patterns for the TypeScript code analysis system. All queries work with natural language, templates, or raw Cypher.

## Agent Queries

### Find All Agents
```bash
# Natural language
deno task query "show all agents"
deno task query "find agents"
deno task query "list agents"

# Template
deno task query -t find-symbols "createAgent"

# Cypher
deno task query "MATCH (s:Symbol) WHERE s.name = 'createAgent' RETURN s.file, s.line"
```

### Find Agent Dependencies
```bash
# What tools does an agent use?
deno task query "dependencies of src/agents/customer-service.ts"

# What does an agent import?
deno task query "imports in src/agents/sales-agent.ts"

# Show agent call graph
deno task query "call graph of customerServiceAgent depth 2"
```

### Find Agents Using Specific Tools
```bash
# Find which agents use a tool
deno task query "who calls weatherTool"

# Find agents importing specific packages
deno task query "dependents of src/tools/openai-tool.ts"
```

### Agent Configuration Analysis
```bash
# Show agent exports
deno task query "exports in src/agents/support.ts"

# Find agent symbols
deno task query "symbols in src/agents/sales.ts"
```

## Workflow Queries

### Find All Workflows
```bash
# Natural language
deno task query "show all workflows"
deno task query "find workflows"
deno task query "list workflows"

# Template
deno task query -t find-symbols "createWorkflow"

# Cypher
deno task query "MATCH (s:Symbol) WHERE s.name = 'createWorkflow' RETURN s.file, s.line"
```

### Workflow Step Analysis
```bash
# Find createStep calls in a workflow
deno task query "who calls createStep in src/workflows/checkout.ts"

# Show workflow structure
deno task query "symbols in src/workflows/onboarding.ts"

# Trace step execution
deno task query "call graph of processPayment depth 3"
```

### Workflow Dependencies
```bash
# What does a workflow depend on?
deno task query "dependencies of src/workflows/checkout.ts"

# Which workflows use a specific tool?
deno task query "dependents of src/tools/stripe.ts"

# Show workflow imports
deno task query "imports in src/workflows/user-signup.ts"
```

### Workflow Data Flow
```bash
# Find all step definitions
deno task query "symbols in src/workflows/checkout.ts" | grep createStep

# Trace data passing
deno task query "call graph of validatePayment depth 2"

# Find workflow entry points
deno task query "callers of executeWorkflow"
```

## Tool Queries

### Find All Tools
```bash
# Natural language
deno task query "show all tools"
deno task query "find tools"
deno task query "list tools"

# Template
deno task query -t find-symbols "createTool"
```

### Tool Usage Analysis
```bash
# Who uses this tool?
deno task query "who calls weatherTool"
deno task query "dependents of src/tools/calendar.ts"

# What does a tool use?
deno task query "dependencies of src/tools/database.ts"
deno task query "call graph of databaseTool depth 2"
```

### Find Unused Tools
```bash
# Find tools that are exported but never used
deno task query "unused exports" | grep Tool

# Find tool definitions never called
deno task query "symbols in src/tools" | grep "exported: true"
```

### Tool Integration Points
```bash
# Find external API tools
deno task query "imports in src/tools" | grep -E "openai|anthropic|stripe"

# Show tool dependencies
deno task query "dependencies of src/tools/openai.ts"
```

## Integration Queries

### Find External Integrations
```bash
# Find OpenAI usage
deno task query "what imports @mastra/openai"
deno task query "dependents of node_modules/@mastra/openai"

# Find Anthropic usage
deno task query "what imports @anthropic-ai/sdk"

# Find all Mastra integrations
deno task query "imports" | grep "@mastra/"
```

### Integration Dependencies
```bash
# Show all external dependencies
deno task query "imports in src" | grep "from '"

# Find integration usage
deno task query "who calls OpenAI"
deno task query "who calls Anthropic"
```

### API Key Usage
```bash
# Find env var usage (search for process.env)
deno task query "symbols" | grep "process.env"

# Find config files
deno task query "symbols in src/config"
```

## Model Queries

### Find Model Usage
```bash
# Find model configurations
deno task query "symbols" | grep -i "model"

# Show model imports
deno task query "imports" | grep -E "gpt|claude|llama"

# Find model switching logic
deno task query "call graph of selectModel"
```

### Model Configuration
```bash
# Find model config files
deno task query "symbols in src/config/models.ts"

# Show model dependencies
deno task query "dependencies of src/models"
```

## Architecture Queries

### Project Structure
```bash
# Show all exports (public API)
deno task query "unused exports" -f json

# Find main entry points
deno task query "symbols in src/index.ts"

# Show module structure
deno task query "dependencies of src" | sort | uniq
```

### Code Organization
```bash
# Find all classes
deno task query "show classes"

# Find interfaces
deno task query "symbols" | grep "kind: interface"

# Show type hierarchy
deno task query "what extends BaseAgent"
deno task query "implementations of ITool"
```

### Dependency Analysis
```bash
# Find circular dependencies (if any)
deno task query "dependencies of src/agents/a.ts"
deno task query "dependencies of src/agents/b.ts"
# Cross-reference manually or write custom query

# Show dependency tree
deno task query "dependencies of src/index.ts" -f tree
```

## Development Queries

### During Development
```bash
# 1. Start watch mode
deno task watch --path src

# 2. As you code, query what you just added
deno task query "symbols in [file-you-just-edited]"

# 3. Check relationships
deno task query "who calls [function-you-just-added]"
```

### Code Review Queries
```bash
# Find dead code
deno task query "dead code"

# Find unused exports
deno task query "unused exports"

# Check complexity
deno task query "symbols in src/workflows/complex.ts" -v
```

### Debugging Queries
```bash
# Trace execution path
deno task query "call graph of problematicFunction depth 3"

# Find all usages
deno task query "who calls suspiciousFunction"

# Show dependencies
deno task query "dependencies of src/failing-module.ts"
```

## Advanced Patterns

### Custom Cypher Queries

**Find agents with specific model:**
```cypher
MATCH (agent:Symbol)-[:CALLS]->(createAgent:Symbol)
WHERE createAgent.name = 'createAgent'
AND agent.file CONTAINS 'gpt-4'
RETURN agent.name, agent.file
```

**Find workflow steps:**
```cypher
MATCH (workflow:Symbol)-[:CALLS]->(step:Symbol)
WHERE workflow.name CONTAINS 'Workflow'
AND step.name = 'createStep'
RETURN workflow.name, COUNT(step) as step_count
```

**Find tool chains:**
```cypher
MATCH path = (agent:Symbol)-[:CALLS*1..3]->(tool:Symbol)
WHERE agent.name CONTAINS 'Agent'
AND tool.name CONTAINS 'Tool'
RETURN path
```

### Combining with DuckDB

**Query file metrics for agents:**
```bash
# Via DuckDB directly
duckdb .duckdb/metrics.db "
  SELECT file_path, complexity_sum, function_count
  FROM file_metrics
  WHERE file_path LIKE '%agents%'
  ORDER BY complexity_sum DESC
  LIMIT 10
"
```

**Find complex workflows:**
```bash
duckdb .duckdb/metrics.db "
  SELECT file_path, total_lines, complexity_avg
  FROM file_metrics
  WHERE file_path LIKE '%workflows%'
  AND complexity_avg > 5
"
```

## Query Tips

### Performance
- Use `--cache` for repeated queries: `deno task query "show agents" --cache`
- Use `-f count` for quick counts: `deno task query "show agents" -f count`
- Limit results with Cypher LIMIT clause

### Output Formats
- `--format table` - Default, pretty table
- `--format json` - JSON for scripting
- `--format tree` - Hierarchical view
- `--format count` - Just the count

### Combining Queries
```bash
# Pipeline pattern
deno task query "show agents" -f json | jq '.[] | .file' | xargs -I {} deno task query "dependencies of {}"
```

### Debugging Queries
- Use `-v` for verbose mode to see the Cypher
- Check `--nl-help` for natural language patterns
- Use `--templates` to see all templates

## Common Workflows

### Onboarding to a Mastra Project
```bash
# 1. Scan the codebase
deno task scan --path ./mastra-project

# 2. Discover structure
deno task query "show all agents"
deno task query "show all workflows"
deno task query "show all tools"

# 3. Understand main components
deno task query "symbols in src/index.ts"
deno task query "exports in src/index.ts"

# 4. Deep dive
deno task query "dependencies of src/agents/main.ts"
deno task query "call graph of mainWorkflow depth 2"
```

### Adding a New Agent
```bash
# 1. Find patterns to follow
deno task query "show all agents"
deno task query "symbols in src/agents/example-agent.ts"

# 2. Check tool availability
deno task query "show all tools"
deno task query "exports in src/tools"

# 3. Start watch mode
deno task watch --path src/agents

# 4. As you code, verify
deno task query "symbols in src/agents/new-agent.ts"
deno task query "dependencies of src/agents/new-agent.ts"
```

### Debugging a Workflow
```bash
# 1. Find the workflow
deno task query "symbols in src/workflows/problem.ts"

# 2. Trace execution
deno task query "call graph of problematicStep depth 3"

# 3. Check data sources
deno task query "dependencies of src/workflows/problem.ts"

# 4. Find similar patterns
deno task query "show all workflows"
deno task query "who calls createStep"
```

## Summary

**Core Patterns:**
- Agents: `"show all agents"`, `"dependencies of agent.ts"`
- Workflows: `"show all workflows"`, `"call graph of step"`
- Tools: `"show all tools"`, `"who calls tool"`
- Integrations: `"what imports @mastra/*"`

**Development Workflow:**
1. Scan → Query structure
2. Watch → Live updates
3. Query → Verify changes
4. Debug → Trace execution

**Power Users:**
- Write custom Cypher for complex queries
- Combine with DuckDB for metrics
- Pipeline with jq/grep for automation
