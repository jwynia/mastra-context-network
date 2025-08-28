# Mastra Framework Integration Guide

## Purpose
This document provides comprehensive guidelines for integrating and configuring the Mastra framework for TypeScript LLM agent development, including setup, architecture patterns, and best practices.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### Mastra Framework Overview

#### Core Philosophy

Mastra is built around modular, composable components that work together to create intelligent agents. The framework emphasizes:

1. **Dependency Injection**: Central configuration and component management
2. **Plugin Architecture**: Extensible components for tools, memory, and deployers
3. **Type Safety**: Full TypeScript support with schema validation
4. **Workflow Orchestration**: Step-based execution with branching and parallel processing

#### Official Documentation Reference

Comprehensive Mastra framework documentation is available locally at `/workspaces/mastra-context-network/reference/mastra-docs/`. Key resources include:
- **Quick Start**: `00-quick-start/` - Installation, prerequisites, and minimal examples
- **Core Concepts**: `01-core-concepts/` - Architecture overview, data flow, and mental models
- **API Reference**: `02-api-reference/` - Detailed API documentation for all components
- **Patterns**: `03-patterns/` - Common patterns and best practices

For detailed documentation structure and usage guidelines, see [foundation/reference_resources.md].

#### Key Components

```typescript
// Core Mastra architecture components
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core';
import { createWorkflow, createStep } from '@mastra/core';
import { Tool } from '@mastra/core';
```

### Project Setup and Configuration

#### Installation

```bash
# Core Mastra packages
npm install @mastra/core @mastra/cli

# Additional integrations (as needed)
npm install @mastra/github @mastra/slack @mastra/google

# Development dependencies
npm install -D @types/node typescript ts-node
```

#### Basic Project Structure

```
src/
├── mastra/
│   ├── index.ts              # Main Mastra configuration
│   ├── agents/
│   │   ├── index.ts          # Agent definitions
│   │   └── types.ts          # Agent type definitions
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   └── custom/           # Custom tool implementations
│   ├── workflows/
│   │   ├── index.ts          # Workflow definitions
│   │   └── steps/            # Individual step implementations
│   └── config/
│       ├── models.ts         # Model configurations
│       └── integrations.ts   # External service configs
├── types/
│   └── mastra.d.ts           # Custom type definitions
└── utils/
    └── validation.ts         # Schema validation helpers
```

#### Core Configuration

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core';
import { agents } from './agents';
import { tools } from './tools';
import { workflows } from './workflows';

export const mastra = new Mastra({
  name: 'my-agent-system',
  agents,
  tools,
  workflows,
  memory: {
    provider: 'upstash-redis', // or 'memory', 'postgres'
    config: {
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    },
  },
  logs: {
    type: 'CONSOLE', // or 'FILE'
    level: 'INFO',
  },
});
```

### Agent Development Patterns

#### Basic Agent Configuration

```typescript
// src/mastra/agents/index.ts
import { Agent } from '@mastra/core';
import { z } from 'zod';

export const taskAgent = new Agent({
  name: 'TaskAgent',
  instructions: `
    You are a helpful task management agent.
    You can create, update, and track tasks for users.
    Always be concise and actionable in your responses.
  `,
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-5-sonnet-20241022',
    toolChoice: 'auto',
  },
  tools: {
    // Tools will be automatically injected from the tool registry
  },
  memory: true, // Enable conversation memory
});

// Agent with custom schema validation
export const dataAnalysisAgent = new Agent({
  name: 'DataAnalysisAgent',
  instructions: `
    You are a data analysis expert.
    Analyze data and provide insights with statistical backing.
  `,
  model: {
    provider: 'OPEN_ROUTER',
    name: 'openai/gpt-4-turbo-preview',
  },
  inputSchema: z.object({
    data: z.array(z.record(z.any())),
    analysisType: z.enum(['descriptive', 'predictive', 'diagnostic']),
  }),
  outputSchema: z.object({
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
    confidence: z.number().min(0).max(1),
  }),
});
```

#### Advanced Agent Patterns

```typescript
// Multi-tool agent with conditional logic
export const automationAgent = new Agent({
  name: 'AutomationAgent',
  instructions: `
    You are an automation specialist.
    Use the appropriate tools based on the task requirements.
    Always confirm actions before executing them.
  `,
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-5-sonnet-20241022',
    temperature: 0.1, // Lower temperature for more consistent automation
  },
  tools: {
    github: 'github-integration',
    slack: 'slack-integration',
    filesystem: 'fs-tool',
    database: 'db-tool',
  },
  memory: {
    type: 'thread',
    maxMessages: 50,
  },
});

