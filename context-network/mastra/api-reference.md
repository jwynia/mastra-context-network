# Mastra API Reference Quick Guide

## Overview

Quick reference for commonly used Mastra APIs, including class methods, configuration options, component lifecycle, and event system.

## Core Classes

### Mastra Class

**Purpose**: Central orchestration hub for dependency injection and component management

#### Constructor

```typescript
new Mastra(config: MastraConfig)
```

**Configuration Options**:

```typescript
interface MastraConfig {
  // Component registries
  agents?: Record<string, Agent>;
  workflows?: Record<string, Workflow>;
  tools?: Record<string, Tool>;

  // Storage and data
  storage?: StorageProvider;
  vectors?: VectorProvider[];
  memory?: MemoryProvider;

  // Logging and telemetry
  logger?: Logger | PinoLogger | false;
  telemetry?: TelemetryConfig;

  // Server configuration
  server?: ServerConfig;

  // MCP servers
  mcpServers?: Record<string, MCPServer>;

  // Scoring and evaluation
  scorers?: Record<string, Scorer>;

  // Deployment
  deployer?: Deployer;
  bundler?: BundlerConfig;

  // Event handlers
  events?: Record<string, EventHandler>;
}
```

#### Methods

**Component Retrieval**:

```typescript
// Get registered agent
mastra.getAgent(name: string): Agent

// Get all agents
mastra.getAgents(): Record<string, Agent>

// Get registered workflow
mastra.getWorkflow(name: string): Workflow

// Get all workflows
mastra.getWorkflows(): Record<string, Workflow>

// Get storage instance
mastra.getStorage(): StorageProvider

// Get vector providers
mastra.getVectors(): VectorProvider[]
```

**Example**:
```typescript
const mastra = new Mastra({
  agents: { assistant: myAgent },
  storage: new LibSQLStore({ url: '...' }),
});

const agent = mastra.getAgent('assistant');
const storage = mastra.getStorage();
```

### Agent Class

**Purpose**: AI interaction abstraction with tools, memory, and delegation capabilities

#### Constructor

```typescript
new Agent(config: AgentConfig)
```

**Configuration**:

```typescript
interface AgentConfig {
  // Identity
  name: string;
  description?: string;

  // AI model
  model: LanguageModelV1;

  // System prompt
  instructions: string;

  // Capabilities
  tools?: Record<string, Tool>;
  workflows?: Record<string, Workflow>;
  agents?: Record<string, Agent>;  // Sub-agents

  // Memory
  memory?: Memory;

  // Evaluation
  scorers?: Scorer[];

  // Voice capabilities
  voice?: VoiceConfig;
}
```

#### Methods

**Text Generation**:

```typescript
// Generate response
agent.generate(
  messages: Message[],
  options?: GenerateOptions
): Promise<GenerateResult>

// Stream response
agent.stream(
  messages: Message[],
  options?: StreamOptions
): AsyncIterable<StreamChunk>
```

**Message Types**:
```typescript
type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}
```

**Generate Options**:
```typescript
interface GenerateOptions {
  threadId?: string;           // For memory persistence
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  seed?: number;
}
```

**Generate Result**:
```typescript
interface GenerateResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'tool_calls';
  toolCalls?: ToolCall[];
}
```

**Example**:
```typescript
const agent = new Agent({
  name: 'Assistant',
  model: openai('gpt-4o-mini'),
  instructions: 'You are a helpful assistant',
  tools: { myTool },
  memory: new Memory(),
});

const result = await agent.generate([
  { role: 'user', content: 'Hello' },
], {
  threadId: 'user-session-123',
  temperature: 0.7,
});

console.log(result.text);
```

### Tool Creation

**Purpose**: Create stateless, pure functions for agent capabilities

#### createTool Function

```typescript
createTool<InputSchema, OutputType>(config: ToolConfig): Tool
```

**Configuration**:

```typescript
interface ToolConfig {
  id: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema?: ZodSchema;
  execute: (params: ExecuteParams) => Promise<OutputType>;
}

interface ExecuteParams {
  context: InputType;           // Validated input
  mastra?: MastraInstance;      // Access to Mastra
}
```

**Example**:
```typescript
const greetTool = createTool({
  id: 'greet-user',
  description: 'Greet a user by name',
  inputSchema: z.object({
    name: z.string(),
    formal: z.boolean().default(false),
  }),
  execute: async ({ context }) => {
    const greeting = context.formal ? 'Good day' : 'Hello';
    return {
      message: `${greeting}, ${context.name}!`,
    };
  },
});
```

### Workflow Creation

