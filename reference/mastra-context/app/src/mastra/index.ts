import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { agents } from './agents';
import { workflows } from './workflows';
import { mcpServers } from './mcp';
import { createScorer } from '@mastra/core/scores';

/**
 * Initialize storage layer
 * Using LibSQL for local development with SQLite file
 * In production, you might use a different storage provider
 */
const storage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./mastra.db',
});

/**
 * Example scorer for evaluation and monitoring
 * Scorers help track agent performance and quality metrics
 */
const qualityScorer = createScorer({
  name: 'response-quality',
  description: 'Evaluates the quality of agent responses',
}).generateScore((input: { response: string; context: string }) => {
  // Simple quality scoring logic - in practice, this would be more sophisticated
  const { response, context } = input;

  let score = 0.5; // Base score

  // Length check
  if (response.length > 10 && response.length < 1000) {
    score += 0.2;
  }

  // Relevance check (very basic)
  if (context && response.toLowerCase().includes(context.toLowerCase().split(' ')[0])) {
    score += 0.2;
  }

  // Structure check
  if (response.includes('.') || response.includes('!') || response.includes('?')) {
    score += 0.1;
  }

  return Math.min(1.0, score);
});

/**
 * Main Mastra application configuration
 * This is the central orchestration hub for your AI application
 */
export const mastra = new Mastra({
  // Register all agents
  agents: {
    ...agents,
  },

  // Register all workflows
  workflows: {
    ...workflows,
  },

  // Storage configuration
  storage,

  // Logger configuration
  logger: new PinoLogger({
    name: 'mastra-app',
    level: (process.env.LOG_LEVEL as any) || 'info',
  }),

  // MCP servers for external integration
  mcpServers: {
    main: mcpServers.mastraApp,
    ...(process.env.NODE_ENV === 'development' && {
      dev: mcpServers.dev,
    }),
  },

  // Scoring and evaluation
  scorers: {
    qualityScorer,
  },

  // Server configuration
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,

    // Add custom middleware
    middleware: [
      {
        handler: async (c, next) => {
          // Request logging middleware
          const start = Date.now();
          console.log(`${c.req.method} ${c.req.url} - Request started`);

          await next();

          const duration = Date.now() - start;
          console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`);
        },
        path: '/api/*',
      },

      // Authentication middleware (optional)
      ...(process.env.AUTH_ENABLED === 'true' ? [{
        handler: async (c: any, next: () => Promise<void>) => {
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
        },
        path: '/api/protected/*',
      }] : []),

      // Rate limiting middleware (basic implementation)
      {
        handler: async (c: any, next: () => Promise<void>) => {
          const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
          const rateLimit = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100');

          // In a real application, you would use a proper rate limiting store (Redis, etc.)
          // This is a simplified in-memory implementation for demonstration
          const now = Date.now();
          const windowMs = 60 * 1000; // 1 minute

          // Simple rate limiting logic would go here
          console.log(`Rate limit check for ${clientIp}: ${rateLimit} requests per minute`);

          await next();
        },
        path: '/api/*',
      },
    ],

    // CORS configuration
    cors: {
      origin: process.env.NODE_ENV === 'development' ? true : [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
      ],
      credentials: true,
    },
  },

  // Bundler configuration for deployment
  bundler: {
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    // External dependencies that shouldn't be bundled
    external: [],
  },

  // Telemetry and observability (optional)
  ...(process.env.TELEMETRY_ENABLED === 'true' && {
    telemetry: {
      enabled: true,
      serviceName: 'mastra-app',
      serviceVersion: '1.0.0',
      ...(process.env.OTEL_EXPORTER_OTLP_ENDPOINT && {
        otlp: {
          endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        },
      }),
    },
  }),

  // Development-specific configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Development event handlers for debugging
    events: {
      'agent:*': async (event) => {
        console.log('Agent event:', event.type, event.data);
      },
      'workflow:*': async (event) => {
        console.log('Workflow event:', event.type, event.data);
      },
      'tool:*': async (event) => {
        console.log('Tool event:', event.type, event.data);
      },
    },
  }),
});

// Export individual components for use in API routes or other modules
export { agents, workflows, mcpServers, storage };

// Helper function to get agent by name with type safety
export function getAgent<T extends keyof typeof agents>(name: T): typeof agents[T] {
  return agents[name];
}

// Helper function to get workflow by name with type safety
export function getWorkflow<T extends keyof typeof workflows>(name: T): typeof workflows[T] {
  return workflows[name];
}

// Health check function for monitoring
export async function healthCheck() {
  try {
    // Check storage connectivity
    await storage.get('health-check');

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        storage: 'healthy',
        agents: Object.keys(agents).length,
        workflows: Object.keys(workflows).length,
        mcpServers: Object.keys(mcpServers).length,
      },
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  }
}