// Specialized agent with custom validation
export const codeReviewAgent = new Agent({
  name: 'CodeReviewAgent',
  instructions: `
    You are a senior software engineer conducting code reviews.
    Focus on code quality, security, and best practices.
    Provide constructive feedback with specific suggestions.
  `,
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-5-sonnet-20241022',
  },
  inputSchema: z.object({
    code: z.string(),
    language: z.string(),
    context: z.string().optional(),
  }),
  outputSchema: z.object({
    issues: z.array(z.object({
      type: z.enum(['bug', 'security', 'performance', 'style']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      suggestion: z.string(),
      lineNumber: z.number().optional(),
    })),
    overallScore: z.number().min(0).max(10),
    summary: z.string(),
  }),
});
```

### Tool Integration Strategies

#### Built-in Tool Usage

```typescript
// src/mastra/tools/index.ts
import { createTool } from '@mastra/core';
import { z } from 'zod';

// File system operations
export const fileSystemTool = createTool({
  id: 'filesystem',
  name: 'File System Operations',
  description: 'Read, write, and manage files',
  inputSchema: z.object({
    operation: z.enum(['read', 'write', 'list', 'delete']),
    path: z.string(),
    content: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    result: z.any(),
    error: z.string().optional(),
  }),
  execute: async ({ operation, path, content }) => {
    // Implementation details
  },
});

// API integration tool
export const apiTool = createTool({
  id: 'api-client',
  name: 'API Client',
  description: 'Make HTTP requests to external APIs',
  inputSchema: z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
  }),
  execute: async ({ method, url, headers, body }) => {
    // HTTP client implementation
  },
});
```

#### Custom Tool Development

```typescript
// Custom database tool
export const databaseTool = createTool({
  id: 'database',
  name: 'Database Operations',
  description: 'Execute database queries and operations',
  inputSchema: z.object({
    operation: z.enum(['query', 'insert', 'update', 'delete']),
    table: z.string(),
    data: z.record(z.any()).optional(),
    conditions: z.record(z.any()).optional(),
  }),
  execute: async ({ operation, table, data, conditions }) => {
    // Database operation implementation
    switch (operation) {
      case 'query':
        // SELECT implementation
        break;
      case 'insert':
        // INSERT implementation
        break;
      // ... other operations
    }
  },
});

