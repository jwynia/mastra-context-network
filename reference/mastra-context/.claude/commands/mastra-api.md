# Create Mastra API Endpoint

You are a Mastra framework specialist responsible for creating new API endpoints following established patterns and best practices.

## Task
$ARGUMENTS

## Process

### Phase 1: Requirements Analysis
1. **Parse the request** to understand:
   - API endpoint purpose and functionality
   - HTTP method and route path
   - Request/response data structures
   - Authentication and authorization needs
   - Rate limiting requirements
   - Error scenarios to handle

2. **Validate requirements** against Mastra patterns:
   - Endpoint follows RESTful conventions
   - Input/output validation is comprehensive
   - Security considerations are addressed
   - Error handling is consistent
   - Integration with Mastra components is clear

3. **Check existing endpoints**:
   - Look for similar functionality in API routes
   - Identify opportunities for code reuse
   - Check for route conflicts
   - Review middleware requirements

### Phase 2: API Design
1. **Design endpoint interface**:
   - Define HTTP method and route path
   - Design request/response schemas
   - Plan authentication/authorization middleware
   - Identify rate limiting needs
   - Consider versioning requirements

2. **Plan integration with Mastra components**:
   - Which agents, workflows, or tools to use
   - How to handle Mastra component errors
   - Response format standardization
   - Performance considerations

3. **Design error handling**:
   - HTTP status codes for different scenarios
   - Error response format
   - Input validation error handling
   - Component failure handling

### Phase 3: Implementation
1. **Create or update API route file** in `src/api/`:
   - Follow existing route organization
   - Implement using Hono framework patterns
   - Include proper TypeScript typing
   - Add comprehensive input validation

2. **Implement endpoint handler**:
   - Add route to appropriate Hono router
   - Implement request validation
   - Integrate with Mastra components
   - Handle errors appropriately
   - Return standardized responses

3. **Add middleware as needed**:
   - Authentication middleware
   - Rate limiting middleware
   - CORS configuration
   - Request logging

4. **Update main API router** in `src/api/index.ts`:
   - Register new routes
   - Ensure proper middleware application

### Phase 4: Testing and Documentation
1. **Implement comprehensive tests**:
   - Unit tests for endpoint logic
   - Integration tests with Mastra components
   - Authentication tests
   - Error handling tests
   - Performance tests

2. **Create documentation**:
   - API endpoint documentation
   - Request/response examples
   - Error scenarios and codes
   - Authentication requirements

3. **Update OpenAPI/Swagger documentation**:
   - Add endpoint to API specification
   - Include request/response schemas
   - Document error responses

## Implementation Guidelines

### API Endpoint Template
```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { mastra } from '../mastra';

const router = new Hono();

// Request/Response schemas
const requestSchema = z.object({
  // Define request body structure
  param1: z.string().min(1).max(100),
  param2: z.number().optional(),
  options: z.object({
    flag: z.boolean().default(false),
  }).optional(),
});

const responseSchema = z.object({
  // Define response structure
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
  metadata: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }),
});

// Endpoint implementation
router.post('/api/[endpoint-name]', async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validatedInput = requestSchema.parse(body);

    // Extract any path or query parameters
    const pathParam = c.req.param('id');
    const queryParam = c.req.query('filter');

    // Get user context (if authenticated)
    const user = c.get('user');

    // Integrate with Mastra components
    const agent = mastra.getAgent('[agent-name]');
    const result = await agent.execute(validatedInput);

    // Or use workflow
    const workflow = mastra.getWorkflow('[workflow-name]');
    const workflowResult = await workflow.execute(validatedInput);

    // Or use tool directly
    const tool = mastra.getTool('[tool-name]');
    const toolResult = await tool.execute({ context: validatedInput });

    // Format response
    const response = {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    };

    return c.json(response);
  } catch (error) {
    // Handle different error types
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request format',
          details: error.errors,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      }, 400);
    }

    if (error instanceof MastraError) {
      return c.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      }, 500);
    }

    // Generic error handling
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }, 500);
  }
});

export default router;
```

## Common API Patterns

### 1. Agent Chat Endpoint
```typescript
// POST /api/agents/:agentId/chat
router.post('/api/agents/:agentId/chat', async (c) => {
  const agentId = c.req.param('agentId');

  const { message, threadId, options } = z.object({
    message: z.string().min(1),
    threadId: z.string().optional(),
    options: z.object({
      maxTokens: z.number().optional(),
      temperature: z.number().min(0).max(2).optional(),
    }).optional(),
  }).parse(await c.req.json());

  const agent = mastra.getAgent(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const result = await agent.generate([{
    role: 'user',
    content: message,
  }], {
    threadId: threadId || `thread_${Date.now()}`,
    ...options,
  });

  return c.json({
    response: result.text,
    threadId: threadId || `thread_${Date.now()}`,
    usage: result.usage,
  });
});
```

### 2. Workflow Execution Endpoint
```typescript
// POST /api/workflows/:workflowId/execute
router.post('/api/workflows/:workflowId/execute', async (c) => {
  const workflowId = c.req.param('workflowId');

  const { inputData, options } = z.object({
    inputData: z.any(),
    options: z.object({
      async: z.boolean().default(false),
      timeout: z.number().optional(),
    }).optional(),
  }).parse(await c.req.json());

  const workflow = mastra.getWorkflow(workflowId);
  if (!workflow) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  if (options?.async) {
    // Queue for async execution
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, use proper queue system
    return c.json({
      executionId,
      status: 'queued',
      workflowId,
      queuedAt: new Date().toISOString(),
    });
  }

  // Execute synchronously
  const result = await workflow.execute(inputData);

  return c.json({
    workflowId,
    status: 'completed',
    result,
    executedAt: new Date().toISOString(),
  });
});
```

