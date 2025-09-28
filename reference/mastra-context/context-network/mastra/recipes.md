# Mastra Code Recipes

Quick code snippets for common Mastra development tasks.

## Tool Recipes

### Basic Tool Template
```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const templateTool = createTool({
  id: 'template-tool',
  description: 'Clear description of what this tool does',
  inputSchema: z.object({
    requiredParam: z.string().describe('Description for AI understanding'),
    optionalParam: z.number().optional().describe('Optional parameter'),
    configParam: z.object({
      enabled: z.boolean().default(true),
      threshold: z.number().min(0).max(100).default(50),
    }).optional(),
  }),
  execute: async ({ context }) => {
    // Destructure validated input
    const { requiredParam, optionalParam, configParam } = context;

    try {
      // Tool logic here
      const result = await performOperation(requiredParam, {
        optional: optionalParam,
        config: configParam,
      });

      return {
        success: true,
        data: result,
        metadata: {
          processedAt: new Date().toISOString(),
          inputSize: requiredParam.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: error.message,
          retryable: isRetryableError(error),
        },
      };
    }
  },
});
```

### API Integration Tool
```typescript
export const apiIntegrationTool = createTool({
  id: 'api-integration',
  description: 'Integrates with external API service',
  inputSchema: z.object({
    endpoint: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
    timeout: z.number().default(30000),
  }),
  execute: async ({ context }) => {
    const { endpoint, method, headers, body, timeout } = context;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            status: response.status,
            statusText: response.statusText,
          },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metadata: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: {
          code: error.name === 'AbortError' ? 'TIMEOUT' : 'REQUEST_FAILED',
          message: error.message,
        },
      };
    }
  },
});
```

### Data Processing Tool
```typescript
export const dataProcessingTool = createTool({
  id: 'data-processor',
  description: 'Processes arrays of data with configurable operations',
  inputSchema: z.object({
    data: z.array(z.any()),
    operations: z.array(z.enum([
      'filter', 'map', 'reduce', 'sort', 'group', 'aggregate'
    ])),
    config: z.object({
      filterFn: z.string().optional(), // JavaScript function as string
      mapFn: z.string().optional(),
      sortBy: z.string().optional(),
      groupBy: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    const { data, operations, config } = context;
    let result = [...data];
    const appliedOperations: string[] = [];

    for (const operation of operations) {
      switch (operation) {
        case 'filter':
          if (config?.filterFn) {
            const filterFunction = new Function('item', `return ${config.filterFn}`);
            result = result.filter(filterFunction);
            appliedOperations.push(`filter(${config.filterFn})`);
          }
          break;

        case 'map':
          if (config?.mapFn) {
            const mapFunction = new Function('item', `return ${config.mapFn}`);
            result = result.map(mapFunction);
            appliedOperations.push(`map(${config.mapFn})`);
          }
          break;

        case 'sort':
          if (config?.sortBy) {
            result = result.sort((a, b) => {
              const aVal = a[config.sortBy];
              const bVal = b[config.sortBy];
              return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            });
            appliedOperations.push(`sort(${config.sortBy})`);
          }
          break;

        case 'group':
          if (config?.groupBy) {
            const grouped = result.reduce((acc, item) => {
              const key = item[config.groupBy];
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
            }, {});
            result = Object.entries(grouped).map(([key, items]) => ({
              [config.groupBy]: key,
              items,
              count: items.length,
            }));
            appliedOperations.push(`group(${config.groupBy})`);
          }
          break;
      }
    }

    return {
      success: true,
      data: result,
      metadata: {
        originalCount: data.length,
        resultCount: result.length,
        operations: appliedOperations,
      },
    };
  },
});
```

## Agent Recipes

### Basic Agent Template
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';