// Integration with external services
export const notificationTool = createTool({
  id: 'notifications',
  name: 'Notification Service',
  description: 'Send notifications via various channels',
  inputSchema: z.object({
    channel: z.enum(['email', 'slack', 'sms']),
    recipient: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  execute: async ({ channel, recipient, message, priority }) => {
    // Multi-channel notification implementation
  },
});
```

### Workflow Orchestration

> **CRITICAL**: Before implementing workflows, read the [Mastra Workflow Data Flow Patterns](./mastra_workflow_patterns.md) guide. Understanding the "relay race" model is essential to avoid the most common workflow failures.

#### Basic Workflow Patterns

```typescript
// src/mastra/workflows/index.ts
import { createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';

// Simple sequential workflow
export const dataProcessingWorkflow = createWorkflow({
  id: 'data-processing',
  inputSchema: z.object({
    dataSource: z.string(),
    outputFormat: z.enum(['json', 'csv', 'xml']),
  }),
  outputSchema: z.object({
    processedData: z.any(),
    summary: z.string(),
  }),
});

const fetchDataStep = createStep({
  id: 'fetch-data',
  inputSchema: z.object({ dataSource: z.string() }),
  outputSchema: z.object({ rawData: z.any() }),
  execute: async ({ inputData }) => {
    // Data fetching logic
  },
});

const processDataStep = createStep({
  id: 'process-data',
  inputSchema: z.object({ rawData: z.any() }),
  outputSchema: z.object({ processedData: z.any() }),
  execute: async ({ inputData }) => {
    // Data processing logic
  },
});

dataProcessingWorkflow
  .then(fetchDataStep)
  .then(processDataStep)
  .commit();
```

#### Advanced Workflow Patterns

```typescript
// Conditional branching workflow
export const contentModerationWorkflow = createWorkflow({
  id: 'content-moderation',
  inputSchema: z.object({
    content: z.string(),
    contentType: z.enum(['text', 'image', 'video']),
  }),
});

const analyzeContentStep = createStep({
  id: 'analyze-content',
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('moderationAgent');
    return await agent.generate(inputData.content);
  },
});

const approveContentStep = createStep({
  id: 'approve-content',
  execute: async ({ inputData }) => {
    // Auto-approve logic
  },
});

const flagContentStep = createStep({
  id: 'flag-content',
  execute: async ({ inputData }) => {
    // Flagging logic
  },
});

contentModerationWorkflow
  .then(analyzeContentStep)
  .branch([
    [
      async ({ inputData }) => inputData.riskScore < 0.3,
      approveContentStep
    ],
    [
      async ({ inputData }) => inputData.riskScore >= 0.3,
      flagContentStep
    ],
  ])
  .commit();

// Parallel execution workflow
export const multiChannelNotificationWorkflow = createWorkflow({
  id: 'multi-channel-notification',
  inputSchema: z.object({
    message: z.string(),
    channels: z.array(z.enum(['email', 'slack', 'sms'])),
    recipients: z.record(z.string()),
  }),
});

const emailStep = createStep({
  id: 'send-email',
  execute: async ({ inputData }) => {
    // Email sending logic
  },
});

const slackStep = createStep({
  id: 'send-slack',
  execute: async ({ inputData }) => {
    // Slack notification logic
  },
});

const smsStep = createStep({
  id: 'send-sms',
  execute: async ({ inputData }) => {
    // SMS sending logic
  },
});

multiChannelNotificationWorkflow
  .parallel([emailStep, slackStep, smsStep])
  .commit();
```

### Memory and Context Management

#### Memory Configuration

```typescript
// Thread-based memory for conversations
export const conversationalAgent = new Agent({
  name: 'ConversationalAgent',
  memory: {
    type: 'thread',
    maxMessages: 100,
    summarizeAfter: 50,
  },
  // ... other config
});

// Semantic memory for knowledge retrieval
export const knowledgeAgent = new Agent({
  name: 'KnowledgeAgent',
  memory: {
    type: 'semantic',
    vectorStore: 'pinecone',
    embeddingModel: 'text-embedding-ada-002',
    maxResults: 10,
  },
  // ... other config
});
```

#### Custom Memory Implementations

```typescript
// Custom memory provider
import { MemoryProvider } from '@mastra/core';

export class CustomMemoryProvider implements MemoryProvider {
  async store(threadId: string, message: any): Promise<void> {
    // Custom storage implementation
  }

  async retrieve(threadId: string, limit?: number): Promise<any[]> {
    // Custom retrieval implementation
  }

  async search(query: string, limit?: number): Promise<any[]> {
    // Semantic search implementation
  }
}
```

### Error Handling and Resilience

#### Retry Strategies

```typescript
// Agent with retry configuration
export const resilientAgent = new Agent({
  name: 'ResilientAgent',
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-5-sonnet-20241022',
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential',
    },
  },
  // ... other config
});

// Workflow with error handling
const robustStep = createStep({
  id: 'robust-operation',
  execute: async ({ inputData }) => {
    try {
      // Main operation
      return await performOperation(inputData);
    } catch (error) {
      // Fallback operation
      return await performFallback(inputData, error);
    }
  },
});
```

#### Circuit Breaker Pattern

```typescript
// Tool with circuit breaker
export const externalApiTool = createTool({
  id: 'external-api',
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000,
    monitoringPeriod: 60000,
  },
  execute: async ({ inputData }) => {
    // External API call with circuit breaker protection
  },
});
```

### Testing Strategies

#### Unit Testing Agents

```typescript
// tests/agents/task-agent.test.ts
import { describe, it, expect } from 'vitest';
import { taskAgent } from '../src/mastra/agents';

describe('TaskAgent', () => {
  it('should create a task', async () => {
    const result = await taskAgent.generate('Create a task to review the quarterly report');
    
    expect(result).toMatchObject({
      task: expect.objectContaining({
        title: expect.any(String),
        description: expect.any(String),
        priority: expect.any(String),
      }),
    });
  });

  it('should handle invalid input gracefully', async () => {
    const result = await taskAgent.generate('');
    
    expect(result).toHaveProperty('error');
  });
});
```

#### Integration Testing Workflows

```typescript
// tests/workflows/data-processing.test.ts
import { describe, it, expect } from 'vitest';
import { dataProcessingWorkflow } from '../src/mastra/workflows';

describe('DataProcessingWorkflow', () => {
  it('should process data end-to-end', async () => {
    const run = dataProcessingWorkflow.createRun();
    const result = await run.start({
      dataSource: 'test-data.json',
      outputFormat: 'json',
    });

    expect(result).toMatchObject({
      processedData: expect.any(Object),
      summary: expect.any(String),
    });
  });
});
```

### Performance Optimization

#### Caching Strategies

```typescript
// Agent with response caching
export const cachedAgent = new Agent({
  name: 'CachedAgent',
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    keyGenerator: (input) => `agent-${JSON.stringify(input)}`,
  },
  // ... other config
});