**Purpose**: Multi-step processes with suspend/resume capabilities

#### createWorkflow Function

```typescript
createWorkflow(config: WorkflowConfig): Workflow
```

**Configuration**:

```typescript
interface WorkflowConfig {
  id: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
}
```

#### createStep Function

```typescript
createStep(config: StepConfig): Step
```

**Configuration**:

```typescript
interface StepConfig {
  id: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  execute: (params: StepExecuteParams) => Promise<OutputType>;
}

interface StepExecuteParams {
  inputData: InputType;
  suspend?: () => Promise<void>;  // For long operations
  checkpoint?: any;               // Restored checkpoint data
}
```

#### Workflow Methods

```typescript
// Chain steps
workflow.then(step: Step): Workflow

// Finalize workflow
workflow.commit(): void

// Execute workflow
workflow.execute(input: InputType): Promise<OutputType>

// Start with suspend capability
workflow.start(input: InputType): Promise<WorkflowExecution>
```

**Example**:
```typescript
const workflow = createWorkflow({
  id: 'data-pipeline',
  description: 'Process data through multiple stages',
  inputSchema: z.object({
    data: z.array(z.any()),
  }),
  outputSchema: z.object({
    result: z.any(),
  }),
});

const step1 = createStep({
  id: 'validate',
  description: 'Validate data',
  inputSchema: z.object({ data: z.array(z.any()) }),
  outputSchema: z.object({ validData: z.array(z.any()) }),
  execute: async ({ inputData }) => {
    return { validData: inputData.data.filter(isValid) };
  },
});

const step2 = createStep({
  id: 'transform',
  description: 'Transform data',
  inputSchema: z.object({ validData: z.array(z.any()) }),
  outputSchema: z.object({ result: z.any() }),
  execute: async ({ inputData }) => {
    return { result: transform(inputData.validData) };
  },
});

workflow.then(step1).then(step2).commit();

// Execute
const result = await workflow.execute({ data: [...] });
```

### Memory Class

**Purpose**: Thread-based conversation persistence

#### Constructor

```typescript
new Memory(config?: MemoryConfig)
```

**Configuration**:

```typescript
interface MemoryConfig {
  storage?: StorageProvider;
  maxMessages?: number;
  maxTokens?: number;
  summarization?: boolean;
}
```

#### Methods

```typescript
// Save message to thread
memory.saveMemory(
  threadId: string,
  message: Message
): Promise<void>

// Get messages from thread
memory.getMemories(
  threadId: string,
  options?: GetMemoriesOptions
): Promise<Message[]>

// Clear thread
memory.clearMemories(threadId: string): Promise<void>

// Search memories semantically
memory.searchMemories(
  query: string,
  limit?: number
): Promise<Message[]>
```

**Example**:
```typescript
const memory = new Memory({
  maxMessages: 50,
  maxTokens: 8000,
});

await memory.saveMemory('thread-1', {
  role: 'user',
  content: 'Hello',
});

const messages = await memory.getMemories('thread-1');
```

## Storage Providers

### LibSQL (SQLite-based)

```typescript
import { LibSQLStore } from '@mastra/libsql';

const storage = new LibSQLStore({
  url: 'file:./mastra.db',  // Local file
  // or
  url: 'libsql://[project].turso.io',
  authToken: '...',  // For Turso
});
```

### PostgreSQL

```typescript
import { PostgresStore } from '@mastra/pg';

const storage = new PostgresStore({
  url: process.env.DATABASE_URL,
  ssl: true,
  poolSize: 20,
});
```

### Storage Methods

```typescript
// Get value
storage.get<T>(key: string): Promise<T | null>

// Set value
storage.set<T>(
  key: string,
  value: T,
  options?: SetOptions
): Promise<void>

// Delete value
storage.delete(key: string): Promise<void>

// List keys
storage.list(prefix?: string): Promise<string[]>

// Batch operations
storage.mget<T>(keys: string[]): Promise<(T | null)[]>
storage.mset<T>(entries: [string, T][]): Promise<void>
storage.mdelete(keys: string[]): Promise<void>
```

## Event System

### Event Types

```typescript
type EventType =
  // Agent events
  | 'agent:created'
  | 'agent:destroyed'
  | 'agent:generate:start'
  | 'agent:generate:complete'
  | 'agent:generate:error'

  // Workflow events
  | 'workflow:start'
  | 'workflow:complete'
  | 'workflow:error'
  | 'workflow:step:start'
  | 'workflow:step:complete'
  | 'workflow:step:suspended'

  // Tool events
  | 'tool:execute:start'
  | 'tool:execute:complete'
  | 'tool:execute:error'

  // Memory events
  | 'memory:save'
  | 'memory:retrieve'

  // Storage events
  | 'storage:get'
  | 'storage:set'
  | 'storage:delete';
```