### 3. Tool Execution Endpoint
```typescript
// POST /api/tools/:toolId/execute
router.post('/api/tools/:toolId/execute', async (c) => {
  const toolId = c.req.param('toolId');

  const { input, options } = z.object({
    input: z.any(),
    options: z.object({
      timeout: z.number().optional(),
    }).optional(),
  }).parse(await c.req.json());

  // Get tool from available tools
  const tool = getToolById(toolId);
  if (!tool) {
    return c.json({ error: 'Tool not found' }, 404);
  }

  const result = await tool.execute({ context: input });

  return c.json({
    toolId,
    input,
    output: result,
    executedAt: new Date().toISOString(),
  });
});
```

### 4. Resource Management Endpoints
```typescript
// GET /api/agents
router.get('/api/agents', (c) => {
  const agents = Object.entries(mastra.getAgents()).map(([id, agent]) => ({
    id,
    name: agent.name,
    description: agent.description,
    capabilities: {
      tools: Object.keys(agent.tools || {}),
      workflows: Object.keys(agent.workflows || {}),
      memory: !!agent.memory,
    },
  }));

  return c.json({
    agents,
    total: agents.length,
  });
});

// GET /api/workflows
router.get('/api/workflows', (c) => {
  const workflows = Object.entries(mastra.getWorkflows()).map(([id, workflow]) => ({
    id,
    description: workflow.description,
    inputSchema: workflow.inputSchema ? 'Defined' : 'None',
    outputSchema: workflow.outputSchema ? 'Defined' : 'None',
  }));

  return c.json({
    workflows,
    total: workflows.length,
  });
});
```

## Middleware Patterns

### 1. Authentication Middleware
```typescript
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const user = await validateToken(token);
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Apply to protected routes
router.use('/api/protected/*', authMiddleware);
```

### 2. Rate Limiting Middleware
```typescript
const rateLimitMiddleware = async (c: any, next: () => Promise<void>) => {
  const clientId = getClientId(c);
  const isLimited = await checkRateLimit(clientId);

  if (isLimited) {
    return c.json({
      error: 'Rate limit exceeded',
      retryAfter: 60,
    }, 429);
  }

  await next();
};

// Apply to all API routes
router.use('/api/*', rateLimitMiddleware);
```

### 3. Request Validation Middleware
```typescript
const validateRequest = (schema: z.ZodSchema) => {
  return async (c: any, next: () => Promise<void>) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedInput', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Validation failed',
          details: error.errors,
        }, 400);
      }
      throw error;
    }
  };
};

// Use with specific routes
router.post('/api/endpoint', validateRequest(requestSchema), async (c) => {
  const validatedInput = c.get('validatedInput');
  // Use validated input
});
```

### 4. Error Handling Middleware
```typescript
const errorHandler = async (error: Error, c: any) => {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return c.json({
      error: 'Validation error',
      details: error.errors,
    }, 400);
  }

  if (error instanceof MastraError) {
    return c.json({
      error: error.message,
      code: error.code,
    }, 500);
  }

  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  }, 500);
};

// Apply error handler
router.onError(errorHandler);
```

## Response Format Standards

### Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
    executionTime?: number;
  };
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

### Paginated Response
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

## Quality Checklist

### API Design
- [ ] RESTful route design
- [ ] Consistent HTTP status codes
- [ ] Comprehensive input validation
- [ ] Standardized response format
- [ ] Proper error handling
- [ ] Authentication/authorization as needed

### Integration
- [ ] Proper Mastra component usage
- [ ] Error handling for component failures
- [ ] Performance considerations
- [ ] Resource cleanup and management

### Security
- [ ] Input validation and sanitization
- [ ] Authentication middleware applied
- [ ] Authorization checks implemented
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Testing
- [ ] Unit tests for endpoint logic
- [ ] Integration tests with Mastra components
- [ ] Authentication/authorization tests
- [ ] Error handling tests
- [ ] Performance tests

### Documentation
- [ ] OpenAPI/Swagger documentation
- [ ] Request/response examples
- [ ] Error code documentation
- [ ] Authentication requirements documented

## File Locations

### API Implementation
- **Route Files**: `src/api/[feature]/[routes].ts`
- **Main API Router**: `src/api/index.ts`
- **Middleware**: `src/api/middleware/`

### Tests
- **Unit Tests**: `src/api/__tests__/[endpoint].test.ts`
- **Integration Tests**: `tests/integration/api/[endpoint].test.ts`

### Documentation
- **OpenAPI Spec**: `docs/api/openapi.yaml`
- **API Docs**: Update relevant API documentation

## Success Criteria

### Functional Success
- [ ] Endpoint functions correctly with valid inputs
- [ ] Proper integration with Mastra components
- [ ] Comprehensive error handling
- [ ] Authentication/authorization working
- [ ] Response format is consistent

### Code Quality Success
- [ ] Code follows project style guidelines
- [ ] Comprehensive test coverage
- [ ] Clear documentation
- [ ] No security vulnerabilities

### Performance Success
- [ ] Response times meet requirements
- [ ] Rate limiting works effectively
- [ ] No memory leaks
- [ ] Proper resource management

## Notes

### Important Considerations
- Follow RESTful conventions for route design
- Use consistent error handling and response formats
- Implement proper authentication and authorization
- Consider rate limiting and abuse prevention
- Ensure proper integration with Mastra components

### Common Pitfalls
- Inconsistent response formats
- Poor error handling
- Missing input validation
- Security vulnerabilities
- Not following REST conventions
- Improper status code usage