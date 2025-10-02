# Mastra Framework Integration - Index

## Overview

This section contains all Mastra framework-specific knowledge, patterns, and integration guides for using this TypeScript code analysis template with Mastra projects.

**Stage 1 (Complete)**: Solid TypeScript analysis foundation
**Stage 2 (Current)**: Mastra-specific query patterns and development workflows

## Quick Links

### Getting Started
- **[TypeScript Integration](typescript-integration.md)** - How the TypeScript foundation enhances Mastra development
- **[Query Patterns](query-patterns.md)** - Comprehensive Mastra query examples
- **[Mastra Development Guide](../../docs/mastra-guide.md)** - User-facing guide for Mastra projects

### Framework Documentation
- **[Architecture](architecture.md)** - Mastra framework architecture and concepts
- **[API Reference](api-reference.md)** - Complete Mastra API documentation
- **[Patterns](patterns.md)** - Best practices and design patterns
- **[Recipes](recipes.md)** - Common implementation patterns and examples

### Development & Operations
- **[Testing](testing.md)** - Testing strategies for Mastra applications
- **[Deployment](deployment.md)** - Deployment guides and strategies
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
- **[Environment Setup](environment-setup.md)** - Development environment configuration

### Integration Guides
- **[Integrations](integrations.md)** - Third-party integrations (OpenAI, Anthropic, etc.)
- **[Migrations](migrations.md)** - Migration guides between Mastra versions

## What This Section Provides

### 1. Mastra-Aware Code Analysis

**Query Templates for Mastra Components:**
- Find all agents (`createAgent()` calls)
- Find all workflows (`createWorkflow()` calls)
- Find all tools (`createTool()` calls)
- Track integrations (`@mastra/*` imports)
- Analyze LLM provider usage

**Natural Language Queries:**
```bash
deno task query "show all agents"
deno task query "show workflows"
deno task query "find tools"
deno task query "llm providers"
```

See [Query Patterns](query-patterns.md) for comprehensive examples.

### 2. Development Workflows

**Onboarding Workflow:**
1. Scan Mastra codebase
2. Discover agents, workflows, tools
3. Understand component relationships
4. Deep dive into specific areas

**Agent Development Workflow:**
1. Find existing agent patterns
2. Check available tools
3. Use watch mode for live updates
4. Verify agent structure and dependencies

**Workflow Development:**
1. Find workflow patterns
2. Identify required tools
3. Develop with watch mode
4. Trace execution flow

**Debugging Workflow:**
1. Identify problem area
2. Trace execution flow
3. Check dependencies
4. Compare with working examples

See [TypeScript Integration](typescript-integration.md) for detailed workflows.

### 3. Framework Knowledge

**Architecture Understanding:**
- Agent structure and lifecycle
- Workflow execution model
- Tool integration patterns
- LLM provider abstraction

**Best Practices:**
- Agent design patterns
- Workflow composition
- Tool creation guidelines
- Error handling strategies

See [Architecture](architecture.md) and [Patterns](patterns.md).

### 4. Integration Support

**Supported Integrations:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Custom LLM providers
- Third-party APIs

**Query Integration Usage:**
```bash
deno task query "show integrations"
deno task query "who imports openai"
deno task query "model usage"
```

See [Integrations](integrations.md) for details.

## How to Use This Section

### For New Mastra Users

1. **Start Here**: [TypeScript Integration](typescript-integration.md)
   - Understand how TypeScript analysis works with Mastra
   - Learn the staged approach (TypeScript foundation + Mastra patterns)

2. **Learn Queries**: [Query Patterns](query-patterns.md)
   - Try basic queries: "show agents", "show workflows"
   - Practice agent and workflow analysis
   - Experiment with different output formats

3. **Follow Workflows**: [Mastra Development Guide](../../docs/mastra-guide.md)
   - Onboarding workflow
   - Agent development workflow
   - Debugging workflow

4. **Study Framework**: [Architecture](architecture.md)
   - Agent concepts
   - Workflow execution
   - Tool patterns

### For Experienced Mastra Developers

1. **Quick Reference**: [API Reference](api-reference.md)
   - API documentation
   - Type signatures
   - Configuration options

2. **Advanced Patterns**: [Patterns](patterns.md)
   - Complex agent compositions
   - Workflow orchestration
   - Tool chaining

3. **Recipes**: [Recipes](recipes.md)
   - Common implementation patterns
   - Working examples
   - Copy-paste solutions

4. **Troubleshooting**: [Troubleshooting](troubleshooting.md)
   - Common issues
   - Debug strategies
   - Performance optimization

