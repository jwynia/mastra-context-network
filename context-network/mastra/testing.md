# Mastra Testing Guide

## Overview

This guide covers comprehensive testing strategies for Mastra applications, including unit tests, integration tests, end-to-end tests, and testing best practices for each component type.

## Testing Philosophy

### Testing Pyramid for Mastra Applications

```
      /\
     /E2E\         Few - Full application flows
    /------\
   /        \
  /Integration\   Moderate - Component interactions
 /------------\
/              \
/  Unit Tests  \  Many - Individual components
/________________\
```

**Mastra Testing Strategy**:
- **70% Unit Tests** - Tools, workflows steps, utility functions
- **20% Integration Tests** - Agent interactions, workflow execution, storage operations
- **10% E2E Tests** - Complete user flows through APIs

## Testing Environment Setup

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'test/**',
        '**/*.test.ts',
      ],
    },
    testTimeout: 30000, // 30s for integration tests
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
});
```

### Test Setup File

```typescript
// test/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');

  // Start Docker services if needed
  if (process.env.INTEGRATION_TESTS === 'true') {
    // Ensure Docker services are running
    console.log('Waiting for Docker services...');
  }
});

// Cleanup after each test
afterEach(async () => {
  // Clear any test data
  await cleanupTestData();
});

// Global teardown
afterAll(async () => {
  console.log('✅ Test suite complete');
});

async function cleanupTestData() {
  // Implement cleanup logic
}
```

### Test Environment Variables

```bash
# .env.test
NODE_ENV=test

# Use test-specific databases
DATABASE_URL=:memory:  # In-memory for speed
# or DATABASE_URL=file:./test.db

# Use test API keys or mocks
OPENAI_API_KEY=sk-test-key  # Test key or mock

# Disable external services
TELEMETRY_ENABLED=false
AUTH_ENABLED=false

# Integration test flags
INTEGRATION_TESTS=false  # Set to true for integration tests
```

## Tool Testing Patterns

### Basic Tool Unit Test

```typescript
// src/tools/weather-tool.test.ts
import { describe, it, expect, vi } from 'vitest';
import { weatherApiTool } from './weather-tool';