export const templateAgent = new Agent({
  name: 'Template Agent',
  description: 'A template agent demonstrating best practices',
  instructions: `
    You are a helpful assistant with the following capabilities:

    ## Your Role
    - [Define the agent's primary purpose]
    - [Explain when this agent should be used]

    ## Available Tools
    - toolName: Use for [specific purpose]
    - anotherTool: Use when [specific condition]

    ## Behavior Guidelines
    - Always validate inputs before processing
    - Provide clear explanations of your actions
    - Ask for clarification when requests are ambiguous
    - Use tools when appropriate to provide accurate information

    ## Response Format
    - Be concise but thorough
    - Structure responses clearly
    - Include relevant metadata when helpful
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    // Add relevant tools
  },
  workflows: {
    // Add relevant workflows
  },
  memory: new Memory({
    maxTokens: 8000,
    maxMessages: 20,
  }),
});
```

### Specialized Data Agent
```typescript
export const dataAnalystAgent = new Agent({
  name: 'Data Analyst',
  description: 'Specialized agent for data analysis and insights',
  instructions: `
    You are a data analysis specialist with expertise in:
    - Statistical analysis and data processing
    - Data validation and quality assessment
    - Generating insights and recommendations
    - Creating data summaries and reports

    When analyzing data:
    1. Always validate data quality first using the dataValidationTool
    2. Use appropriate statistical methods based on data type
    3. Provide clear interpretations of results
    4. Highlight any limitations or assumptions
    5. Suggest actionable next steps

    Available Analysis Types:
    - Descriptive statistics (mean, median, mode, std dev)
    - Correlation analysis
    - Trend identification
    - Outlier detection
    - Data quality assessment
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    dataProcessingTool,
    statisticalAnalysisTool,
    dataValidationTool,
    visualizationTool,
  },
  workflows: {
    dataAnalysisWorkflow,
    reportGenerationWorkflow,
  },
  memory: new Memory(),
});
```

### Coordinator Agent with Sub-agents
```typescript
export const coordinatorAgent = new Agent({
  name: 'Project Coordinator',
  description: 'Coordinates complex tasks across multiple specialized agents',
  instructions: `
    You are a project coordinator responsible for:
    - Breaking down complex requests into subtasks
    - Delegating to appropriate specialist agents
    - Coordinating work across multiple agents
    - Synthesizing results into cohesive responses

    Available Specialists:
    - dataAnalyst: For data processing and statistical analysis
    - contentWriter: For text generation and content creation
    - technicalReviewer: For code review and technical assessment

    Coordination Process:
    1. Analyze the incoming request
    2. Identify required expertise areas
    3. Delegate subtasks to appropriate specialists
    4. Monitor progress and coordinate between agents
    5. Synthesize results into a unified response

    Always explain your delegation strategy and provide status updates.
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    taskPlanningTool,
    progressTrackingTool,
    resultSynthesisTool,
  },
  agents: {
    dataAnalyst: dataAnalystAgent,
    contentWriter: contentWriterAgent,
    technicalReviewer: technicalReviewerAgent,
  },
  memory: new Memory(),
});
```

## Workflow Recipes

### Basic Workflow Template
```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

export const templateWorkflow = createWorkflow({
  id: 'template-workflow',
  description: 'Template workflow demonstrating best practices',
  inputSchema: z.object({
    input: z.any(),
    options: z.object({
      validateInput: z.boolean().default(true),
      includeMetadata: z.boolean().default(true),
    }).optional(),
  }),
  outputSchema: z.object({
    result: z.any(),
    metadata: z.object({
      stepsExecuted: z.array(z.string()),
      executionTime: z.number(),
      processedAt: z.string(),
    }),
  }),
});

const step1 = createStep({
  id: 'validation-step',
  description: 'Validates input data',
  inputSchema: z.object({
    input: z.any(),
    options: z.object({
      validateInput: z.boolean(),
    }).optional(),
  }),
  outputSchema: z.object({
    validatedInput: z.any(),
    validationErrors: z.array(z.string()).optional(),
  }),
  execute: async ({ inputData }) => {
    const { input, options } = inputData;

    if (!options?.validateInput) {
      return { validatedInput: input };
    }

    // Validation logic
    const errors: string[] = [];
    if (!input) errors.push('Input is required');

    return {
      validatedInput: input,
      ...(errors.length > 0 && { validationErrors: errors }),
    };
  },
});

const step2 = createStep({
  id: 'processing-step',
  description: 'Processes validated input',
  inputSchema: z.object({
    validatedInput: z.any(),
    validationErrors: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    processedData: z.any(),
    processingMetadata: z.object({
      itemsProcessed: z.number(),
      processingTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { validatedInput, validationErrors } = inputData;

    if (validationErrors?.length) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const startTime = Date.now();

    // Processing logic
    const processedData = await processData(validatedInput);

    return {
      processedData,
      processingMetadata: {
        itemsProcessed: Array.isArray(processedData) ? processedData.length : 1,
        processingTime: Date.now() - startTime,
      },
    };
  },
});

const step3 = createStep({
  id: 'finalization-step',
  description: 'Finalizes results and adds metadata',
  inputSchema: z.object({
    processedData: z.any(),
    processingMetadata: z.object({
      itemsProcessed: z.number(),
      processingTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    result: z.any(),
    metadata: z.object({
      stepsExecuted: z.array(z.string()),
      executionTime: z.number(),
      processedAt: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { processedData, processingMetadata } = inputData;

    return {
      result: processedData,
      metadata: {
        stepsExecuted: ['validation-step', 'processing-step', 'finalization-step'],
        executionTime: processingMetadata.processingTime,
        processedAt: new Date().toISOString(),
      },
    };
  },
});

templateWorkflow
  .then(step1)
  .then(step2)
  .then(step3)
  .commit();
```

### Parallel Processing Workflow
```typescript
export const parallelProcessingWorkflow = createWorkflow({
  id: 'parallel-processing',
  description: 'Processes multiple data streams in parallel',
  inputSchema: z.object({
    datasets: z.array(z.object({
      id: z.string(),
      data: z.array(z.any()),
      processingType: z.enum(['analyze', 'transform', 'validate']),
    })),
    concurrency: z.number().min(1).max(10).default(3),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      datasetId: z.string(),
      success: z.boolean(),
      result: z.any().optional(),
      error: z.string().optional(),
    })),
    summary: z.object({
      totalDatasets: z.number(),
      successful: z.number(),
      failed: z.number(),
    }),
  }),
});

const parallelProcessingStep = createStep({
  id: 'parallel-processing',
  description: 'Process multiple datasets concurrently',
  inputSchema: z.object({
    datasets: z.array(z.object({
      id: z.string(),
      data: z.array(z.any()),
      processingType: z.enum(['analyze', 'transform', 'validate']),
    })),
    concurrency: z.number(),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      datasetId: z.string(),
      success: z.boolean(),
      result: z.any().optional(),
      error: z.string().optional(),
    })),
    summary: z.object({
      totalDatasets: z.number(),
      successful: z.number(),
      failed: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { datasets, concurrency } = inputData;

    // Process datasets in batches
    const results: any[] = [];
    const chunks = chunkArray(datasets, concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(async (dataset) => {
          try {
            const result = await processDataset(dataset);
            return {
              datasetId: dataset.id,
              success: true,
              result,
            };
          } catch (error) {
            return {
              datasetId: dataset.id,
              success: false,
              error: error.message,
            };
          }
        })
      );

      results.push(...chunkResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      results,
      summary: {
        totalDatasets: datasets.length,
        successful,
        failed,
      },
    };
  },
});

parallelProcessingWorkflow.then(parallelProcessingStep).commit();
```

## MCP Server Recipes

### Basic MCP Server
```typescript
import { MCPServer, MCPServerResources } from '@mastra/mcp';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const appResources: MCPServerResources = {
  listResources: async () => [
    {
      uri: 'app://status',
      name: 'Application Status',
      description: 'Current application status and health',
      mimeType: 'application/json',
    },
    {
      uri: 'app://metrics',
      name: 'Performance Metrics',
      description: 'Application performance metrics',
      mimeType: 'application/json',
    },
  ],

  getResourceContent: async ({ uri }) => {
    switch (uri) {
      case 'app://status':
        return [{
          text: JSON.stringify({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          }),
        }];

      case 'app://metrics':
        return [{
          text: JSON.stringify({
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            timestamp: new Date().toISOString(),
          }),
        }];

      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  },
};

export const basicMCPServer = new MCPServer({
  name: 'Basic MCP Server',
  version: '1.0.0',
  resources: appResources,
  tools: {
    ping: createTool({
      id: 'ping',
      description: 'Simple ping tool for testing connectivity',
      inputSchema: z.object({
        message: z.string().default('ping'),
      }),
      execute: async ({ context }) => ({
        response: `pong: ${context.message}`,
        timestamp: new Date().toISOString(),
      }),
    }),

    systemInfo: createTool({
      id: 'system-info',
      description: 'Get system information',
      inputSchema: z.object({
        includeDetails: z.boolean().default(false),
      }),
      execute: async ({ context }) => {
        const basic = {
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime(),
        };

        if (context.includeDetails) {
          return {
            ...basic,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            env: process.env.NODE_ENV,
          };
        }

        return basic;
      },
    }),
  },
});
```

### MCP Server with Agent Exposure
```typescript
export const agentMCPServer = new MCPServer({
  name: 'Agent MCP Server',
  version: '1.0.0',
  agents: {
    assistant: assistantAgent,
    analyst: dataAnalystAgent,
  },
  workflows: {
    dataProcessing: dataProcessingWorkflow,
  },
  tools: {
    executeAgent: createTool({
      id: 'execute-agent',
      description: 'Execute an agent with provided input',
      inputSchema: z.object({
        agentId: z.enum(['assistant', 'analyst']),
        message: z.string(),
        options: z.object({
          threadId: z.string().optional(),
          maxTokens: z.number().optional(),
        }).optional(),
      }),
      execute: async ({ context }) => {
        const { agentId, message, options } = context;

        try {
          // Get agent from registry
          const agent = agents[agentId];

          // Execute agent
          const result = await agent.generate([{
            role: 'user',
            content: message,
          }], options);

          return {
            success: true,
            agentId,
            response: result.text,
            metadata: {
              tokensUsed: result.usage?.totalTokens,
              model: result.model,
            },
          };
        } catch (error) {
          return {
            success: false,
            agentId,
            error: error.message,
          };
        }
      },
    }),
  },
});
```

## API Integration Recipes

### Hono API Setup
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : ['https://yourdomain.com'],
  credentials: true,
}));