### For Debugging

1. **Quick Diagnosis**: [Troubleshooting](troubleshooting.md)
   - Error patterns
   - Common causes
   - Quick fixes

2. **Deep Analysis**: [Query Patterns](query-patterns.md)
   - Trace execution: `call graph of [function] depth 3`
   - Find dependencies: `dependencies of [file]`
   - Check usage: `who calls [function]`

3. **Testing**: [Testing](testing.md)
   - Test strategies
   - Debugging tests
   - Mock patterns

## Integration with TypeScript Foundation

This Mastra integration is built on top of a solid TypeScript analysis foundation:

### Stage 1: TypeScript Foundation (Complete)
- ✅ AST scanning for TypeScript/JavaScript
- ✅ Symbol extraction (functions, classes, types)
- ✅ Relationship tracking (calls, imports, extends)
- ✅ Graph database (Kuzu) for semantic relationships
- ✅ Analytics database (DuckDB) for metrics
- ✅ Incremental file watching
- ✅ Natural language query system
- ✅ 13 core query templates

### Stage 2: Mastra Enhancement (Current)
- ✅ 8 Mastra-specific query templates
- ✅ 8 Mastra natural language patterns
- ✅ Mastra documentation integration
- ✅ Mastra development workflows
- ✅ .claude commands for Mastra
- ✅ Comprehensive query examples

**Why This Matters:**
- Mastra components are TypeScript → foundation already works
- Query templates add Mastra-aware pattern recognition
- No changes needed to core scanning/watching
- All TypeScript queries still work

See [TypeScript Integration](typescript-integration.md) for the full story.

## Available Query Patterns

### Component Discovery
```bash
# Agents
deno task query "show all agents"
deno task query "find agents"

# Workflows
deno task query "show workflows"
deno task query "list workflows"

# Tools
deno task query "show tools"
deno task query "find tools"

# Integrations
deno task query "show integrations"
```

### Component Analysis
```bash
# Agent analysis
deno task query "agent tools in src/agents/[agent].ts"
deno task query "dependencies of src/agents/[agent].ts"

# Workflow analysis
deno task query "workflow steps in src/workflows/[workflow].ts"
deno task query "call graph of [step] depth 3"

# Tool analysis
deno task query "who calls [tool]"
deno task query "dependents of src/tools/[tool].ts"
```

### Integration Analysis
```bash
# Model usage
deno task query "show models"
deno task query "llm providers"

# Specific providers
deno task query "who imports openai"
deno task query "who imports anthropic"
```

See [Query Patterns](query-patterns.md) for 50+ examples.

## .claude Commands for Mastra

Mastra-specific slash commands available in Claude Code:

- `/mastra-agent` - Create or analyze Mastra agents
- `/mastra-workflow` - Create or analyze workflows
- `/mastra-tool` - Create or analyze tools
- `/mastra-api` - API reference and guidance

General commands useful for Mastra:
- `/audit` - Code quality audit
- `/discovery` - Discover codebase patterns
- `/refactor` - Refactoring assistance

## Contributing

### Adding New Mastra Patterns

**Query Templates** (`scripts/lib/query-builder.ts`):
```typescript
static findMastraPattern(param: string): QueryBuilder {
  return new QueryBuilder()
    .match("(pattern)")
    .where(`condition`)
    .return("results")
    .orderBy("field");
}
```

**Natural Language** (`scripts/lib/natural-language-parser.ts`):
```typescript
if (this.matchPattern(normalized, ["pattern", "alternative"])) {
  return {
    builder: QueryTemplates.findMastraPattern(extracted),
    pattern: "mastra-pattern",
    confidence: 0.9,
  };
}
```

### Documenting Discoveries

When you discover useful Mastra patterns or queries:
1. Add examples to [Query Patterns](query-patterns.md)
2. Document workflows in [Patterns](patterns.md)
3. Create recipes in [Recipes](recipes.md)
4. Update [Troubleshooting](troubleshooting.md) with solutions

## Next Steps

**New to Mastra?**
→ Start with [TypeScript Integration](typescript-integration.md)

**Ready to Query?**
→ Jump to [Query Patterns](query-patterns.md)

**Building Agents?**
→ See [Architecture](architecture.md) and [Patterns](patterns.md)

**Debugging?**
→ Check [Troubleshooting](troubleshooting.md)

**Need Examples?**
→ Explore [Recipes](recipes.md)

---

**Last Updated**: Phase 2 Mastra Integration Complete
**Status**: Production Ready for Mastra Development
