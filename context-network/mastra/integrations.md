# Mastra Integration Patterns Guide

## Overview

This guide covers patterns for integrating Mastra applications with third-party services, handling authentication, managing webhooks, and creating reusable integration patterns.

## Integration Architecture

### Integration Types in Mastra

1. **Tool-Based Integrations** - Simple API calls wrapped as Mastra tools
2. **OpenAPI Integrations** - Auto-generated from OpenAPI/Swagger specs
3. **SDK-Based Integrations** - Using vendor SDKs within tools
4. **Webhook Integrations** - Receiving real-time events from external services
5. **OAuth Integrations** - User-authenticated third-party access

## Tool-Based Integration Patterns

### Basic HTTP API Integration

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const weatherApiTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name or coordinates'),
    units: z.enum(['metric', 'imperial']).default('metric'),
  }),
  execute: async ({ context }) => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Weather API key not configured',
      };
    }

    try {
      const response = await fetch(
        `https://api.weather.com/v1/current?` +
        `location=${encodeURIComponent(context.location)}` +
        `&units=${context.units}` +
        `&apiKey=${apiKey}`
      );

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        temperature: data.temperature,
        conditions: data.conditions,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        location: context.location,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
```

### SDK-Based Integration Pattern

```typescript
import { Octokit } from '@octokit/rest';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Initialize SDK client
const createGitHubClient = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

export const githubCreateIssueTool = createTool({
  id: 'github-create-issue',
  description: 'Create a GitHub issue in a repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or org)'),
    repo: z.string().describe('Repository name'),
    title: z.string().describe('Issue title'),
    body: z.string().optional().describe('Issue description'),
    labels: z.array(z.string()).optional().describe('Labels to add'),
    assignees: z.array(z.string()).optional().describe('Users to assign'),
  }),
  execute: async ({ context }) => {
    try {
      const github = createGitHubClient();

      const { data: issue } = await github.issues.create({
        owner: context.owner,
        repo: context.repo,
        title: context.title,
        body: context.body,
        labels: context.labels,
        assignees: context.assignees,
      });

      return {
        success: true,
        issue: {
          number: issue.number,
          url: issue.html_url,
          state: issue.state,
          createdAt: issue.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.status,
      };
    }
  },
});

// Create a toolset for related GitHub operations
export const githubTools = {
  createIssue: githubCreateIssueTool,
  // Additional related tools...
};
```

### Retry and Rate Limiting for Integrations

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Retry utility for transient failures
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  }
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError!;
}

// Rate limiter implementation
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxTokens: number, refillPerSecond: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = refillPerSecond;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait for token refill
    const waitTime = (1 - this.tokens) / this.refillRate * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + timePassed * this.refillRate
    );
    this.lastRefill = now;
  }
}

// Apply to integration tool
const apiRateLimiter = new RateLimiter(100, 10); // 100 max, 10/second

export const rateLimitedApiTool = createTool({
  id: 'api-call',
  description: 'Make rate-limited API call',
  inputSchema: z.object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    body: z.any().optional(),
  }),
  execute: async ({ context }) => {
    await apiRateLimiter.acquire();

    return await retryWithBackoff(
      async () => {
        const response = await fetch(context.endpoint, {
          method: context.method,
          body: context.body ? JSON.stringify(context.body) : undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error: any = new Error(`API error: ${response.statusText}`);
          error.status = response.status;
          throw error;
        }

        return {
          success: true,
          data: await response.json(),
        };
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      }
    );
  },
});
```

## Authentication Patterns

### API Key Authentication

```typescript
// src/integrations/api-key-auth.ts
export class ApiKeyAuthManager {
  private apiKeys: Map<string, string> = new Map();

  constructor() {
    // Load API keys from environment
    this.loadFromEnvironment();
  }

  private loadFromEnvironment() {
    // Pattern: SERVICE_NAME_API_KEY
    const apiKeyPattern = /^(.+)_API_KEY$/;

    Object.entries(process.env).forEach(([key, value]) => {
      const match = key.match(apiKeyPattern);
      if (match && value) {
        const serviceName = match[1].toLowerCase();
        this.apiKeys.set(serviceName, value);
      }
    });
  }

  getApiKey(serviceName: string): string | undefined {
    return this.apiKeys.get(serviceName.toLowerCase());
  }

  requireApiKey(serviceName: string): string {
    const apiKey = this.getApiKey(serviceName);
    if (!apiKey) {
      throw new Error(
        `API key not found for ${serviceName}. ` +
        `Please set ${serviceName.toUpperCase()}_API_KEY environment variable.`
      );
    }
    return apiKey;
  }
}

export const authManager = new ApiKeyAuthManager();
```

