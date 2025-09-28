# CLAUDE.md - Mastra Application Development Guide

## Core Philosophy: Build with Understanding

**Building AI applications requires deep understanding of the framework.** This Mastra application values:
- Architecture comprehension over quick fixes
- Pattern recognition over ad-hoc solutions
- Component relationships over isolated implementations
- Data flow understanding over trial-and-error

## Mastra Framework Architecture

### Central Orchestration Pattern

Mastra follows a **central orchestration pattern** where the `Mastra` class acts as the dependency injection hub:

```typescript
// All components register with the central Mastra instance
export const mastra = new Mastra({
  agents: { /* agent registry */ },
  workflows: { /* workflow registry */ },
  tools: { /* available via agents/workflows */ },
  storage: /* pluggable storage backend */,
  vectors: /* semantic search capabilities */,
  memory: /* conversation persistence */,
  // ... other components
});
```

**Key Insight**: Components don't import each other directly - they access dependencies through the Mastra instance at runtime.

### Component Hierarchy and Data Flow

```
Mastra Instance (Central Hub)
├── Agents (AI interaction layer)
│   ├── Tools (atomic functionality)
│   ├── Workflows (multi-step processes)
│   ├── Memory (conversation context)
│   └── Sub-Agents (delegation)
├── Workflows (step-based execution)
│   ├── Steps (atomic operations)
│   └── Suspend/Resume capability
├── Tools (stateless functions)
├── Storage (persistence layer)
├── Vectors (semantic search)
├── MCP Servers (external exposure)
└── Server/API (HTTP interfaces)
```

## Critical Mastra Patterns

### 1. Tool Creation and Composition

**Tools are the atomic units** - pure functions with Zod validation:

```typescript
export const myTool = createTool({
  id: 'unique-tool-id',
  description: 'Clear, specific description for AI understanding',
  inputSchema: z.object({
    // Always use Zod for type safety and AI comprehension
    param: z.string().describe('Detailed parameter description'),
  }),
  execute: async ({ context }) => {
    // Stateless execution - no side effects in tool logic
    // Use context for all inputs, not external dependencies
    return { result: 'structured response' };
  },
});
```

**Tool Composition Strategy**:
- Tools compose into Agents via the `tools` property
- Tools can be shared across multiple Agents
- Tools are dynamically composed from multiple sources (assigned, memory, toolsets, MCP)

### 2. Agent Design Patterns

**Agents are the primary AI interaction abstraction**:

```typescript
export const myAgent = new Agent({
  name: 'Descriptive Agent Name',
  description: 'What this agent does and when to use it',
  instructions: `
    Detailed system prompt that:
    - Defines the agent's role and capabilities
    - Explains when to use tools vs workflows
    - Sets response patterns and behavior
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    // Tools directly available to this agent
    myTool,
    sharedTool,
  },
  workflows: {
    // Workflows this agent can orchestrate
    myWorkflow,
  },
  agents: {
    // Sub-agents for delegation (creates agent networks)
    specialistAgent,
  },
  memory: new Memory(), // Conversation persistence
});
```

**Agent Architecture Principles**:
- Each Agent should have a **clear, specific purpose**
- Instructions should be **detailed and prescriptive**
- Tool selection should **match the agent's domain**
- Memory enables **conversation continuity**

### 3. Workflow Orchestration Patterns

**Workflows handle multi-step processes** with suspend/resume capabilities:

```typescript
export const myWorkflow = createWorkflow({
  id: 'descriptive-workflow-id',
  description: 'What this workflow accomplishes end-to-end',
  inputSchema: z.object({
    // Define clear input contracts
    data: z.any(),
    options: z.object({...}).optional(),
  }),
  outputSchema: z.object({
    // Define clear output contracts
    result: z.any(),
    metadata: z.object({...}),
  }),
});

// Steps define the actual processing logic
const step1 = createStep({
  id: 'step-1',
  description: 'What this step does',
  inputSchema: z.object({...}),
  outputSchema: z.object({...}),
  execute: async ({ inputData }) => {
    // Step logic - can be suspended/resumed
    return { processedData: inputData };
  },
});

// Chain steps together
myWorkflow.then(step1).then(step2).commit();
```

**Workflow Design Principles**:
- Each step should be **atomic and resumable**
- Data contracts between steps should be **explicit** (Zod schemas)
- Steps should **validate inputs and outputs**
- Workflows can be **suspended and resumed** (handle long-running operations)

### 4. Data Flow and Validation

**Critical Pattern**: Data flows through Zod schemas at every boundary:

```
API Request → Zod Validation → Agent Processing → Tool Execution → Workflow Steps
     ↓              ↓                ↓               ↓              ↓
   Schema       Input Schema    Instructions    Tool Schema   Step Schema
```

**Validation Strategy**:
- **Every input/output boundary** has a Zod schema
- **Runtime validation** prevents type errors
- **AI models understand** Zod descriptions for better tool usage
- **Development time feedback** via TypeScript + Zod

### 5. Memory and Context Management

**Memory provides thread-based conversation persistence**:

```typescript
const memory = new Memory();

