# Mastra Framework Patterns

## Core Architectural Patterns

### Central Orchestration Pattern

**Pattern**: All components register with a central Mastra instance rather than importing each other directly.

**Why**:
- Enables runtime dependency injection
- Prevents circular dependencies
- Allows for dynamic component composition
- Supports plugin architecture

**Implementation**:
```typescript
// ✅ Correct - Central registration
export const mastra = new Mastra({
  agents: { myAgent },
  tools: { /* tools available via agents */ },
  workflows: { myWorkflow },
  storage: storageInstance,
});

// ❌ Incorrect - Direct component imports
import { otherAgent } from './other-agent';
const myAgent = new Agent({ /* direct dependency */ });
```

**When to Use**: Always - this is the fundamental Mastra pattern.

### Tool Composition Pattern

**Pattern**: Tools are pure, stateless functions that compose into larger capabilities.

**Why**:
- Testability and reusability
- Clear input/output contracts
- AI model comprehension
- Atomic functionality

**Implementation**:
```typescript
// ✅ Correct - Pure function with clear schema
export const processDataTool = createTool({
  id: 'process-data',
  description: 'Processes data according to specified rules',
  inputSchema: z.object({
    data: z.array(z.any()),
    rules: z.object({
      validate: z.boolean().default(true),
      transform: z.boolean().default(false),
    }),
  }),
  execute: async ({ context }) => {
    // Pure function - no side effects
    const { data, rules } = context;
    return processData(data, rules);
  },
});

// ❌ Incorrect - Stateful tool
let globalCounter = 0;
const statefulTool = createTool({
  execute: async ({ context }) => {
    globalCounter++; // Side effect!
    return { count: globalCounter };
  },
});
```

**When to Use**: For all atomic functionality that agents need to perform.

### Agent Network Pattern

**Pattern**: Agents can delegate to specialized sub-agents for complex tasks.

**Why**:
- Separation of concerns
- Specialized expertise
- Task delegation
- Scalable architecture

**Implementation**:
```typescript
// ✅ Coordinator agent with sub-agents
export const coordinatorAgent = new Agent({
  name: 'Task Coordinator',
  instructions: `
    You coordinate complex tasks by delegating to specialized agents:
    - Use dataAnalyst for statistical analysis
    - Use contentWriter for text generation
    - Use codeReviewer for code analysis
  `,
  agents: {
    dataAnalyst: dataAnalystAgent,
    contentWriter: contentWriterAgent,
    codeReviewer: codeReviewerAgent,
  },
  tools: {
    taskPlanningTool,
    progressTrackingTool,
  },
});
```

**When to Use**: When tasks require multiple areas of expertise or complex coordination.

### Workflow Orchestration Pattern

**Pattern**: Multi-step processes are handled by workflows with suspendable steps.

**Why**:
- Long-running process support
- Step-by-step error handling
- Resume capability
- Clear process definition

**Implementation**:
```typescript
// ✅ Workflow with well-defined steps
export const dataProcessingWorkflow = createWorkflow({
  id: 'data-processing',
  description: 'Complete data processing pipeline',
  inputSchema: z.object({
    rawData: z.array(z.any()),
    options: z.object({
      validate: z.boolean().default(true),
      enrich: z.boolean().default(false),
    }),
  }),
  outputSchema: z.object({
    processedData: z.array(z.any()),
    metadata: z.object({
      recordsProcessed: z.number(),
      errors: z.array(z.string()),
    }),
  }),
});

const validateStep = createStep({
  id: 'validate',
  description: 'Validate input data quality',
  inputSchema: z.object({
    rawData: z.array(z.any()),
    options: z.object({ validate: z.boolean() }),
  }),
  outputSchema: z.object({
    validData: z.array(z.any()),
    invalidData: z.array(z.any()),
  }),
  execute: async ({ inputData }) => {
    // Can be suspended and resumed
    return await validateData(inputData.rawData);
  },
});

dataProcessingWorkflow.then(validateStep).commit();
```

**When to Use**: For processes that involve multiple steps, can be long-running, or need to handle failures gracefully.

## Data Flow Patterns

### Schema-First Pattern

**Pattern**: Define Zod schemas before implementing functionality.

**Why**:
- Type safety at runtime
- AI model understanding
- Clear contracts
- Documentation

**Implementation**:
```typescript
// ✅ Schema-first approach
const UserDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  preferences: z.object({
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark']).default('light'),
  }),
});

type UserData = z.infer<typeof UserDataSchema>;

const processUserTool = createTool({
  id: 'process-user',
  inputSchema: UserDataSchema,
  execute: async ({ context }: { context: UserData }) => {
    // TypeScript knows the exact shape of context
    return { userId: context.id, processed: true };
  },
});
```

**When to Use**: Always - start with schemas for any data that crosses component boundaries.

### Validation Boundary Pattern

**Pattern**: Validate data at every component boundary.

**Why**:
- Runtime safety
- Early error detection
- Clear failure modes
- Debugging assistance