### OAuth 2.0 Integration Pattern

```typescript
// src/integrations/oauth-provider.ts
import { z } from 'zod';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export class OAuthProvider {
  constructor(private config: OAuthConfig) {}

  // Generate authorization URL for user to visit
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  // Refresh expired access token
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }
}

// Example: GitHub OAuth integration
export const githubOAuth = new OAuthProvider({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scopes: ['repo', 'user'],
  redirectUri: `${process.env.APP_URL}/auth/github/callback`,
});

// OAuth-authenticated tool
export const githubAuthenticatedTool = createTool({
  id: 'github-user-repos',
  description: 'Get authenticated user repositories',
  inputSchema: z.object({
    accessToken: z.string().describe('User OAuth access token'),
    visibility: z.enum(['all', 'public', 'private']).default('all'),
  }),
  execute: async ({ context }) => {
    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `GitHub API error: ${response.statusText}`,
      };
    }

    const repos = await response.json();

    return {
      success: true,
      repos: repos.map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        private: repo.private,
      })),
    };
  },
});
```

## Webhook Integration Patterns

### Webhook Receiver Setup

```typescript
// src/webhooks/webhook-handler.ts
import { Hono } from 'hono';
import crypto from 'crypto';
import { z } from 'zod';

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook event schemas
const GitHubPushEventSchema = z.object({
  ref: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
    owner: z.object({
      name: z.string(),
    }),
  }),
  commits: z.array(z.object({
    id: z.string(),
    message: z.string(),
    author: z.object({
      name: z.string(),
      email: z.string(),
    }),
  })),
});

// Webhook handler
export const webhookApp = new Hono();

webhookApp.post('/webhooks/github', async (c) => {
  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header('x-hub-signature-256')?.replace('sha256=', '');

  if (!signature) {
    return c.json({ error: 'Missing signature' }, 400);
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Parse and validate event
  const eventType = c.req.header('x-github-event');
  const payload = JSON.parse(rawBody);

  switch (eventType) {
    case 'push':
      await handleGitHubPush(GitHubPushEventSchema.parse(payload));
      break;

    case 'pull_request':
      await handleGitHubPullRequest(payload);
      break;

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return c.json({ received: true });
});

// Webhook event handlers
async function handleGitHubPush(event: z.infer<typeof GitHubPushEventSchema>) {
  console.log('Push event received:', {
    repository: event.repository.full_name,
    ref: event.ref,
    commits: event.commits.length,
  });

  // Trigger Mastra workflow or agent
  const workflow = mastra.getWorkflow('process-github-push');
  await workflow.execute({
    repository: event.repository.full_name,
    branch: event.ref.replace('refs/heads/', ''),
    commits: event.commits,
  });
}

async function handleGitHubPullRequest(event: any) {
  // Handle pull request events
  console.log('Pull request event:', event.action);
}
```

### Webhook Registration and Management

```typescript
// src/webhooks/webhook-manager.ts
export class WebhookManager {
  async registerWebhook(config: {
    service: 'github' | 'stripe' | 'slack';
    events: string[];
    callbackUrl: string;
  }): Promise<{ webhookId: string; secret: string }> {
    switch (config.service) {
      case 'github':
        return await this.registerGitHubWebhook(config);
      case 'stripe':
        return await this.registerStripeWebhook(config);
      default:
        throw new Error(`Unsupported service: ${config.service}`);
    }
  }

  private async registerGitHubWebhook(config: {
    events: string[];
    callbackUrl: string;
  }): Promise<{ webhookId: string; secret: string }> {
    const github = createGitHubClient();
    const [owner, repo] = process.env.GITHUB_REPO!.split('/');

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    const { data: webhook } = await github.repos.createWebhook({
      owner,
      repo,
      config: {
        url: config.callbackUrl,
        content_type: 'json',
        secret,
      },
      events: config.events,
    });

    return {
      webhookId: webhook.id.toString(),
      secret,
    };
  }
}
```

