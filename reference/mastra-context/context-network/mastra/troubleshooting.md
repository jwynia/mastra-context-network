# Mastra Troubleshooting Guide

## Common Issues and Solutions

### Component Registration Issues

#### Problem: "Agent/Workflow/Tool not found"

**Symptoms**:
- Runtime error: "Agent 'myAgent' not found"
- Component appears to be defined but not accessible
- Mastra instance doesn't recognize registered components

**Root Causes**:
1. Component not registered in Mastra configuration
2. Component registered with different key than accessed
3. Circular dependency in component definitions

**Solutions**:

```typescript
// ✅ Correct registration
export const mastra = new Mastra({
  agents: {
    myAgent: myAgentInstance,  // Key matches access
  },
  workflows: {
    myWorkflow: myWorkflowInstance,
  },
});

// ✅ Correct access
const agent = mastra.getAgent('myAgent');  // Same key

// ❌ Common mistake - mismatched keys
export const mastra = new Mastra({
  agents: {
    'my-agent': myAgentInstance,  // Kebab case
  },
});
const agent = mastra.getAgent('myAgent');  // Camel case - won't work!
```

**Debugging Steps**:
1. Log registered component keys: `console.log(Object.keys(mastra.getAgents()))`
2. Verify key consistency between registration and access
3. Check for typos in component names
4. Ensure components are exported properly

#### Problem: Circular Dependencies

**Symptoms**:
- Import errors during startup
- Components undefined at runtime
- Module resolution failures

**Root Cause**:
Components trying to import each other directly instead of using Mastra's dependency injection.

**Solution**:
```typescript
// ❌ Circular dependency
// agent-a.ts
import { agentB } from './agent-b';
export const agentA = new Agent({
  agents: { agentB }  // Direct import
});

// agent-b.ts
import { agentA } from './agent-a';  // Circular!

// ✅ Use Mastra's dependency injection
// agent-a.ts
export const agentA = new Agent({
  name: 'Agent A',
  // Don't import directly - register in Mastra instead
});

// mastra/index.ts
export const mastra = new Mastra({
  agents: {
    agentA,
    agentB,  // Both agents registered, can reference each other at runtime
  },
});
```

### Schema Validation Issues

#### Problem: Schema Validation Failures

**Symptoms**:
- "Invalid input" errors at runtime
- Tool execution fails with validation errors
- Type mismatches between expected and actual data

**Common Causes**:
1. Schema doesn't match actual data structure
2. Optional fields not properly defined
3. Nested object validation issues
4. Type coercion problems

**Solutions**:

```typescript
// ❌ Common schema mistakes
const badSchema = z.object({
  id: z.string(),           // Required but might be undefined
  count: z.number(),        // Might receive string from API
  items: z.array(z.any()),  // Too permissive
});

// ✅ Robust schema design
const goodSchema = z.object({
  id: z.string().optional().or(z.number().transform(String)),  // Handle multiple types
  count: z.coerce.number(),                                    // Coerce to number
  items: z.array(z.object({                                   // Define item structure
    name: z.string(),
    value: z.number(),
  })).default([]),                                            // Provide default
  metadata: z.object({
    tags: z.array(z.string()).optional(),
  }).optional(),
});
```

**Debugging Schema Issues**:
```typescript
// Add detailed error logging
const tool = createTool({
  id: 'debug-tool',
  inputSchema: mySchema,
  execute: async ({ context }) => {
    try {
      const validated = mySchema.parse(context);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation failed:', {
          errors: error.errors,
          input: context,
        });
        return {
          success: false,
          validationErrors: error.errors,
        };
      }
      throw error;
    }
  },
});
```

### Memory and Context Issues

#### Problem: Memory Not Persisting

**Symptoms**:
- Conversations don't maintain context
- Agent forgets previous interactions
- Memory appears empty when accessed

**Root Causes**:
1. Different thread IDs across requests
2. Memory not properly configured
3. Storage backend issues

**Solutions**:

```typescript
// ✅ Consistent thread ID management
app.post('/api/chat', async (c) => {
  const { message, threadId } = await c.req.json();

  // Generate consistent thread ID if not provided
  const finalThreadId = threadId || `user_${userId}_${sessionId}`;

  const response = await agent.generate([{
    role: 'user',
    content: message,
  }], {
    threadId: finalThreadId,  // Use consistent thread ID
  });

  return c.json({
    response,
    threadId: finalThreadId,  // Return for client to use in next request
  });
});

// ✅ Verify memory configuration
const agent = new Agent({
  name: 'Memory Agent',
  memory: new Memory({
    // Configure memory properly
    storage: memoryStorage,
    maxTokens: 4000,
    maxMessages: 50,
  }),
  // ... other config
});
```

**Memory Debugging**:
```typescript
// Debug memory state
const debugMemory = async (threadId: string) => {
  const memories = await agent.memory.getMemories(threadId);
  console.log('Thread memories:', {
    threadId,
    count: memories.length,
    messages: memories.map(m => ({
      role: m.role,
      contentLength: m.content.length,
      timestamp: m.timestamp,
    })),
  });
};
```

#### Problem: Context Window Exceeded

**Symptoms**:
- "Context length exceeded" errors
- Agent performance degradation
- Memory errors with large conversations

**Solutions**:
```typescript
// ✅ Implement context window management
const agent = new Agent({
  memory: new Memory({
    maxTokens: 8000,        // Set reasonable limit
    maxMessages: 20,        // Limit message count
    summarization: true,    // Enable automatic summarization
  }),
  instructions: `
    When the conversation gets long, summarize the key points
    to maintain context while staying within limits.
  `,
});

// ✅ Manual context management
const manageContext = async (threadId: string) => {
  const memories = await agent.memory.getMemories(threadId);

  if (memories.length > 15) {
    // Summarize older messages
    const older = memories.slice(0, -10);
    const summary = await summarizeMessages(older);

    // Replace with summary
    await agent.memory.clearMemories(threadId);
    await agent.memory.saveMemory(threadId, {
      role: 'system',
      content: `Previous conversation summary: ${summary}`,
    });

    // Keep recent messages
    const recent = memories.slice(-10);
    for (const message of recent) {
      await agent.memory.saveMemory(threadId, message);
    }
  }
};
```

### Tool Execution Issues

#### Problem: Tool Timeouts

**Symptoms**:
- Tools fail with timeout errors
- Long-running operations interrupted
- Inconsistent tool performance

**Solutions**:
```typescript
// ✅ Configure appropriate timeouts
const longRunningTool = createTool({
  id: 'long-running-tool',
  description: 'Performs lengthy operations',
  inputSchema: z.object({
    data: z.array(z.any()),
    timeout: z.number().default(30000),  // Configurable timeout
  }),
  execute: async ({ context }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      context.timeout
    );

    try {
      const result = await longOperation(context.data, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Operation timed out',
          timeout: context.timeout,
        };
      }
      throw error;
    }
  },
});
```

#### Problem: Tool State Leakage

**Symptoms**:
- Tools behaving differently on subsequent calls
- Unexpected side effects
- Inconsistent results

**Root Cause**:
Tools maintaining state between executions (violates stateless principle).

**Solutions**:
```typescript
// ❌ Stateful tool (problematic)
let globalCounter = 0;
const statefulTool = createTool({
  execute: async ({ context }) => {
    globalCounter++;  // State leakage!
    return { count: globalCounter };
  },
});

// ✅ Stateless tool
const statelessTool = createTool({
  execute: async ({ context }) => {
    // All state comes from context or external storage
    const currentCount = await storage.get('counter') || 0;
    const newCount = currentCount + 1;
    await storage.set('counter', newCount);
    return { count: newCount };
  },
});

// ✅ Tool with proper state management
const properStateTool = createTool({
  execute: async ({ context }) => {
    // Use context for all inputs
    const { userId, operation } = context;

    // Get state from reliable source
    const userState = await storage.get(`user:${userId}`);

    // Perform operation
    const result = performOperation(userState, operation);

    // Save state back
    await storage.set(`user:${userId}`, result.newState);

    return { result: result.output };
  },
});
```