describe('weatherApiTool', () => {
  it('should fetch weather data successfully', async () => {
    // Arrange
    const mockResponse = {
      temperature: 72,
      conditions: 'Sunny',
      humidity: 45,
      windSpeed: 10,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await weatherApiTool.execute({
      context: {
        location: 'San Francisco',
        units: 'imperial',
      },
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.temperature).toBe(72);
    expect(result.conditions).toBe('Sunny');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Act
    const result = await weatherApiTool.execute({
      context: {
        location: 'Invalid',
        units: 'metric',
      },
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('should validate input schema', () => {
    // Arrange
    const invalidInput = {
      location: 'SF',
      units: 'invalid' as any, // Not 'metric' or 'imperial'
    };

    // Act & Assert
    expect(() => {
      weatherApiTool.inputSchema.parse(invalidInput);
    }).toThrow();
  });
});
```

### Testing Tools with External Dependencies

```typescript
// src/tools/github-tool.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Octokit } from '@octokit/rest';
import { githubCreateIssueTool } from './github-tool';

// Mock Octokit
vi.mock('@octokit/rest');

describe('githubCreateIssueTool', () => {
  let mockOctokit: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup Octokit mock
    mockOctokit = {
      issues: {
        create: vi.fn(),
      },
    };

    (Octokit as any).mockImplementation(() => mockOctokit);
  });

  it('should create GitHub issue successfully', async () => {
    // Arrange
    mockOctokit.issues.create.mockResolvedValue({
      data: {
        number: 123,
        html_url: 'https://github.com/owner/repo/issues/123',
        state: 'open',
        created_at: '2024-01-01T00:00:00Z',
      },
    });

    // Act
    const result = await githubCreateIssueTool.execute({
      context: {
        owner: 'owner',
        repo: 'repo',
        title: 'Test Issue',
        body: 'Issue description',
        labels: ['bug'],
      },
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.issue.number).toBe(123);
    expect(mockOctokit.issues.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'Test Issue',
      body: 'Issue description',
      labels: ['bug'],
      assignees: undefined,
    });
  });

  it('should handle GitHub API errors', async () => {
    // Arrange
    mockOctokit.issues.create.mockRejectedValue({
      message: 'Not Found',
      status: 404,
    });

    // Act
    const result = await githubCreateIssueTool.execute({
      context: {
        owner: 'invalid',
        repo: 'invalid',
        title: 'Test',
      },
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not Found');
  });
});
```

### Test Fixtures for Tools

```typescript
// test/fixtures/tool-fixtures.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Mock tool that always succeeds
export const successMockTool = createTool({
  id: 'mock-success',
  description: 'Mock tool that always succeeds',
  inputSchema: z.object({
    input: z.any().optional(),
  }),
  execute: async ({ context }) => ({
    success: true,
    data: context.input,
  }),
});

// Mock tool that always fails
export const failureMockTool = createTool({
  id: 'mock-failure',
  description: 'Mock tool that always fails',
  inputSchema: z.object({
    input: z.any().optional(),
  }),
  execute: async ({ context }) => ({
    success: false,
    error: 'Mock failure',
  }),
});

// Configurable mock tool
export function createMockTool(
  id: string,
  mockResponse: any | ((context: any) => any)
) {
  return createTool({
    id,
    description: `Mock tool: ${id}`,
    inputSchema: z.object({
      input: z.any().optional(),
    }),
    execute: async ({ context }) => {
      return typeof mockResponse === 'function'
        ? mockResponse(context)
        : mockResponse;
    },
  });
}
```

## Workflow Testing Patterns

### Unit Testing Workflow Steps

```typescript
// src/workflows/data-processing-workflow.test.ts
import { describe, it, expect } from 'vitest';
import { validateStep, transformStep } from './data-processing-workflow';

describe('Data Processing Workflow Steps', () => {
  describe('validateStep', () => {
    it('should validate correct data', async () => {
      const result = await validateStep.execute({
        inputData: {
          rawData: [
            { id: 1, value: 'test' },
            { id: 2, value: 'test2' },
          ],
        },
      });

      expect(result.validData).toHaveLength(2);
      expect(result.errors).toBeUndefined();
    });

    it('should detect invalid data', async () => {
      const result = await validateStep.execute({
        inputData: {
          rawData: [
            { id: 1, value: 'test' },
            { id: null, value: 'invalid' }, // Invalid
          ],
        },
      });

      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('transformStep', () => {
    it('should transform validated data', async () => {
      const result = await transformStep.execute({
        inputData: {
          validData: [
            { id: 1, value: 'test' },
          ],
        },
      });

      expect(result.transformedData).toBeDefined();
      expect(result.transformedData[0]).toHaveProperty('processed', true);
    });
  });
});
```

### Integration Testing Workflow Execution

```typescript
// src/workflows/data-processing-workflow.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { dataProcessingWorkflow } from './data-processing-workflow';

describe('Data Processing Workflow Integration', () => {
  beforeAll(() => {
    // Ensure workflow is committed
    dataProcessingWorkflow.commit();
  });

  it('should execute complete workflow successfully', async () => {
    const result = await dataProcessingWorkflow.execute({
      rawData: [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
      ],
      options: {
        validate: true,
        transform: true,
      },
    });

    expect(result.metadata.stepsExecuted).toContain('validate');
    expect(result.metadata.stepsExecuted).toContain('transform');
    expect(result.result).toBeDefined();
  });

  it('should handle validation errors in workflow', async () => {
    await expect(
      dataProcessingWorkflow.execute({
        rawData: null, // Invalid input
        options: { validate: true },
      })
    ).rejects.toThrow();
  });

  it('should support workflow suspension and resume', async () => {
    // Start workflow
    const execution = await dataProcessingWorkflow.start({
      rawData: [{ id: 1, value: 'test' }],
    });

    // Suspend at specific step
    await execution.suspend();

    expect(execution.status).toBe('suspended');

    // Resume
    const result = await execution.resume();

    expect(result.metadata.resumed).toBe(true);
  });
});
```

## Agent Testing Patterns

### Mocking Language Models

```typescript
// test/mocks/model-mock.ts
import { LanguageModelV1 } from '@ai-sdk/provider';

export function createMockModel(responses: string[]): LanguageModelV1 {
  let callCount = 0;

  return {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: 'mock-model',

    doGenerate: async (options) => {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;

      return {
        text: response,
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        finishReason: 'stop',
        rawCall: {},
        warnings: [],
      };
    },

    doStream: async (options) => {
      throw new Error('Streaming not implemented in mock');
    },
  } as any;
}
```

### Testing Agent Behavior

```typescript
// src/agents/assistant-agent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Agent } from '@mastra/core/agent';
import { createMockModel } from '@test/mocks/model-mock';
import { successMockTool } from '@test/fixtures/tool-fixtures';

describe('Assistant Agent', () => {
  it('should generate appropriate responses', async () => {
    const mockModel = createMockModel([
      'Hello! How can I help you today?',
    ]);

    const agent = new Agent({
      name: 'Test Assistant',
      instructions: 'You are a helpful assistant',
      model: mockModel,
      tools: {},
    });

    const result = await agent.generate([
      { role: 'user', content: 'Hi' },
    ]);

    expect(result.text).toContain('Hello');
  });

  it('should use tools when appropriate', async () => {
    const toolSpy = vi.fn().mockResolvedValue({
      success: true,
      data: 'Tool result',
    });

    const mockTool = createMockTool('test-tool', toolSpy);

    const mockModel = createMockModel([
      'Let me use the tool for you.',
    ]);

    const agent = new Agent({
      name: 'Tool User',
      instructions: 'Use tools to help users',
      model: mockModel,
      tools: { testTool: mockTool },
    });

    const result = await agent.generate([
      { role: 'user', content: 'Use the tool' },
    ]);

    // Note: Actual tool usage depends on model behavior
    // This is a simplified test
    expect(result).toBeDefined();
  });
});
```

### Testing Agent-to-Agent Communication

```typescript
// src/agents/coordinator.integration.test.ts
import { describe, it, expect } from 'vitest';
import { coordinatorAgent } from './coordinator';
import { dataAnalystAgent } from './data-analyst';
import { createMockModel } from '@test/mocks/model-mock';

describe('Agent Network Integration', () => {
  it('should delegate to specialist agent', async () => {
    // Setup mock models
    const coordinatorModel = createMockModel([
      'I\'ll delegate this to the data analyst.',
    ]);

    const analystModel = createMockModel([
      'Based on the data, here are my findings...',
    ]);

    const coordinator = new Agent({
      name: 'Coordinator',
      instructions: 'Delegate to specialists',
      model: coordinatorModel,
      agents: {
        analyst: new Agent({
          name: 'Analyst',
          instructions: 'Analyze data',
          model: analystModel,
          tools: {},
        }),
      },
      tools: {},
    });

    const result = await coordinator.generate([
      { role: 'user', content: 'Analyze this data' },
    ]);

    expect(result.text).toBeDefined();
  });
});
```

## Storage and Memory Testing

### In-Memory Storage for Tests

```typescript
// test/mocks/storage-mock.ts
import { MemoryStore } from '@mastra/core/storage';

export function createTestStorage() {
  // Use in-memory storage for fast tests
  return new MemoryStore();
}

// Test with storage
describe('Storage Operations', () => {
  let storage: MemoryStore;

  beforeEach(() => {
    storage = createTestStorage();
  });

  it('should store and retrieve data', async () => {
    await storage.set('test-key', { value: 'test' });
    const result = await storage.get('test-key');

    expect(result).toEqual({ value: 'test' });
  });
});
```

### Testing Memory with Thread IDs

```typescript
// src/memory/memory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Memory } from '@mastra/memory';
import { createTestStorage } from '@test/mocks/storage-mock';

describe('Memory System', () => {
  let memory: Memory;

  beforeEach(() => {
    const storage = createTestStorage();
    memory = new Memory({ storage });
  });

  it('should save and retrieve messages by thread', async () => {
    const threadId = 'test-thread-1';

    await memory.saveMemory(threadId, {
      role: 'user',
      content: 'Hello',
    });

    await memory.saveMemory(threadId, {
      role: 'assistant',
      content: 'Hi there!',
    });

    const messages = await memory.getMemories(threadId);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });

  it('should isolate memories by thread ID', async () => {
    await memory.saveMemory('thread-1', {
      role: 'user',
      content: 'Thread 1 message',
    });

    await memory.saveMemory('thread-2', {
      role: 'user',
      content: 'Thread 2 message',
    });

    const thread1Messages = await memory.getMemories('thread-1');
    const thread2Messages = await memory.getMemories('thread-2');

    expect(thread1Messages).toHaveLength(1);
    expect(thread2Messages).toHaveLength(1);
    expect(thread1Messages[0].content).not.toBe(thread2Messages[0].content);
  });
});
```

## Integration Testing with Docker Services

### PostgreSQL Integration Tests

```typescript
// test/integration/postgres.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgresStore } from '@mastra/pg';

describe('PostgreSQL Integration', () => {
  let storage: PostgresStore;

  beforeAll(async () => {
    // Requires Docker services running
    if (process.env.INTEGRATION_TESTS !== 'true') {
      return;
    }

    storage = new PostgresStore({
      url: process.env.DATABASE_URL || 'postgresql://mastra:mastra@localhost:5432/mastra_test',
    });

    // Wait for connection
    await storage.connect();
  });

  afterAll(async () => {
    if (storage) {
      await storage.disconnect();
    }
  });

  it('should perform CRUD operations', async () => {
    if (process.env.INTEGRATION_TESTS !== 'true') {
      return;
    }

    const testData = { id: 1, value: 'test' };

    // Create
    await storage.set('test-key', testData);

    // Read
    const retrieved = await storage.get('test-key');
    expect(retrieved).toEqual(testData);

    // Delete
    await storage.delete('test-key');
    const deleted = await storage.get('test-key');
    expect(deleted).toBeNull();
  });
});
```

## API/Endpoint Testing

### Testing Hono Routes

```typescript
// src/api/agents.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import { agentRoutes } from './agents';

describe('Agent API Endpoints', () => {
  let app: Hono;
  let client: any;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/agents', agentRoutes);
    client = testClient(app);
  });

  it('should chat with agent successfully', async () => {
    const response = await client.api.agents['assistant'].chat.$post({
      json: {
        message: 'Hello',
        threadId: 'test-thread',
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.response).toBeDefined();
    expect(data.threadId).toBe('test-thread');
  });

  it('should validate request body', async () => {
    const response = await client.api.agents['assistant'].chat.$post({
      json: {
        // Missing required 'message' field
        threadId: 'test-thread',
      },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
```

## Test Utilities and Helpers

### Test Data Builders

```typescript
// test/builders/agent-builder.ts
import { Agent } from '@mastra/core/agent';
import { createMockModel } from '@test/mocks/model-mock';

export class AgentBuilder {
  private name = 'Test Agent';
  private instructions = 'Test instructions';
  private model = createMockModel(['Test response']);
  private tools: Record<string, any> = {};
  private agents: Record<string, any> = {};

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withInstructions(instructions: string): this {
    this.instructions = instructions;
    return this;
  }

  withTool(name: string, tool: any): this {
    this.tools[name] = tool;
    return this;
  }

  withSubAgent(name: string, agent: Agent): this {
    this.agents[name] = agent;
    return this;
  }

  build(): Agent {
    return new Agent({
      name: this.name,
      instructions: this.instructions,
      model: this.model,
      tools: this.tools,
      agents: this.agents,
    });
  }
}

// Usage
const testAgent = new AgentBuilder()
  .withName('Custom Agent')
  .withTool('testTool', mockTool)
  .build();
```

### Async Test Helpers

```typescript
// test/helpers/async-helpers.ts
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

// Usage in tests
it('should complete async operation', async () => {
  startAsyncOperation();

  await waitFor(
    () => isOperationComplete(),
    5000
  );

  expect(getOperationResult()).toBe('success');
});
```

## Performance Testing

### Benchmark Tests

```typescript
// test/performance/workflow-benchmark.test.ts
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Workflow Performance', () => {
  it('should complete workflow within acceptable time', async () => {
    const start = performance.now();

    await dataProcessingWorkflow.execute({
      rawData: generateLargeDataset(1000),
    });

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

## See Also

- [[patterns.md]] - Testing patterns and best practices
- [[troubleshooting.md]] - Debugging failing tests
- [[environment-setup.md]] - Test environment configuration