## Integration Orchestration Patterns

### Multi-Service Integration Workflow

```typescript
// src/workflows/multi-service-workflow.ts
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

export const projectSetupWorkflow = createWorkflow({
  id: 'project-setup',
  description: 'Set up new project across multiple services',
  inputSchema: z.object({
    projectName: z.string(),
    repository: z.object({
      owner: z.string(),
      name: z.string(),
    }),
    team: z.array(z.object({
      email: z.string(),
      role: z.enum(['admin', 'developer', 'viewer']),
    })),
  }),
  outputSchema: z.object({
    repository: z.object({
      url: z.string(),
      createdAt: z.string(),
    }),
    tracking: z.object({
      projectId: z.string(),
      boardUrl: z.string(),
    }),
    communication: z.object({
      channelId: z.string(),
      channelUrl: z.string(),
    }),
  }),
});

const createRepositoryStep = createStep({
  id: 'create-repository',
  description: 'Create GitHub repository',
  inputSchema: z.object({
    repository: z.object({
      owner: z.string(),
      name: z.string(),
    }),
  }),
  outputSchema: z.object({
    repositoryUrl: z.string(),
    repositoryId: z.number(),
  }),
  execute: async ({ inputData }) => {
    const github = createGitHubClient();

    const { data: repo } = await github.repos.createInOrg({
      org: inputData.repository.owner,
      name: inputData.repository.name,
      private: true,
      auto_init: true,
    });

    return {
      repositoryUrl: repo.html_url,
      repositoryId: repo.id,
    };
  },
});

const createProjectBoardStep = createStep({
  id: 'create-project-board',
  description: 'Create project tracking board',
  inputSchema: z.object({
    projectName: z.string(),
    repositoryId: z.number(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    boardUrl: z.string(),
  }),
  execute: async ({ inputData }) => {
    // Create Linear/Jira/etc. project
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINEAR_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateProject($name: String!) {
            projectCreate(input: { name: $name }) {
              project {
                id
                url
              }
            }
          }
        `,
        variables: {
          name: inputData.projectName,
        },
      }),
    });

    const data = await response.json();

    return {
      projectId: data.data.projectCreate.project.id,
      boardUrl: data.data.projectCreate.project.url,
    };
  },
});

const createSlackChannelStep = createStep({
  id: 'create-slack-channel',
  description: 'Create Slack channel for team',
  inputSchema: z.object({
    projectName: z.string(),
    team: z.array(z.object({
      email: z.string(),
    })),
  }),
  outputSchema: z.object({
    channelId: z.string(),
    channelUrl: z.string(),
  }),
  execute: async ({ inputData }) => {
    const channelName = inputData.projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    // Create Slack channel
    const response = await fetch('https://slack.com/api/conversations.create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        name: channelName,
        is_private: true,
      }),
    });

    const data = await response.json();

    return {
      channelId: data.channel.id,
      channelUrl: `https://slack.com/app_redirect?channel=${data.channel.id}`,
    };
  },
});

// Orchestrate all services
projectSetupWorkflow
  .then(createRepositoryStep)
  .then(createProjectBoardStep)
  .then(createSlackChannelStep)
  .commit();
```

## Error Handling for Integrations

### Graceful Degradation

```typescript
export const resilientIntegrationTool = createTool({
  id: 'multi-service-search',
  description: 'Search across multiple services with fallbacks',
  inputSchema: z.object({
    query: z.string(),
    services: z.array(z.enum(['github', 'linear', 'notion'])),
  }),
  execute: async ({ context }) => {
    const results: any = {
      query: context.query,
      results: [],
      errors: [],
    };

    // Try each service, continue on failure
    for (const service of context.services) {
      try {
        const serviceResults = await searchService(service, context.query);
        results.results.push({
          service,
          success: true,
          data: serviceResults,
        });
      } catch (error) {
        console.error(`Service ${service} failed:`, error);
        results.errors.push({
          service,
          error: error.message,
        });

        // Continue with other services
        continue;
      }
    }

    return {
      success: results.results.length > 0,
      partialResults: results.errors.length > 0,
      ...results,
    };
  },
});
```

## See Also

- [[patterns.md]] - Core architectural patterns
- [[environment-setup.md]] - API key configuration
- [[troubleshooting.md]] - Integration debugging
- [[recipes.md]] - Integration code examples