**Implementation**:
```typescript
// ✅ Validation at boundaries
app.post('/api/process', async (c) => {
  // Validate at API boundary
  const body = RequestSchema.parse(await c.req.json());

  // Validate at agent boundary
  const result = await agent.process(body);

  // Validate at response boundary
  return c.json(ResponseSchema.parse(result));
});
```

**When to Use**: At API endpoints, tool inputs/outputs, workflow step boundaries, and storage operations.

## Memory and Context Patterns

### Thread-Based Memory Pattern

**Pattern**: Use thread IDs to maintain conversation context across interactions.

**Why**:
- Conversation continuity
- User session isolation
- Context preservation
- Multi-user support

**Implementation**:
```typescript
// ✅ Thread-based memory management
const conversationAgent = new Agent({
  name: 'Conversation Agent',
  memory: new Memory(),
  instructions: `
    Maintain conversation context using thread-based memory.
    Reference previous messages in the thread when relevant.
  `,
});

// In API handler
app.post('/api/chat', async (c) => {
  const { message, threadId } = await c.req.json();

  const response = await conversationAgent.generate([{
    role: 'user',
    content: message,
  }], {
    threadId: threadId || `thread_${Date.now()}`,
  });

  return c.json({ response, threadId });
});
```

**When to Use**: For any agent that needs to maintain conversation context across multiple interactions.

### Semantic Memory Pattern

**Pattern**: Use vector storage for semantic search and retrieval.

**Why**:
- Relevant context retrieval
- Large knowledge base support
- Intelligent information access
- Context-aware responses

**Implementation**:
```typescript
// ✅ Semantic memory integration
const knowledgeAgent = new Agent({
  name: 'Knowledge Agent',
  tools: {
    searchKnowledge: createTool({
      id: 'search-knowledge',
      description: 'Search knowledge base semantically',
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().default(5),
      }),
      execute: async ({ context }) => {
        const vectors = mastra.getVectors();
        return await vectors.search(context.query, context.limit);
      },
    }),
  },
  instructions: `
    Use the searchKnowledge tool to find relevant information
    before answering questions. Combine search results with
    your knowledge to provide comprehensive answers.
  `,
});
```

**When to Use**: When agents need access to large knowledge bases or document collections.

## API and Integration Patterns

### MCP Server Pattern

**Pattern**: Expose Mastra functionality via Model Context Protocol servers.

**Why**:
- External tool integration
- Standardized protocol
- Reusable components
- Cross-platform compatibility

**Implementation**:
```typescript
// ✅ MCP server for external access
export const mastraMCPServer = new MCPServer({
  name: 'Mastra Application Server',
  version: '1.0.0',
  agents: {
    // Expose specific agents
    assistant: assistantAgent,
    analyst: dataAnalystAgent,
  },
  workflows: {
    // Expose workflows
    dataProcessing: dataProcessingWorkflow,
  },
  tools: {
    // MCP-specific management tools
    healthCheck: healthCheckTool,
    serverInfo: serverInfoTool,
  },
  resources: {
    // Structured data resources
    listResources: async () => [...],
    getResourceContent: async ({ uri }) => [...],
  },
});
```

**When to Use**: When you need to expose Mastra functionality to external systems or other AI applications.

### A2A Communication Pattern

**Pattern**: Agents communicate through structured delegation.

**Why**:
- Specialized task handling
- Load distribution
- Expertise routing
- Scalable architecture

**Implementation**:
```typescript
// ✅ Agent-to-agent delegation
const managementAgent = new Agent({
  name: 'Management Agent',
  instructions: `
    You manage complex projects by delegating to specialist agents:

    For data analysis tasks: delegate to dataSpecialist
    For content creation: delegate to contentSpecialist
    For technical reviews: delegate to techSpecialist

    Coordinate their work and synthesize results.
  `,
  agents: {
    dataSpecialist: dataAnalystAgent,
    contentSpecialist: contentWriterAgent,
    techSpecialist: codeReviewerAgent,
  },
  tools: {
    projectPlanningTool,
    taskCoordinationTool,
  },
});
```

**When to Use**: For complex tasks that benefit from specialized expertise and coordination.

### Middleware Security Pattern

**Pattern**: Apply security and rate limiting through Hono middleware.

**Why**:
- Centralized security
- Request/response interception
- Rate limiting
- Audit logging

**Implementation**:
```typescript
// ✅ Security middleware pattern
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const user = await validateToken(token);
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

const rateLimitMiddleware = async (c: any, next: () => Promise<void>) => {
  const clientId = getClientId(c);
  const isLimited = await checkRateLimit(clientId);

  if (isLimited) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  await next();
};

// Apply in Mastra configuration
export const mastra = new Mastra({
  server: {
    middleware: [
      { handler: authMiddleware, path: '/api/protected/*' },
      { handler: rateLimitMiddleware, path: '/api/*' },
    ],
  },
});
```

**When to Use**: For production applications that need authentication, rate limiting, or request/response modification.