### Workflow Execution Issues

#### Problem: Workflow Step Failures

**Symptoms**:
- Workflows fail at specific steps
- Partial execution with no recovery
- Data loss between steps

**Solutions**:
```typescript
// ✅ Robust step error handling
const robustStep = createStep({
  id: 'robust-step',
  execute: async ({ inputData }) => {
    try {
      // Validate input at step level
      const validInput = stepInputSchema.parse(inputData);

      // Perform operation with error handling
      const result = await performOperation(validInput);

      // Validate output before returning
      return stepOutputSchema.parse(result);
    } catch (error) {
      // Return structured error for workflow handling
      return {
        success: false,
        error: {
          step: 'robust-step',
          message: error.message,
          input: inputData,
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
});

// ✅ Workflow with error recovery
const resilientWorkflow = createWorkflow({
  id: 'resilient-workflow',
  // ... configuration
});

const stepWithRetry = createStep({
  id: 'retry-step',
  execute: async ({ inputData }) => {
    return await retry(
      async () => {
        const result = await unreliableOperation(inputData);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      },
      {
        retries: 3,
        delay: 1000,
        backoff: 2,
      }
    );
  },
});
```

#### Problem: Workflow Resume Failures

**Symptoms**:
- Workflows can't resume after suspension
- State corruption during resume
- Data inconsistency across resume

**Solutions**:
```typescript
// ✅ Proper checkpoint management
const suspendableStep = createStep({
  id: 'suspendable-step',
  execute: async ({ inputData, checkpoint }) => {
    // Check for existing checkpoint
    if (checkpoint?.progress) {
      console.log('Resuming from checkpoint:', checkpoint.progress);
      return await resumeOperation(inputData, checkpoint);
    }

    // Start fresh operation
    const result = await startOperation(inputData, {
      onProgress: async (progress) => {
        // Save checkpoint for resume capability
        await saveCheckpoint('suspendable-step', {
          progress,
          timestamp: Date.now(),
          inputData,
        });
      },
    });

    return result;
  },
});
```

### API and Integration Issues

#### Problem: CORS Issues

**Symptoms**:
- Browser blocks API requests
- Preflight request failures
- Cross-origin errors

**Solutions**:
```typescript
// ✅ Proper CORS configuration
export const mastra = new Mastra({
  server: {
    cors: {
      origin: process.env.NODE_ENV === 'development'
        ? true  // Allow all origins in development
        : [
            'https://yourdomain.com',
            'https://app.yourdomain.com',
          ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  },
});

// ✅ Handle preflight requests
app.options('*', (c) => {
  return c.text('', 204);
});
```

#### Problem: Authentication Failures

**Symptoms**:
- Valid tokens rejected
- Authentication middleware errors
- Inconsistent auth behavior

**Solutions**:
```typescript
// ✅ Robust authentication middleware
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({ error: 'Missing Authorization header' }, 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Invalid Authorization format' }, 401);
    }

    const token = authHeader.substring(7);

    // Validate token with proper error handling
    const user = await validateToken(token).catch(error => {
      console.error('Token validation failed:', error);
      return null;
    });

    if (!user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication error' }, 500);
  }
};
```

### Performance Issues

#### Problem: Slow Response Times

**Symptoms**:
- API requests taking too long
- Tool execution timeouts
- User experience degradation

**Debugging Steps**:
1. Enable performance logging
2. Identify bottlenecks
3. Implement caching
4. Optimize database queries