// Health check
app.get('/health', async (c) => {
  const health = await healthCheck();
  return c.json(health, health.status === 'healthy' ? 200 : 503);
});

// Agent chat endpoint
app.post('/api/agents/:agentId/chat', async (c) => {
  const agentId = c.req.param('agentId');

  try {
    const body = await c.req.json();
    const { message, threadId, options } = z.object({
      message: z.string().min(1),
      threadId: z.string().optional(),
      options: z.object({
        maxTokens: z.number().optional(),
        temperature: z.number().min(0).max(2).optional(),
      }).optional(),
    }).parse(body);

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request format',
        details: error.errors,
      }, 400);
    }

    return c.json({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
});

// Workflow execution endpoint
app.post('/api/workflows/:workflowId/execute', async (c) => {
  const workflowId = c.req.param('workflowId');

  try {
    const body = await c.req.json();
    const { inputData, options } = z.object({
      inputData: z.any(),
      options: z.object({
        async: z.boolean().default(false),
      }).optional(),
    }).parse(body);

    const workflow = mastra.getWorkflow(workflowId);
    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }

    if (options?.async) {
      // Queue for async execution
      const executionId = `exec_${Date.now()}`;
      // In production, use a proper queue system
      return c.json({
        executionId,
        status: 'queued',
        workflowId,
      });
    }

    const result = await workflow.execute(inputData);
    return c.json({
      workflowId,
      status: 'completed',
      result,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      error: 'Workflow execution failed',
      message: error.message,
    }, 500);
  }
});

