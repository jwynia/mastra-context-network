import { MCPServer, MCPServerResources } from '@mastra/mcp';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { agents } from '../agents';
import { workflows } from '../workflows';

/**
 * Resources for the MCP server
 * Resources provide structured data that can be accessed by MCP clients
 */
const applicationResources: MCPServerResources = {
  listResources: async () => {
    return [
      {
        uri: 'app://status',
        name: 'Application Status',
        description: 'Current status of the Mastra application',
        mimeType: 'application/json',
      },
      {
        uri: 'app://agents',
        name: 'Available Agents',
        description: 'List of all available agents and their capabilities',
        mimeType: 'application/json',
      },
      {
        uri: 'app://tools',
        name: 'Available Tools',
        description: 'List of all available tools and their schemas',
        mimeType: 'application/json',
      },
      {
        uri: 'app://workflows',
        name: 'Available Workflows',
        description: 'List of all available workflows and their configurations',
        mimeType: 'application/json',
      },
    ];
  },

  getResourceContent: async ({ uri }) => {
    switch (uri) {
      case 'app://status':
        return [
          {
            text: JSON.stringify({
              status: 'healthy',
              version: '1.0.0',
              uptime: process.uptime(),
              timestamp: new Date().toISOString(),
              environment: process.env.NODE_ENV || 'development',
              features: {
                agents: Object.keys(agents).length,
                workflows: Object.keys(workflows).length,
                memory: true,
                telemetry: !!process.env.TELEMETRY_ENABLED,
              },
            }, null, 2),
          },
        ];

      case 'app://agents':
        return [
          {
            text: JSON.stringify({
              agents: Object.entries(agents).map(([key, agent]) => ({
                id: key,
                name: agent.name,
                description: agent.description,
                capabilities: {
                  tools: Object.keys(agent.tools || {}),
                  workflows: Object.keys(agent.workflows || {}),
                  memory: !!agent.memory,
                  subAgents: Object.keys(agent.agents || {}),
                },
              })),
              total: Object.keys(agents).length,
            }, null, 2),
          },
        ];

      case 'app://tools':
        return [
          {
            text: JSON.stringify({
              tools: [
                {
                  id: 'example-tool',
                  description: 'Demonstrates basic tool creation with input validation',
                  inputSchema: 'message: string, options?: {uppercase?: boolean, reverse?: boolean}',
                },
                {
                  id: 'weather-info',
                  description: 'Fetches weather information for a given location',
                  inputSchema: 'location: string, units?: "celsius" | "fahrenheit"',
                },
                {
                  id: 'data-processor',
                  description: 'Processes and analyzes data arrays with statistical operations',
                  inputSchema: 'data: number[], operations?: string[]',
                },
                {
                  id: 'async-task',
                  description: 'Simulates long-running async task with progress tracking',
                  inputSchema: 'duration?: number, steps?: number',
                },
              ],
              total: 4,
            }, null, 2),
          },
        ];

      case 'app://workflows':
        return [
          {
            text: JSON.stringify({
              workflows: [
                {
                  id: 'data-processing-pipeline',
                  description: 'Processes raw data through validation, transformation, and analysis',
                  steps: ['validate-data', 'transform-data', 'generate-analytics'],
                  inputSchema: 'rawData: any[], processingOptions?: object',
                },
                {
                  id: 'conditional-processing',
                  description: 'Demonstrates conditional workflow execution based on input parameters',
                  steps: ['conditional-processing'],
                  inputSchema: 'data: any, processingType: "simple" | "complex" | "batch"',
                },
              ],
              total: 2,
            }, null, 2),
          },
        ];

      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  },

  resourceTemplates: async () => {
    return [
      {
        uriTemplate: 'app://agents/{agentId}/status',
        name: 'Agent Status',
        description: 'Get status information for a specific agent',
        mimeType: 'application/json',
      },
      {
        uriTemplate: 'app://workflows/{workflowId}/schema',
        name: 'Workflow Schema',
        description: 'Get detailed schema information for a specific workflow',
        mimeType: 'application/json',
      },
    ];
  },
};

/**
 * Main MCP Server for exposing Mastra application functionality
 * This server provides access to agents, workflows, and tools via MCP protocol
 */
export const mastraAppMCPServer = new MCPServer({
  name: 'Mastra Application MCP Server',
  version: '1.0.0',

  // Expose selected agents via MCP
  agents: {
    assistant: agents.assistantAgent,
    dataAnalyst: agents.dataAnalystAgent,
    coordinator: agents.coordinatorAgent,
  },

  // Expose workflows via MCP
  workflows: {
    dataProcessing: workflows.dataProcessingWorkflow,
    conditionalProcessing: workflows.conditionalWorkflow,
  },

  // Provide application resources
  resources: applicationResources,

  // MCP-specific tools for server management and introspection
  tools: {
    serverInfo: createTool({
      id: 'server-info',
      description: 'Get comprehensive information about the MCP server and its capabilities',
      inputSchema: z.object({
        includeDetails: z.boolean().default(false).describe('Include detailed configuration information'),
      }),
      execute: async ({ context }) => {
        const basic = {
          name: 'Mastra Application MCP Server',
          version: '1.0.0',
          capabilities: {
            agents: Object.keys(agents).length,
            workflows: Object.keys(workflows).length,
            tools: 4,
            resources: 4,
          },
          status: 'running',
          timestamp: new Date().toISOString(),
        };

        if (!context.includeDetails) {
          return basic;
        }

        return {
          ...basic,
          details: {
            agents: Object.keys(agents),
            workflows: Object.keys(workflows),
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
          },
        };
      },
    }),

    healthCheck: createTool({
      id: 'health-check',
      description: 'Perform a health check on the application and its dependencies',
      inputSchema: z.object({
        checkDependencies: z.boolean().default(true).describe('Check external dependencies'),
      }),
      execute: async ({ context }) => {
        const checks = {
          server: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        };

        if (context.checkDependencies) {
          // In a real application, you would check database connectivity, external APIs, etc.
          return {
            ...checks,
            dependencies: {
              database: 'healthy',
              openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
              memory: 'healthy',
            },
          };
        }

        return checks;
      },
    }),

    executeWorkflow: createTool({
      id: 'execute-workflow',
      description: 'Execute a specific workflow with provided input data',
      inputSchema: z.object({
        workflowId: z.enum(['dataProcessing', 'conditionalProcessing']).describe('The workflow to execute'),
        inputData: z.any().describe('Input data for the workflow'),
        options: z.object({
          async: z.boolean().default(false).describe('Execute workflow asynchronously'),
        }).optional(),
      }),
      execute: async ({ context }) => {
        const { workflowId, inputData, options } = context;

        try {
          const workflow = workflows[workflowId === 'dataProcessing' ? 'dataProcessingWorkflow' : 'conditionalWorkflow'];

          if (options?.async) {
            // In a real implementation, you would queue the workflow for async execution
            return {
              workflowId,
              status: 'queued',
              executionId: `exec_${Date.now()}`,
              message: 'Workflow queued for asynchronous execution',
            };
          }

          // Execute synchronously (note: this is a simplified example)
          const result = await workflow.execute(inputData);

          return {
            workflowId,
            status: 'completed',
            result,
            executedAt: new Date().toISOString(),
          };
        } catch (error) {
          return {
            workflowId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
          };
        }
      },
    }),
  },
});

/**
 * Development MCP Server for testing and debugging
 * Provides additional tools for development workflows
 */
export const devMCPServer = new MCPServer({
  name: 'Mastra Development MCP Server',
  version: '1.0.0',

  tools: {
    generateMockData: createTool({
      id: 'generate-mock-data',
      description: 'Generate mock data for testing workflows and agents',
      inputSchema: z.object({
        type: z.enum(['users', 'orders', 'products', 'events']).describe('Type of mock data to generate'),
        count: z.number().min(1).max(1000).default(10).describe('Number of records to generate'),
        includeInvalid: z.boolean().default(false).describe('Include some invalid records for testing'),
      }),
      execute: async ({ context }) => {
        const { type, count, includeInvalid } = context;
        const mockData: any[] = [];

        for (let i = 0; i < count; i++) {
          let record;

          switch (type) {
            case 'users':
              record = {
                id: `user_${i + 1}`,
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                age: Math.floor(Math.random() * 50) + 18,
                createdAt: new Date().toISOString(),
              };
              break;
            case 'orders':
              record = {
                id: `order_${i + 1}`,
                userId: `user_${Math.floor(Math.random() * 100) + 1}`,
                amount: Math.floor(Math.random() * 1000) + 10,
                currency: 'USD',
                status: ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)],
                orderDate: new Date().toISOString(),
              };
              break;
            case 'products':
              record = {
                id: `product_${i + 1}`,
                name: `Product ${i + 1}`,
                price: Math.floor(Math.random() * 500) + 10,
                category: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)],
                inStock: Math.random() > 0.2,
                createdAt: new Date().toISOString(),
              };
              break;
            case 'events':
              record = {
                id: `event_${i + 1}`,
                type: ['click', 'view', 'purchase', 'signup'][Math.floor(Math.random() * 4)],
                userId: `user_${Math.floor(Math.random() * 100) + 1}`,
                timestamp: new Date().toISOString(),
                metadata: { sessionId: `session_${Math.floor(Math.random() * 1000)}` },
              };
              break;
          }

          // Occasionally add invalid records if requested
          if (includeInvalid && Math.random() < 0.1) {
            record = Math.random() > 0.5 ? null : { invalid: true };
          }

          mockData.push(record);
        }

        return {
          type,
          count: mockData.length,
          data: mockData,
          generatedAt: new Date().toISOString(),
        };
      },
    }),

    testAgent: createTool({
      id: 'test-agent',
      description: 'Test an agent with provided input and return execution details',
      inputSchema: z.object({
        agentId: z.enum(['assistant', 'dataAnalyst', 'automationSpecialist', 'coordinator']).describe('Agent to test'),
        message: z.string().describe('Test message to send to the agent'),
        includeMetrics: z.boolean().default(false).describe('Include performance metrics'),
      }),
      execute: async ({ context }) => {
        const { agentId, message, includeMetrics } = context;
        const startTime = Date.now();

        try {
          const agent = agents[agentId === 'assistant' ? 'assistantAgent' :
                             agentId === 'dataAnalyst' ? 'dataAnalystAgent' :
                             agentId === 'automationSpecialist' ? 'automationAgent' :
                             'coordinatorAgent'];

          // In a real implementation, you would execute the agent
          // This is a mock response for demonstration
          const mockResponse = {
            response: `Mock response from ${agent.name} for: "${message}"`,
            agentName: agent.name,
            toolsUsed: [],
            workflowsExecuted: [],
          };

          const executionTime = Date.now() - startTime;

          const result = {
            agentId,
            success: true,
            response: mockResponse,
            executedAt: new Date().toISOString(),
          };

          if (includeMetrics) {
            return {
              ...result,
              metrics: {
                executionTime,
                memoryUsage: process.memoryUsage(),
                agentCapabilities: {
                  tools: Object.keys(agent.tools || {}),
                  workflows: Object.keys(agent.workflows || {}),
                  hasMemory: !!agent.memory,
                },
              },
            };
          }

          return result;
        } catch (error) {
          return {
            agentId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executedAt: new Date().toISOString(),
          };
        }
      },
    }),
  },
});

export const mcpServers = {
  mastraApp: mastraAppMCPServer,
  dev: devMCPServer,
} as const;