// Memory in agents enables conversation continuity
const agent = new Agent({
  // ... other config
  memory, // Conversations persist across interactions
});

// Memory supports semantic recall and working memory
await memory.saveMemory('thread-id', {
  role: 'user',
  content: 'Previous conversation context',
});
```

**Memory Patterns**:
- **Thread-based**: Each conversation gets a unique thread ID
- **Semantic recall**: Find relevant past conversations
- **Working memory**: Temporary context for multi-turn interactions
- **Shared memory**: Multiple agents can share conversation context

## API and Integration Patterns

### 1. A2A (Agent-to-Agent) Communication

**Agents can delegate to other agents**:

```typescript
export const coordinatorAgent = new Agent({
  name: 'Coordinator',
  instructions: 'Delegates tasks to specialized agents',
  agents: {
    specialist: specialistAgent, // Sub-agent for delegation
  },
  // Coordinator can invoke specialist for specific tasks
});
```

### 2. MCP (Model Context Protocol) Exposure

**MCP servers expose Mastra functionality externally**:

```typescript
export const mcpServer = new MCPServer({
  name: 'My MCP Server',
  version: '1.0.0',
  agents: {
    // Expose specific agents via MCP
    myAgent,
  },
  workflows: {
    // Expose workflows via MCP
    myWorkflow,
  },
  tools: {
    // MCP-specific tools
    serverManagementTool,
  },
  resources: {
    // Structured data resources
    listResources: async () => [...],
    getResourceContent: async ({ uri }) => [...],
  },
});
```

### 3. HTTP API Patterns with Hono

**Expose functionality via REST APIs**:

```typescript
app.post('/api/agents/:agentId/chat', async (c) => {
  const agentId = c.req.param('agentId');
  const { message, options } = await c.req.json();

  const agent = mastra.getAgent(agentId);
  const response = await agent.generate([{
    role: 'user',
    content: message,
  }], options);

  return c.json(response);
});
```

### 4. Security and Middleware Patterns

**Secure APIs with Hono middleware**:

```typescript
// Authentication middleware
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!isValidToken(token)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', getUserFromToken(token));
  await next();
};

// Rate limiting middleware
const rateLimitMiddleware = async (c: any, next: () => Promise<void>) => {
  const clientId = getClientId(c);
  if (isRateLimited(clientId)) {
    return c.json({ error: 'Rate limited' }, 429);
  }
  await next();
};

// Apply to Mastra server configuration
export const mastra = new Mastra({
  server: {
    middleware: [
      { handler: authMiddleware, path: '/api/protected/*' },
      { handler: rateLimitMiddleware, path: '/api/*' },
    ],
  },
});
```

## Common Implementation Patterns

### 1. Error Handling and Recovery

```typescript
// In tools
execute: async ({ context }) => {
  try {
    const result = await externalApiCall(context.input);
    return { success: true, data: result };
  } catch (error) {
    // Return structured errors, don't throw
    return {
      success: false,
      error: error.message,
      retryable: isRetryableError(error),
    };
  }
}

// In workflows with retry logic
const stepWithRetry = createStep({
  execute: async ({ inputData }) => {
    return await retry(
      () => processData(inputData),
      { retries: 3, backoff: 2000 }
    );
  },
});
```

### 2. Progressive Enhancement

```typescript
// Start simple, add complexity gradually
const basicAgent = new Agent({
  name: 'Basic Agent',
  instructions: 'Simple, focused instructions',
  model: openai('gpt-4o-mini'),
  tools: { essentialTool }, // Start with minimal tools
});

// Enhance with more capabilities
const enhancedAgent = new Agent({
  name: 'Enhanced Agent',
  instructions: 'More sophisticated instructions',
  model: openai('gpt-4o-mini'),
  tools: { ...basicTools, ...advancedTools },
  workflows: { complexWorkflow },
  memory: new Memory(),
  agents: { specialistAgent },
});
```

### 3. Configuration-Driven Development

```typescript
// Use environment variables for feature flags
const mastra = new Mastra({
  agents: {
    ...coreAgents,
    ...(process.env.EXPERIMENTAL_FEATURES === 'true' && {
      experimentalAgent,
    }),
  },
  telemetry: {
    enabled: process.env.TELEMETRY_ENABLED === 'true',
  },
  server: {
    middleware: [
      ...(process.env.AUTH_ENABLED === 'true' ? [authMiddleware] : []),
    ],
  },
});
```

## Development Workflow Patterns

### 1. Component-First Development

1. **Design the data schema** (Zod schemas first)
2. **Create tools** (atomic, testable functions)
3. **Compose tools into agents** (domain-specific groupings)
4. **Orchestrate with workflows** (multi-step processes)
5. **Expose via APIs** (HTTP/MCP/A2A)

### 2. Testing Strategies

```typescript
// Test tools in isolation
describe('myTool', () => {
  it('processes valid input correctly', async () => {
    const result = await myTool.execute({
      context: { validInput: 'test' }
    });
    expect(result).toMatchObject({ success: true });
  });
});