## Error Handling Patterns

### Structured Error Response Pattern

**Pattern**: Return structured error objects instead of throwing exceptions.

**Why**:
- Predictable error handling
- Graceful degradation
- Error recovery
- Better user experience

**Implementation**:
```typescript
// ✅ Structured error responses
const robustTool = createTool({
  id: 'robust-tool',
  execute: async ({ context }) => {
    try {
      const result = await riskyOperation(context);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: error.message,
          retryable: isRetryableError(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
});

// ❌ Incorrect - Throwing exceptions
const fragileTools = createTool({
  execute: async ({ context }) => {
    const result = await riskyOperation(context); // Can throw!
    return result; // Breaks the tool chain
  },
});
```

**When to Use**: In all tools and workflow steps that interact with external systems or can fail.

### Retry with Backoff Pattern

**Pattern**: Implement exponential backoff for retryable operations.

**Why**:
- Resilience to temporary failures
- Reduced system load
- Better success rates
- Graceful degradation

**Implementation**:
```typescript
// ✅ Retry with exponential backoff
const resilientTool = createTool({
  id: 'resilient-tool',
  execute: async ({ context }) => {
    return await retry(
      async () => {
        const result = await externalApiCall(context);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      },
      {
        retries: 3,
        delay: 1000,
        backoff: 2,
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt}: ${error.message}`);
        },
      }
    );
  },
});
```

**When to Use**: For operations that depend on external services or network resources.

## Performance Patterns

### Lazy Loading Pattern

**Pattern**: Load components only when needed.

**Why**:
- Faster startup times
- Reduced memory usage
- Better resource utilization
- Scalability

**Implementation**:
```typescript
// ✅ Lazy component loading
const lazyAgents = {
  get heavyAgent() {
    if (!this._heavyAgent) {
      this._heavyAgent = createHeavyAgent();
    }
    return this._heavyAgent;
  },
};

// ✅ Conditional tool loading
const conditionalTools = {
  ...(process.env.FEATURE_ADVANCED === 'true' && {
    advancedTool: createAdvancedTool(),
  }),
};
```

**When to Use**: For resource-intensive components or optional features.

### Caching Pattern

**Pattern**: Cache expensive operations and API responses.

**Why**:
- Improved response times
- Reduced API costs
- Better user experience
- Resource efficiency

**Implementation**:
```typescript
// ✅ Tool-level caching
const cachedTool = createTool({
  id: 'cached-tool',
  execute: async ({ context }) => {
    const cacheKey = `tool:${JSON.stringify(context)}`;

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Execute and cache
    const result = await expensiveOperation(context);
    await cache.set(cacheKey, result, { ttl: 300000 }); // 5 minutes

    return { ...result, fromCache: false };
  },
});
```

**When to Use**: For tools that make expensive API calls or perform heavy computations.

## Testing Patterns

### Component Isolation Pattern

**Pattern**: Test each component type (tools, workflows, agents) in isolation.

**Why**:
- Fast test execution
- Clear failure identification
- Easy mocking
- Focused testing

**Implementation**:
```typescript
// ✅ Tool testing in isolation
describe('processDataTool', () => {
  it('validates input correctly', async () => {
    const result = await processDataTool.execute({
      context: { data: [1, 2, 3], rules: { validate: true } }
    });

    expect(result.success).toBe(true);
    expect(result.validatedData).toHaveLength(3);
  });

  it('handles invalid input gracefully', async () => {
    const result = await processDataTool.execute({
      context: { data: null, rules: { validate: true } }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ✅ Workflow testing with mocked steps
describe('dataProcessingWorkflow', () => {
  it('executes all steps in sequence', async () => {
    const result = await dataProcessingWorkflow.execute({
      rawData: mockData,
      options: { validate: true },
    });

    expect(result.metadata.steps).toEqual([
      'validate', 'transform', 'analyze'
    ]);
  });
});
```

**When to Use**: For all component testing - start with unit tests for individual components.

### Integration Testing Pattern

**Pattern**: Test component interactions through the Mastra instance.

**Why**:
- End-to-end validation
- Integration verification
- Real-world scenarios
- Configuration testing

**Implementation**:
```typescript
// ✅ Integration testing
describe('Mastra Integration', () => {
  let testMastra: Mastra;

  beforeEach(() => {
    testMastra = new Mastra({
      agents: { testAgent },
      workflows: { testWorkflow },
      storage: mockStorage,
    });
  });

  it('agent uses workflow correctly', async () => {
    const agent = testMastra.getAgent('testAgent');
    const result = await agent.executeWorkflow('testWorkflow', {
      input: 'test data',
    });

    expect(result.success).toBe(true);
  });
});
```

**When to Use**: After component-level tests pass, to verify the integrated system works correctly.

## See Also

- [[architecture.md]] - Detailed architectural documentation
- [[troubleshooting.md]] - Common issues and solutions
- [[recipes.md]] - Code snippets for common tasks