// Tool with result caching
export const cachedTool = createTool({
  id: 'cached-operation',
  cache: {
    enabled: true,
    ttl: 1800, // 30 minutes
  },
  execute: async ({ inputData }) => {
    // Expensive operation that benefits from caching
  },
});
```

#### Streaming Responses

```typescript
// Agent with streaming support
export const streamingAgent = new Agent({
  name: 'StreamingAgent',
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-5-sonnet-20241022',
    stream: true,
  },
});

// Usage with streaming
const stream = await streamingAgent.generateStream('Tell me a long story');
for await (const chunk of stream) {
  console.log(chunk.content);
}
```

### Best Practices Checklist

#### Development Setup
- [ ] Use TypeScript strict mode for all Mastra components
- [ ] Define clear input/output schemas for all agents and tools
- [ ] Implement proper error handling and fallback strategies
- [ ] Set up comprehensive logging and monitoring
- [ ] Use environment variables for all configuration

#### Agent Design
- [ ] Write clear, specific instructions for each agent
- [ ] Choose appropriate models for different use cases
- [ ] Implement proper memory management strategies
- [ ] Test agents with various input scenarios
- [ ] Monitor token usage and costs

#### Tool Integration
- [ ] Validate all tool inputs and outputs
- [ ] Implement proper authentication and authorization
- [ ] Add rate limiting for external API calls
- [ ] Use circuit breakers for unreliable services
- [ ] Cache expensive operations when appropriate

#### Workflow Orchestration
- [ ] Design workflows with clear step boundaries
- [ ] Implement proper error recovery mechanisms
- [ ] Use parallel execution where beneficial
- [ ] Add monitoring and observability
- [ ] Test workflow edge cases and failure scenarios

### Common Issues and Solutions

#### Issue: Agent Responses Are Inconsistent

**Solution:**
```typescript
// Use lower temperature and more specific instructions
export const consistentAgent = new Agent({
  name: 'ConsistentAgent',
  instructions: `
    You are a precise data processor.
    Always respond in the exact format specified.
    Never deviate from the required structure.
  `,
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-5-sonnet-20241022',
    temperature: 0.1, // Lower temperature for consistency
  },
  outputSchema: z.object({
    // Strict schema validation
    result: z.string(),
    confidence: z.number(),
  }),
});
```

#### Issue: High Token Usage Costs

**Solution:**
```typescript
// Implement token usage optimization
export const efficientAgent = new Agent({
  name: 'EfficientAgent',
  model: {
    provider: 'OPEN_ROUTER',
    name: 'anthropic/claude-3-haiku-20240307', // Use smaller model when appropriate
    maxTokens: 500, // Limit response length
  },
  memory: {
    type: 'thread',
    maxMessages: 10, // Limit context window
    summarizeAfter: 5, // Summarize frequently
  },
});
```

#### Issue: Tool Execution Failures

**Solution:**
```typescript
// Implement robust error handling
export const robustTool = createTool({
  id: 'robust-tool',
  execute: async ({ inputData }) => {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await performOperation(inputData);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
  },
});
```

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** 
  - [cross_cutting/mastra_workflow_patterns.md] - specialized-guidance - Critical workflow data flow patterns
- **Related Nodes:** 
  - [foundation/system_overview.md] - implements - System architecture with Mastra
  - [foundation/reference_resources.md] - references - Official Mastra documentation
  - [cross_cutting/openrouter_configuration_guide.md] - complements - Model provider integration
  - [cross_cutting/typescript_configuration_guide.md] - uses - TypeScript setup for Mastra projects

## Navigation Guidance
- **Access Context:** Use this document when setting up Mastra framework integration or developing agents
- **Common Next Steps:** After reviewing this guide, typically explore OpenRouter configuration or specific agent patterns
- **Related Tasks:** Agent development, tool integration, workflow creation, Mastra setup
- **Update Patterns:** This document should be updated when Mastra framework releases new versions or introduces breaking changes

## Metadata
- **Created:** 2025-06-30
- **Last Updated:** 2025-06-30
- **Updated By:** Cline
- **Sources:** Mastra Documentation, Framework Examples, Best Practices

## Change History
- 2025-06-30: Initial creation of Mastra integration guide for TypeScript LLM agents