**Solutions**:
```typescript
// ✅ Performance monitoring
const performanceTool = createTool({
  id: 'perf-tool',
  execute: async ({ context }) => {
    const start = Date.now();

    try {
      const result = await expensiveOperation(context);
      const duration = Date.now() - start;

      // Log performance metrics
      console.log('Tool performance:', {
        toolId: 'perf-tool',
        duration,
        inputSize: JSON.stringify(context).length,
        outputSize: JSON.stringify(result).length,
      });

      return {
        ...result,
        _metadata: { executionTime: duration },
      };
    } catch (error) {
      const duration = Date.now() - start;
      console.error('Tool failed:', {
        toolId: 'perf-tool',
        duration,
        error: error.message,
      });
      throw error;
    }
  },
});

// ✅ Implement caching for expensive operations
const cachedTool = createTool({
  id: 'cached-tool',
  execute: async ({ context }) => {
    const cacheKey = `tool:cached:${JSON.stringify(context)}`;

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Execute and cache
    const result = await expensiveOperation(context);
    await cache.set(cacheKey, result, { ttl: 300 }); // 5 minutes

    return { ...result, fromCache: false };
  },
});
```

### Development and Debugging

#### Problem: Difficult to Debug Issues

**Symptoms**:
- Unclear error messages
- Hard to trace execution flow
- Missing context in logs

**Solutions**:
```typescript
// ✅ Enhanced debugging setup
export const mastra = new Mastra({
  logger: new PinoLogger({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: { colorize: true },
    } : undefined,
  }),

  // Enable telemetry for tracing
  telemetry: {
    enabled: true,
    serviceName: 'mastra-app',
  },

  // Debug event handlers
  events: {
    'agent:*': (event) => {
      console.log('Agent event:', {
        type: event.type,
        agentId: event.data.agentId,
        timestamp: new Date().toISOString(),
      });
    },
    'tool:*': (event) => {
      console.log('Tool event:', {
        type: event.type,
        toolId: event.data.toolId,
        duration: event.data.duration,
      });
    },
    'workflow:*': (event) => {
      console.log('Workflow event:', {
        type: event.type,
        workflowId: event.data.workflowId,
        step: event.data.step,
      });
    },
  },
});

// ✅ Debug-friendly tool wrapper
const debugTool = (originalTool: Tool) => createTool({
  ...originalTool,
  execute: async (params) => {
    const { context } = params;
    console.log(`Executing tool ${originalTool.id}:`, {
      input: context,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await originalTool.execute(params);
      console.log(`Tool ${originalTool.id} completed:`, {
        success: true,
        outputKeys: Object.keys(result),
      });
      return result;
    } catch (error) {
      console.error(`Tool ${originalTool.id} failed:`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },
});
```

## Diagnostic Commands

### Health Check Script
```typescript
// scripts/health-check.ts
import { mastra } from '../src/mastra';

export async function runHealthCheck() {
  console.log('Running Mastra health check...');

  // Check component registration
  const agents = Object.keys(mastra.getAgents());
  const workflows = Object.keys(mastra.getWorkflows());

  console.log('Registered components:', {
    agents: agents.length,
    workflows: workflows.length,
  });

  // Check storage connectivity
  try {
    await mastra.storage.get('health-check');
    console.log('✅ Storage: Healthy');
  } catch (error) {
    console.log('❌ Storage: Failed', error.message);
  }

  // Check agent functionality
  for (const agentId of agents) {
    try {
      const agent = mastra.getAgent(agentId);
      console.log(`✅ Agent ${agentId}: Available`);
    } catch (error) {
      console.log(`❌ Agent ${agentId}: Failed`, error.message);
    }
  }
}
```

### Component Inspector
```typescript
// scripts/inspect-components.ts
export function inspectComponents() {
  const agents = mastra.getAgents();

  Object.entries(agents).forEach(([id, agent]) => {
    console.log(`Agent: ${id}`, {
      name: agent.name,
      description: agent.description,
      tools: Object.keys(agent.tools || {}),
      workflows: Object.keys(agent.workflows || {}),
      hasMemory: !!agent.memory,
      subAgents: Object.keys(agent.agents || {}),
    });
  });
}
```

## See Also

- [[patterns.md]] - Implementation patterns to avoid common issues
- [[architecture.md]] - Understanding the system architecture
- [[recipes.md]] - Code snippets for common fixes