// Test workflows step by step
describe('myWorkflow', () => {
  it('executes all steps successfully', async () => {
    const result = await myWorkflow.execute({
      inputData: mockData,
    });
    expect(result.metadata.steps).toHaveLength(3);
  });
});

// Test agent interactions with mock tools
describe('myAgent', () => {
  it('uses tools appropriately', async () => {
    const agent = new Agent({
      tools: { mockTool },
      // ... config
    });
    // Test agent behavior
  });
});
```

### 3. Debugging and Observability

```typescript
// Enable comprehensive logging
const mastra = new Mastra({
  logger: new PinoLogger({ level: 'debug' }),
  telemetry: { enabled: true },
  events: {
    'agent:*': (event) => console.log('Agent event:', event),
    'workflow:*': (event) => console.log('Workflow event:', event),
    'tool:*': (event) => console.log('Tool event:', event),
  },
});

// Add performance monitoring
const timedTool = createTool({
  execute: async ({ context }) => {
    const start = Date.now();
    const result = await actualProcessing(context);
    const duration = Date.now() - start;
    console.log(`Tool executed in ${duration}ms`);
    return { ...result, _metadata: { executionTime: duration } };
  },
});
```

## Anti-Patterns to Avoid

### ❌ Direct Component Dependencies
```typescript
// WRONG: Direct imports between components
import { otherAgent } from './other-agent';
const myAgent = new Agent({
  // This breaks the dependency injection pattern
});
```

### ❌ Stateful Tools
```typescript
// WRONG: Tools with internal state
let globalState = {};
const statefulTool = createTool({
  execute: async ({ context }) => {
    globalState.lastCall = Date.now(); // Don't do this!
    return { result: 'bad pattern' };
  },
});
```

### ❌ Unvalidated Data Flow
```typescript
// WRONG: No schema validation
const unsafeTool = createTool({
  id: 'unsafe',
  // Missing inputSchema - AI can't understand usage
  execute: async ({ context }) => {
    // context is 'any' type - runtime errors likely
    return context.someProperty.dangerousOperation();
  },
});
```

### ❌ Monolithic Agents
```typescript
// WRONG: One agent trying to do everything
const godAgent = new Agent({
  name: 'Do Everything Agent',
  instructions: 'Handle any request the user makes...',
  tools: { ...allPossibleTools }, // Too many responsibilities
});
```

## Performance and Scaling Patterns

### 1. Efficient Tool Composition
- **Lazy loading**: Only load tools when needed
- **Tool sharing**: Reuse tools across agents
- **Selective exposure**: Only expose relevant tools per agent

### 2. Memory Management
- **Thread cleanup**: Regularly clean old conversation threads
- **Memory limits**: Set reasonable limits on conversation history
- **Semantic indexing**: Use vector stores for efficient retrieval

### 3. Workflow Optimization
- **Step granularity**: Balance between too fine and too coarse
- **Parallel execution**: Use parallel steps where possible
- **Checkpoint frequency**: Balance resumability with performance

## Production Deployment Patterns

### 1. Environment Configuration
```typescript
// Separate configs for different environments
const config = {
  development: {
    logger: { level: 'debug' },
    telemetry: { enabled: false },
  },
  production: {
    logger: { level: 'warn' },
    telemetry: { enabled: true },
    server: {
      middleware: [securityMiddleware, rateLimitMiddleware],
    },
  },
}[process.env.NODE_ENV];
```

### 2. Monitoring and Health Checks
```typescript
export async function healthCheck() {
  return {
    status: 'healthy',
    components: {
      storage: await storage.healthCheck(),
      agents: Object.keys(agents).length,
      memory: await memory.healthCheck(),
    },
    timestamp: new Date().toISOString(),
  };
}
```

## Quick Reference: Common Tasks

### Adding a New Tool
1. Create tool with `createTool()`
2. Define Zod input/output schemas
3. Implement stateless `execute` function
4. Add to relevant agent's `tools` object
5. Update agent instructions to mention tool

### Adding a New Agent
1. Define agent purpose and capabilities
2. Write detailed system instructions
3. Select appropriate tools and workflows
4. Configure memory if needed
5. Add to Mastra configuration
6. Create API endpoints if needed

### Adding a New Workflow
1. Design the step-by-step process
2. Create workflow with `createWorkflow()`
3. Define each step with `createStep()`
4. Chain steps with `.then()`
5. Call `.commit()` to finalize
6. Add to agents that should use it

### Exposing via API
1. Create Hono route handler
2. Validate input with Zod
3. Get component from Mastra instance
4. Execute and return response
5. Add error handling middleware

Remember: **Mastra applications are built through composition**, not inheritance. Focus on creating small, well-defined components that work together through the central orchestration pattern.