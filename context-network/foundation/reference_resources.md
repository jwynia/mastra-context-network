# Project Reference Resources

## Purpose
This document catalogs and organizes external reference documentation and resources that support the development and understanding of the TypeScript LLM Agent project built with Mastra framework.

## Classification
- **Domain:** Foundation
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established
- **Lifecycle Stage:** Active
- **Audience:** Developers, Architects, New Team Members

## Primary Reference Documentation

### Mastra Framework Documentation
The official Mastra framework documentation is available locally at `/workspaces/mastra-context-network/reference/mastra-docs/` and serves as the authoritative reference for framework functionality.

#### Documentation Structure

```
reference/mastra-docs/
├── 00-quick-start/          # Getting started quickly with Mastra
│   ├── cheatsheet.md        # Quick reference for common operations
│   ├── import-patterns.md   # Standard import patterns and conventions
│   ├── installation.md      # Setup and installation instructions
│   ├── minimal-example.md   # Minimal working example
│   └── prerequisites.md     # Required knowledge and tools
├── 01-core-concepts/        # Fundamental framework concepts
│   ├── architecture-overview.md  # High-level framework architecture
│   ├── data-flow.md         # How data moves through Mastra
│   ├── key-abstractions.md  # Core abstractions and their purposes
│   ├── mental-model.md      # Conceptual model for understanding Mastra
│   └── terminology.md       # Framework-specific terminology
├── 02-api-reference/        # Detailed API documentation
│   ├── agents/              # Agent API documentation
│   ├── core/                # Core framework APIs
│   ├── integrations/        # Integration APIs
│   ├── memory/              # Memory system APIs
│   ├── rag/                 # RAG (Retrieval Augmented Generation) APIs
│   ├── tools/               # Tool system APIs
│   └── workflows/           # Workflow APIs
├── 03-patterns/             # Common usage patterns
│   ├── error-handling.md    # Error handling patterns
│   └── performance-patterns.md  # Performance optimization patterns
├── 04-integration/          # Integration guides
│   ├── chatbot-tutorial.md  # Building chatbots with Mastra
│   └── testing-setup.md     # Testing framework integration
├── 05-gotchas/              # Common pitfalls and solutions
│   └── common-mistakes.md   # Frequently encountered issues
└── 06-advanced/             # Advanced topics
    └── internals/           # Framework internals
```

#### Key Documentation Resources

##### Quick Start Resources
- **Cheatsheet** (`00-quick-start/cheatsheet.md`): Essential commands and patterns for rapid development
- **Import Patterns** (`00-quick-start/import-patterns.md`): Standard ways to import and use Mastra components
- **Minimal Example** (`00-quick-start/minimal-example.md`): Starting point for new agent projects

##### Core Concepts
- **Architecture Overview** (`01-core-concepts/architecture-overview.md`): Understanding Mastra's design principles
- **Data Flow** (`01-core-concepts/data-flow.md`): How data moves through agents and workflows
- **Mental Model** (`01-core-concepts/mental-model.md`): Conceptual framework for thinking in Mastra

##### API References
- **Agents** (`02-api-reference/agents/`): Complete agent API documentation
- **Workflows** (`02-api-reference/workflows/`): Workflow construction and execution
- **Tools** (`02-api-reference/tools/`): Tool integration and custom tool development
- **Memory** (`02-api-reference/memory/`): Memory system for state persistence

##### Best Practices
- **Error Handling** (`03-patterns/error-handling.md`): Robust error handling in agent systems
- **Performance Patterns** (`03-patterns/performance-patterns.md`): Optimizing agent performance
- **Common Mistakes** (`05-gotchas/common-mistakes.md`): Avoiding common pitfalls

### Meta Documentation
The `_meta/` directory contains documentation about the documentation itself, including:
- Decision trees for finding the right documentation
- Learning paths for different roles
- Search indexes for quick lookup
- Validation reports ensuring documentation quality

## Usage Guidelines

### When to Reference
1. **During Implementation**: Always check API reference before implementing new features
2. **Problem Solving**: Consult gotchas and patterns when encountering issues
3. **Architecture Decisions**: Review core concepts before making structural changes
4. **Learning**: Follow learning paths in meta documentation for structured learning

### Documentation Priority
When multiple sources exist, prioritize in this order:
1. Local Mastra documentation (most up-to-date for this project)
2. Context network documentation (project-specific adaptations)
3. Official Mastra documentation online (for latest features not yet in local docs)

### Keeping Documentation Current
- The reference documentation should be periodically updated from official sources
- Project-specific deviations should be documented in the context network
- Version compatibility notes should be maintained when updating

## Integration with Context Network

### Cross-References
Key context network documents that relate to the reference documentation:
- `/cross_cutting/mastra_integration_guide.md` - Project-specific integration patterns
- `/cross_cutting/mastra_workflow_patterns.md` - Custom workflow patterns for this project
- `/architecture/agent_architecture.md` - How we implement Mastra agents
- `/architecture/workflow_architecture.md` - Our workflow design principles

### Documentation Workflow
1. Check reference documentation for framework capabilities
2. Document project-specific adaptations in context network
3. Create decision records for significant deviations
4. Update integration guides with lessons learned

## Relationships
- **Parent Nodes:** [foundation/system_overview.md]
- **Child Nodes:** None
- **Related Nodes:** 
  - [cross_cutting/mastra_integration_guide.md] - extends - Project-specific integration patterns
  - [cross_cutting/mastra_workflow_patterns.md] - extends - Custom workflow patterns
  - [architecture/agent_architecture.md] - implements - Agent implementation details
  - [architecture/workflow_architecture.md] - implements - Workflow implementation details

## Navigation Guidance
- **Access Context:** Reference this document when needing authoritative information about Mastra framework capabilities
- **Common Next Steps:** 
  - Review specific API documentation for implementation details
  - Check integration guides for project-specific patterns
  - Consult gotchas when troubleshooting
- **Related Tasks:** Feature implementation, debugging, architecture decisions
- **Update Patterns:** Update when new reference documentation is added or framework version changes

## Metadata
- **Created:** 2025-08-28
- **Last Updated:** 2025-08-28
- **Updated By:** AI Assistant

## Change History
- 2025-08-28: Initial documentation of Mastra reference resources