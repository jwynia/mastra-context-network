import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { mastra, healthCheck } from '../mastra';

/**
 * Main API application using Hono
 * This demonstrates how to expose Mastra functionality via HTTP APIs
 */
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : ['https://yourdomain.com'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', async (c) => {
  const health = await healthCheck();
  return c.json(health, health.status === 'healthy' ? 200 : 503);
});

// API information endpoint
app.get('/api', (c) => {
  return c.json({
    name: 'Mastra Application API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      agents: 'GET /api/agents',
      'agent-chat': 'POST /api/agents/:agentId/chat',
      workflows: 'GET /api/workflows',
      'workflow-execute': 'POST /api/workflows/:workflowId/execute',
      tools: 'GET /api/tools',
      'tool-execute': 'POST /api/tools/:toolId/execute',
    },
    documentation: '/docs',
  });
});

// Agents API
const agentsApi = new Hono();

// List all available agents
agentsApi.get('/', (c) => {
  const agentsList = Object.entries(mastra.getAgents()).map(([id, agent]) => ({
    id,
    name: agent.name,
    description: agent.description,
    capabilities: {
      tools: Object.keys(agent.tools || {}),
      workflows: Object.keys(agent.workflows || {}),
      memory: !!agent.memory,
      subAgents: Object.keys(agent.agents || {}),
    },
  }));

  return c.json({
    agents: agentsList,
    total: agentsList.length,
  });
});

// Get specific agent details
agentsApi.get('/:agentId', (c) => {
  const agentId = c.req.param('agentId');
  const agents = mastra.getAgents();

  if (!agents[agentId]) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const agent = agents[agentId];
  return c.json({
    id: agentId,
    name: agent.name,
    description: agent.description,
    capabilities: {
      tools: Object.keys(agent.tools || {}),
      workflows: Object.keys(agent.workflows || {}),
      memory: !!agent.memory,
      subAgents: Object.keys(agent.agents || {}),
    },
  });
});

// Chat with an agent
agentsApi.post('/:agentId/chat', async (c) => {
  const agentId = c.req.param('agentId');
  const agents = mastra.getAgents();

  if (!agents[agentId]) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  try {
    const body = await c.req.json();
    const { message, options } = z.object({
      message: z.string().min(1),
      options: z.object({
        threadId: z.string().optional(),
        maxTokens: z.number().optional(),
        temperature: z.number().min(0).max(2).optional(),
      }).optional(),
    }).parse(body);

    const agent = agents[agentId];

    // In a real implementation, you would use the agent's chat functionality
    // This is a mock response for demonstration
    const response = {
      agentId,
      message: `Mock response from ${agent.name} for: "${message}"`,
      timestamp: new Date().toISOString(),
      threadId: options?.threadId || `thread_${Date.now()}`,
      toolsUsed: [],
      workflowsExecuted: [],
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request format',
        details: error.errors,
      }, 400);
    }

    return c.json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.route('/api/agents', agentsApi);

// Workflows API
const workflowsApi = new Hono();

// List all available workflows
workflowsApi.get('/', (c) => {
  const workflows = mastra.getWorkflows();
  const workflowsList = Object.entries(workflows).map(([id, workflow]) => ({
    id,
    description: workflow.description,
    inputSchema: workflow.inputSchema ? 'Defined' : 'None',
    outputSchema: workflow.outputSchema ? 'Defined' : 'None',
  }));

  return c.json({
    workflows: workflowsList,
    total: workflowsList.length,
  });
});

// Execute a workflow
workflowsApi.post('/:workflowId/execute', async (c) => {
  const workflowId = c.req.param('workflowId');
  const workflows = mastra.getWorkflows();

  if (!workflows[workflowId]) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  try {
    const body = await c.req.json();
    const { inputData, options } = z.object({
      inputData: z.any(),
      options: z.object({
        async: z.boolean().default(false),
        timeout: z.number().optional(),
      }).optional(),
    }).parse(body);

    const workflow = workflows[workflowId];

    if (options?.async) {
      // Queue for async execution
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // In a real implementation, you would queue this properly
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request format',
        details: error.errors,
      }, 400);
    }

    return c.json({
      error: 'Workflow execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.route('/api/workflows', workflowsApi);

// Tools API
const toolsApi = new Hono();

// List all available tools
toolsApi.get('/', (c) => {
  // In a real implementation, you would extract this from the registered tools
  const tools = [
    {
      id: 'example-tool',
      description: 'Demonstrates basic tool creation with input validation and execution',
      inputSchema: {
        message: 'string',
        options: 'object (optional)',
      },
    },
    {
      id: 'weather-info',
      description: 'Fetches weather information for a given location',
      inputSchema: {
        location: 'string',
        units: 'celsius | fahrenheit',
      },
    },
    {
      id: 'data-processor',
      description: 'Processes and analyzes data arrays with various statistical operations',
      inputSchema: {
        data: 'number[]',
        operations: 'string[] (optional)',
      },
    },
    {
      id: 'async-task',
      description: 'Simulates a long-running async task with progress tracking',
      inputSchema: {
        duration: 'number (optional)',
        steps: 'number (optional)',
      },
    },
  ];

  return c.json({
    tools,
    total: tools.length,
  });
});

// Execute a tool directly
toolsApi.post('/:toolId/execute', async (c) => {
  const toolId = c.req.param('toolId');

  try {
    const body = await c.req.json();
    const { input, options } = z.object({
      input: z.any(),
      options: z.object({
        timeout: z.number().optional(),
      }).optional(),
    }).parse(body);

    // In a real implementation, you would get and execute the actual tool
    // This is a mock response for demonstration
    const result = {
      toolId,
      input,
      output: `Mock output from tool ${toolId}`,
      executedAt: new Date().toISOString(),
      executionTime: Math.floor(Math.random() * 1000) + 100,
    };

    return c.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request format',
        details: error.errors,
      }, 400);
    }

    return c.json({
      error: 'Tool execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.route('/api/tools', toolsApi);

// Protected routes (example)
const protectedApi = new Hono();

// Middleware for authentication (only if AUTH_ENABLED is true)
if (process.env.AUTH_ENABLED === 'true') {
  protectedApi.use('*', async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // In a real application, you would validate the JWT token here
    const token = authHeader.substring(7);
    if (token === 'invalid-token') {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Add user info to context
    c.set('user', { id: 'user123', name: 'Test User' });
    await next();
  });
}

// Protected endpoint example
protectedApi.get('/profile', (c) => {
  const user = c.get('user');
  return c.json({
    user,
    message: 'This is a protected endpoint',
    timestamp: new Date().toISOString(),
  });
});

app.route('/api/protected', protectedApi);

// Error handling middleware
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    available: '/api',
  }, 404);
});

export default app;