### Subscribing to Events

```typescript
const mastra = new Mastra({
  events: {
    // Subscribe to specific event
    'agent:generate:complete': async (event) => {
      console.log('Agent completed:', event.data);
    },

    // Wildcard subscription
    'agent:*': async (event) => {
      console.log('Agent event:', event.type);
    },

    // Multiple handlers
    'workflow:complete': [
      async (event) => { /* handler 1 */ },
      async (event) => { /* handler 2 */ },
    ],
  },
});
```

## Server Configuration

### Hono Integration

```typescript
interface ServerConfig {
  port?: number;
  cors?: CorsConfig;
  middleware?: MiddlewareConfig[];
}

interface CorsConfig {
  origin: string | string[] | boolean;
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
}

interface MiddlewareConfig {
  handler: (c: Context, next: () => Promise<void>) => Promise<Response | void>;
  path: string;
}
```

**Example**:
```typescript
const mastra = new Mastra({
  server: {
    port: 3000,
    cors: {
      origin: ['https://example.com'],
      credentials: true,
    },
    middleware: [
      {
        handler: authMiddleware,
        path: '/api/protected/*',
      },
    ],
  },
});
```

## Common Patterns Quick Reference

### Pattern: Basic Agent

```typescript
const agent = new Agent({
  name: 'Agent Name',
  model: openai('gpt-4o-mini'),
  instructions: 'Clear instructions',
  tools: { toolName: tool },
});

const result = await agent.generate([
  { role: 'user', content: 'message' }
]);
```

### Pattern: Agent with Memory

```typescript
const agent = new Agent({
  name: 'Agent',
  model: openai('gpt-4o-mini'),
  instructions: '...',
  memory: new Memory(),
});

const result = await agent.generate(messages, {
  threadId: 'user-123',
});
```

### Pattern: Agent Network

```typescript
const coordinator = new Agent({
  name: 'Coordinator',
  model: openai('gpt-4o'),
  instructions: 'Delegate to specialists',
  agents: {
    specialist1: agent1,
    specialist2: agent2,
  },
});
```

### Pattern: Simple Workflow

```typescript
const workflow = createWorkflow({ id: 'wf', ... });
const step = createStep({ id: 'step1', ... });

workflow.then(step).commit();
const result = await workflow.execute(input);
```

### Pattern: Tool with Mastra Access

```typescript
const tool = createTool({
  id: 'my-tool',
  inputSchema: z.object({ key: z.string() }),
  execute: async ({ context, mastra }) => {
    const storage = mastra.getStorage();
    const data = await storage.get(context.key);
    return { data };
  },
});
```

## Model Providers

### OpenAI

```typescript
import { openai } from '@ai-sdk/openai';

const model = openai('gpt-4o-mini');
const model = openai('gpt-4o');
const model = openai('gpt-4-turbo');
```

### Anthropic

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const model = anthropic('claude-3-5-sonnet-20241022');
const model = anthropic('claude-3-opus-20240229');
```

### Google

```typescript
import { google } from '@ai-sdk/google';

const model = google('gemini-1.5-pro');
const model = google('gemini-1.5-flash');
```

### Groq

```typescript
import { groq } from '@ai-sdk/groq';

const model = groq('llama-3.1-70b-versatile');
```

## Zod Schema Patterns

### Common Schemas

```typescript
// String with constraints
z.string().min(1).max(100).describe('Description for AI')

// Number with range
z.number().min(0).max(100)

// Enum
z.enum(['option1', 'option2'])

// Optional field
z.string().optional()

// Default value
z.boolean().default(false)

// Array
z.array(z.string())

// Object
z.object({
  field1: z.string(),
  field2: z.number(),
})

// Transform
z.string().transform(val => val.toUpperCase())

// Coerce
z.coerce.number()  // Converts strings to numbers
```

## Error Handling Patterns

### Tool Error Handling

```typescript
execute: async ({ context }) => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      retryable: isRetryable(error),
    };
  }
}
```

### Workflow Error Handling

```typescript
execute: async ({ inputData }) => {
  if (!isValid(inputData)) {
    throw new Error('Invalid input');
  }
  return { result: process(inputData) };
}
```

## See Also

- [[patterns.md]] - Architectural patterns and best practices
- [[recipes.md]] - Complete code examples
- [[architecture.md]] - Deep dive into system architecture
- [[troubleshooting.md]] - Debugging and common issues