export default app;
```

## Utility Recipes

### Retry with Backoff
```typescript
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;

  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i === retries) break;

      if (onRetry) {
        onRetry(lastError, i + 1);
      }

      await sleep(delay * Math.pow(backoff, i));
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Environment Configuration
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  OPENAI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().default('file:./mastra.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  TELEMETRY_ENABLED: z.string().transform(val => val === 'true').default('false'),
});

export function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = parseEnv();
```

### Testing Utilities
```typescript
// Test helpers for Mastra components
export function createTestMastra(overrides: Partial<MastraConfig> = {}) {
  return new Mastra({
    storage: new InMemoryStorage(),
    logger: false, // Disable logging in tests
    ...overrides,
  });
}

export function createMockTool(
  id: string,
  mockResponse: any = { success: true }
) {
  return createTool({
    id,
    description: `Mock tool for testing: ${id}`,
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

export function createTestAgent(
  name: string,
  tools: Record<string, any> = {}
) {
  return new Agent({
    name,
    description: `Test agent: ${name}`,
    instructions: 'Test agent for unit testing',
    model: mockModel, // Use a mock model for testing
    tools,
    memory: new Memory({ storage: new InMemoryStorage() }),
  });
}
```

## See Also

- [[patterns.md]] - Understanding the patterns behind these recipes
- [[architecture.md]] - Architectural context for implementation choices
- [[troubleshooting.md]] - Debugging when recipes don't work as expected