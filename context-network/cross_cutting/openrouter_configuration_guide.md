# OpenRouter Configuration Guide for LLM Agents

## Purpose
This document provides comprehensive guidelines for configuring and optimizing OpenRouter as the model provider for TypeScript LLM agents built with the Mastra framework.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### OpenRouter Overview

#### What is OpenRouter

OpenRouter is a unified API that provides access to multiple LLM providers through a single interface, offering:

1. **Multi-Provider Access**: Access to models from OpenAI, Anthropic, Google, Meta, and more
2. **Cost Optimization**: Automatic routing to the most cost-effective models
3. **Fallback Mechanisms**: Automatic failover when primary models are unavailable
4. **Usage Analytics**: Detailed tracking of token usage and costs
5. **Rate Limit Management**: Built-in handling of provider-specific rate limits

#### Key Benefits for Agent Development

- **Model Diversity**: Choose the best model for each specific task
- **Cost Control**: Optimize expenses through intelligent model selection
- **Reliability**: Reduce downtime through automatic failover
- **Simplified Integration**: Single API for multiple providers
- **Performance Monitoring**: Track usage patterns and optimize accordingly

### Account Setup and Authentication

#### Getting Started

1. **Create Account**: Sign up at [openrouter.ai](https://openrouter.ai)
2. **Generate API Key**: Navigate to Keys section and create a new API key
3. **Set Usage Limits**: Configure spending limits and alerts
4. **Choose Models**: Select which models you want access to

#### Environment Configuration

```bash
# .env file
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_HTTP_REFERER=your_app_name  # Optional: for analytics
OPENROUTER_X_TITLE=your_app_title      # Optional: for analytics

# Optional: Default model configurations
DEFAULT_MODEL=anthropic/claude-3-5-sonnet-20241022
FALLBACK_MODEL=anthropic/claude-3-haiku-20240307
FAST_MODEL=openai/gpt-3.5-turbo
REASONING_MODEL=openai/o1-preview
```

#### TypeScript Configuration

```typescript
// src/config/openrouter.ts
export const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'localhost',
    'X-Title': process.env.OPENROUTER_X_TITLE || 'Mastra Agent',
  },
  models: {
    // High-quality models for complex tasks
    premium: {
      claude: 'anthropic/claude-3-5-sonnet-20241022',
      gpt4: 'openai/gpt-4-turbo-preview',
      gemini: 'google/gemini-pro-1.5',
    },
    // Fast models for simple tasks
    fast: {
      claude: 'anthropic/claude-3-haiku-20240307',
      gpt: 'openai/gpt-3.5-turbo',
      llama: 'meta-llama/llama-3.1-8b-instruct',
    },
    // Specialized models
    specialized: {
      reasoning: 'openai/o1-preview',
      coding: 'anthropic/claude-3-5-sonnet-20241022',
      vision: 'openai/gpt-4-vision-preview',
    },
  },
};
```

### Model Selection Strategies

#### Model Categories and Use Cases

```typescript
// src/config/model-selection.ts
export const modelSelectionStrategy = {
  // Complex reasoning and analysis
  complex: {
    primary: 'anthropic/claude-3-5-sonnet-20241022',
    fallback: 'openai/gpt-4-turbo-preview',
    useCase: 'Complex analysis, code review, strategic planning',
    costTier: 'high',
  },
  
  // Fast responses for simple tasks
  simple: {
    primary: 'anthropic/claude-3-haiku-20240307',
    fallback: 'openai/gpt-3.5-turbo',
    useCase: 'Simple Q&A, basic formatting, quick responses',
    costTier: 'low',
  },
  
  // Code generation and technical tasks
  coding: {
    primary: 'anthropic/claude-3-5-sonnet-20241022',
    fallback: 'openai/gpt-4-turbo-preview',
    useCase: 'Code generation, debugging, technical documentation',
    costTier: 'high',
  },
  
  // Creative content generation
  creative: {
    primary: 'openai/gpt-4-turbo-preview',
    fallback: 'anthropic/claude-3-5-sonnet-20241022',
    useCase: 'Creative writing, marketing content, storytelling',
    costTier: 'medium',
  },
  
  // Data analysis and structured output
  analytical: {
    primary: 'anthropic/claude-3-5-sonnet-20241022',
    fallback: 'openai/gpt-4-turbo-preview',
    useCase: 'Data analysis, structured output, research',
    costTier: 'high',
  },
};

// Dynamic model selection based on task complexity
export function selectModel(taskType: string, complexity: 'low' | 'medium' | 'high') {
  const strategies = {
    low: modelSelectionStrategy.simple,
    medium: modelSelectionStrategy.creative,
    high: modelSelectionStrategy.complex,
  };
  
  return strategies[complexity] || modelSelectionStrategy.simple;
}
```

#### Cost-Aware Model Selection

```typescript
// src/utils/cost-optimizer.ts
interface ModelCost {
  inputTokens: number;  // Cost per 1M input tokens
  outputTokens: number; // Cost per 1M output tokens
}

export const modelCosts: Record<string, ModelCost> = {
  'anthropic/claude-3-5-sonnet-20241022': {
    inputTokens: 3.00,
    outputTokens: 15.00,
  },
  'anthropic/claude-3-haiku-20240307': {
    inputTokens: 0.25,
    outputTokens: 1.25,
  },
  'openai/gpt-4-turbo-preview': {
    inputTokens: 10.00,
    outputTokens: 30.00,
  },
  'openai/gpt-3.5-turbo': {
    inputTokens: 0.50,
    outputTokens: 1.50,
  },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = modelCosts[model];
  if (!costs) return 0;
  
  return (
    (inputTokens / 1_000_000) * costs.inputTokens +
    (outputTokens / 1_000_000) * costs.outputTokens
  );
}

export function selectCostEffectiveModel(
  taskComplexity: 'low' | 'medium' | 'high',
  budgetLimit: number
): string {
  const candidates = {
    low: ['anthropic/claude-3-haiku-20240307', 'openai/gpt-3.5-turbo'],
    medium: ['anthropic/claude-3-5-sonnet-20241022', 'openai/gpt-4-turbo-preview'],
    high: ['anthropic/claude-3-5-sonnet-20241022', 'openai/gpt-4-turbo-preview'],
  };
  
  // Select the most cost-effective model within budget
  return candidates[taskComplexity][0]; // Simplified selection logic
}
```

### Mastra Integration Patterns

#### Basic OpenRouter Configuration with Mastra

```typescript
// src/mastra/config/models.ts
import { openRouterConfig } from '../../config/openrouter';

export const getBaseModelConfig = (modelName?: string) => ({
  provider: 'OPEN_ROUTER' as const,
  name: modelName || openRouterConfig.models.premium.claude,
  apiKey: openRouterConfig.apiKey,
  baseURL: openRouterConfig.baseURL,
  defaultHeaders: openRouterConfig.defaultHeaders,
});

// Model configurations for different agent types
export const modelConfigs = {
  // High-performance model for complex tasks
  premium: getBaseModelConfig('anthropic/claude-3-5-sonnet-20241022'),
  
  // Fast model for simple tasks
  fast: getBaseModelConfig('anthropic/claude-3-haiku-20240307'),
  
  // Balanced model for general use
  balanced: getBaseModelConfig('openai/gpt-4-turbo-preview'),
  
  // Specialized configurations
  coding: {
    ...getBaseModelConfig('anthropic/claude-3-5-sonnet-20241022'),
    temperature: 0.1,
    maxTokens: 4000,
  },
  
  creative: {
    ...getBaseModelConfig('openai/gpt-4-turbo-preview'),
    temperature: 0.7,
    maxTokens: 2000,
  },
  
  analytical: {
    ...getBaseModelConfig('anthropic/claude-3-5-sonnet-20241022'),
    temperature: 0.2,
    maxTokens: 3000,
  },
};
```

#### Agent-Specific Model Configuration

```typescript
// src/mastra/agents/specialized-agents.ts
import { Agent } from '@mastra/core';
import { modelConfigs } from '../config/models';

// Code review agent with coding-optimized model
export const codeReviewAgent = new Agent({
  name: 'CodeReviewAgent',
  instructions: `
    You are a senior software engineer conducting thorough code reviews.
    Focus on code quality, security vulnerabilities, and best practices.
    Provide specific, actionable feedback with examples.
  `,
  model: modelConfigs.coding,
});

// Creative content agent with creative-optimized model
export const contentAgent = new Agent({
  name: 'ContentAgent',
  instructions: `
    You are a creative content specialist.
    Generate engaging, original content tailored to the target audience.
    Maintain brand voice and messaging consistency.
  `,
  model: modelConfigs.creative,
});

// Data analysis agent with analytical model
export const analyticsAgent = new Agent({
  name: 'AnalyticsAgent',
  instructions: `
    You are a data analysis expert.
    Provide clear insights backed by statistical analysis.
    Present findings in structured, actionable formats.
  `,
  model: modelConfigs.analytical,
});
```

#### Dynamic Model Selection

```typescript
// src/mastra/agents/adaptive-agent.ts
import { Agent } from '@mastra/core';
import { selectModel } from '../../config/model-selection';

export class AdaptiveAgent extends Agent {
  constructor(name: string, instructions: string) {
    super({
      name,
      instructions,
      model: modelConfigs.balanced, // Default model
    });
  }

  async generateWithOptimalModel(
    input: string,
    taskType: string,
    complexity: 'low' | 'medium' | 'high'
  ) {
    // Select optimal model based on task characteristics
    const optimalModel = selectModel(taskType, complexity);
    
    // Temporarily update model configuration
    const originalModel = this.model;
    this.model = {
      provider: 'OPEN_ROUTER',
      name: optimalModel.primary,
      ...getBaseModelConfig(optimalModel.primary),
    };

    try {
      return await this.generate(input);
    } catch (error) {
      // Fallback to secondary model
      this.model = {
        provider: 'OPEN_ROUTER',
        name: optimalModel.fallback,
        ...getBaseModelConfig(optimalModel.fallback),
      };
      
      return await this.generate(input);
    } finally {
      // Restore original model
      this.model = originalModel;
    }
  }
}
```

### Error Handling and Resilience

#### Retry Strategies

```typescript
// src/utils/openrouter-resilience.ts
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt < config.maxAttempts) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

function isNonRetryableError(error: any): boolean {
  // Don't retry on authentication errors, invalid requests, etc.
  const nonRetryableCodes = [400, 401, 403, 404];
  return nonRetryableCodes.includes(error.status);
}
```

#### Circuit Breaker Implementation

```typescript
// src/utils/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage with OpenRouter
export const openRouterCircuitBreaker = new CircuitBreaker(5, 60000);
```

### Rate Limiting and Quota Management

#### Rate Limit Handling

```typescript
// src/utils/rate-limiter.ts
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }
    }
    
    this.requests.push(now);
  }
}

// Model-specific rate limiters
export const rateLimiters = {
  'anthropic/claude-3-5-sonnet-20241022': new RateLimiter(50, 60000), // 50 req/min
  'openai/gpt-4-turbo-preview': new RateLimiter(100, 60000), // 100 req/min
  'anthropic/claude-3-haiku-20240307': new RateLimiter(200, 60000), // 200 req/min
};

export async function executeWithRateLimit<T>(
  modelName: string,
  operation: () => Promise<T>
): Promise<T> {
  const rateLimiter = rateLimiters[modelName];
  if (rateLimiter) {
    await rateLimiter.waitForSlot();
  }
  
  return operation();
}
```

#### Usage Monitoring and Alerts

```typescript
// src/utils/usage-monitor.ts
interface UsageMetrics {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  errorCount: number;
  modelUsage: Record<string, number>;
}

export class UsageMonitor {
  private metrics: UsageMetrics = {
    totalTokens: 0,
    totalCost: 0,
    requestCount: 0,
    errorCount: 0,
    modelUsage: {},
  };

  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ) {
    this.metrics.totalTokens += inputTokens + outputTokens;
    this.metrics.totalCost += cost;
    this.metrics.requestCount++;
    this.metrics.modelUsage[model] = (this.metrics.modelUsage[model] || 0) + 1;

    // Check for budget alerts
    this.checkBudgetAlerts();
  }

  recordError(model: string) {
    this.metrics.errorCount++;
  }

  private checkBudgetAlerts() {
    const dailyBudget = parseFloat(process.env.DAILY_BUDGET || '100');
    const weeklyBudget = parseFloat(process.env.WEEKLY_BUDGET || '500');

    if (this.metrics.totalCost > dailyBudget * 0.8) {
      console.warn(`⚠️ Approaching daily budget limit: $${this.metrics.totalCost.toFixed(2)}/$${dailyBudget}`);
    }

    if (this.metrics.totalCost > dailyBudget) {
      console.error(`🚨 Daily budget exceeded: $${this.metrics.totalCost.toFixed(2)}/$${dailyBudget}`);
    }
  }

  getMetrics(): UsageMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      errorCount: 0,
      modelUsage: {},
    };
  }
}

export const usageMonitor = new UsageMonitor();
```

### Performance Optimization

#### Response Caching

```typescript
// src/utils/response-cache.ts
interface CacheEntry {
  response: any;
  timestamp: number;
  model: string;
}

export class ResponseCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private ttlMs: number = 3600000) {} // 1 hour default

  generateKey(input: string, model: string, temperature: number): string {
    return `${model}:${temperature}:${Buffer.from(input).toString('base64')}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }

  set(key: string, response: any, model: string): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      model,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const responseCache = new ResponseCache();
```

#### Streaming Responses

```typescript
// src/utils/streaming.ts
import { Agent } from '@mastra/core';

export async function* streamAgentResponse(
  agent: Agent,
  input: string
): AsyncGenerator<string, void, unknown> {
  // Configure agent for streaming
  const streamingAgent = new Agent({
    ...agent,
    model: {
      ...agent.model,
      stream: true,
    },
  });

  const stream = await streamingAgent.generateStream(input);
  
  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content;
    }
  }
}

// Usage example
export async function handleStreamingRequest(
  agent: Agent,
  input: string,
  onChunk: (chunk: string) => void
) {
  try {
    for await (const chunk of streamAgentResponse(agent, input)) {
      onChunk(chunk);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    throw error;
  }
}
```

### Security Best Practices

#### API Key Management

```typescript
// src/config/security.ts
export class SecureConfig {
  private static instance: SecureConfig;
  private apiKey: string;

  private constructor() {
    this.apiKey = this.loadApiKey();
  }

  static getInstance(): SecureConfig {
    if (!SecureConfig.instance) {
      SecureConfig.instance = new SecureConfig();
    }
    return SecureConfig.instance;
  }

  private loadApiKey(): string {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-or-')) {
      throw new Error('Invalid OpenRouter API key format');
    }

    return apiKey;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  // Rotate API key (for production environments)
  rotateApiKey(newApiKey: string): void {
    if (!newApiKey.startsWith('sk-or-')) {
      throw new Error('Invalid OpenRouter API key format');
    }
    
    this.apiKey = newApiKey;
    // Update environment or secure storage
  }
}
```

#### Input Sanitization

```typescript
// src/utils/input-sanitization.ts
export function sanitizeInput(input: string): string {
  // Remove potential prompt injection attempts
  const dangerousPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /<\|.*?\|>/gi, // Special tokens
  ];

  let sanitized = input;
  
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }

  // Limit input length
  const maxLength = 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

export function validateInput(input: string): boolean {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\b(ignore|forget|disregard)\b.*\b(instructions|rules|guidelines)\b/gi,
    /\b(you are|act as|pretend to be)\b.*\b(different|another|new)\b/gi,
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(input));
}
```

### Monitoring and Analytics

#### Request Logging

```typescript
// src/utils/request-logger.ts
interface RequestLog {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  success: boolean;
  error?: string;
}

export class RequestLogger {
  private logs: RequestLog[] = [];

  log(entry: RequestLog): void {
    this.logs.push(entry);
    
    // Optional: Send to external logging service
    if (process.env.LOG_ENDPOINT) {
      this.sendToExternalLogger(entry);
    }
  }

  private async sendToExternalLogger(entry: RequestLog): Promise<void> {
    try {
      await fetch(process.env.LOG_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  getLogs(limit?: number): RequestLog[] {
    return limit ? this.logs.slice(-limit) : this.logs;
  }

  getAnalytics() {
    const totalRequests = this.logs.length;
    const successfulRequests = this.logs.filter(log => log.success).length;
    const totalCost = this.logs.reduce((sum, log) => sum + log.cost, 0);
    const averageLatency = this.logs.reduce((sum, log) => sum + log.latency, 0) / totalRequests;

    return {
      totalRequests,
      successRate: successfulRequests / totalRequests,
      totalCost,
      averageLatency,
      modelUsage: this.getModelUsageStats(),
    };
  }

  private getModelUsageStats() {
    const usage: Record<string, number> = {};
    
    for (const log of this.logs) {
      usage[log.model] = (usage[log.model] || 0) + 1;
    }
    
    return usage;
  }
}

export const requestLogger = new RequestLogger();
```

### Testing Strategies

#### Mock OpenRouter for Testing

```typescript
// tests/mocks/openrouter-mock.ts
export class MockOpenRouter {
  private responses: Map<string, any> = new Map();

  setMockResponse(input: string, response: any): void {
    this.responses.set(input, response);
  }

  async generate(input: string, model: string): Promise<any> {
    const mockResponse = this.responses.get(input);
    
    if (mockResponse) {
      return mockResponse;
    }

    // Default mock response
    return {
      choices: [{
        message: {
          content: `Mock response for: ${input}`,
        },
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };
  }
}

// Test setup
export const mockOpenRouter = new MockOpenRouter();
```

#### Integration Tests

```typescript
// tests/integration/openrouter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Agent } from '@mastra/core';
import { modelConfigs } from '../../src/mastra/config/models';

describe('OpenRouter Integration', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({
      name: 'TestAgent',
      instructions: 'You are a helpful test assistant.',
      model: modelConfigs.fast,
    });
  });

  it('should generate response with Claude model', async () => {
    const response = await agent.generate('What is 2 + 2?');
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.toLowerCase()).toContain('4');
  });

  it('should handle rate limiting gracefully', async () => {
    const promises = Array(10).fill(null).map(() => 
      agent.generate('Quick test')
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled');
    
    expect(successful.length).toBeGreaterThan(0);
  });

  it('should fallback on model failure', async () => {
    // Test with invalid model to trigger fallback
    const fallbackAgent = new Agent({
      name: 'FallbackAgent',
      instructions: 'Test agent',
      model: {
        ...modelConfigs.fast,
        name: 'invalid/model',
      },
    });

    // Should not throw error due to fallback mechanism
    await expect(fallbackAgent.generate('test')).resolves.toBeDefined();
  });
});
```

### Best Practices Checklist

#### Configuration
- [ ] Store API keys securely in environment variables
- [ ] Set up usage monitoring and budget alerts
- [ ] Configure appropriate rate limits for each model
- [ ] Implement fallback models for reliability
- [ ] Set up proper error handling and retry logic

#### Model Selection
- [ ] Choose models based on task complexity and requirements
- [ ] Implement cost-aware model selection
- [ ] Use faster models for simple tasks
- [ ] Reserve premium models for complex reasoning
- [ ] Monitor model performance and costs

#### Security
- [ ] Sanitize all user inputs before sending to models
- [ ] Validate API responses before processing
- [ ] Implement proper authentication and authorization
- [ ] Log all requests for audit purposes
- [ ] Rotate API keys regularly

#### Performance
- [ ] Implement response caching for repeated queries
- [ ] Use streaming for long responses
- [ ] Optimize token usage to reduce costs
- [ ] Monitor and optimize latency
- [ ] Implement circuit breakers for external calls

#### Monitoring
- [ ] Track token usage and costs
- [ ] Monitor error rates and response times
- [ ] Set up alerts for budget overruns
- [ ] Log all API interactions
- [ ] Analyze usage patterns for optimization

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** None
- **Related Nodes:** 
  - [foundation/system_overview.md] - implements - LLM model provider integration
  - [cross_cutting/mastra_integration_guide.md] - complements - Framework integration with model provider
  - [cross_cutting/nodejs_security_guide.md] - uses - Security practices for API integration

## Navigation Guidance
- **Access Context:** Use this document when setting up OpenRouter integration or optimizing model usage
- **Common Next Steps:** After reviewing this guide, typically explore specific agent configurations or cost optimization strategies
- **Related Tasks:** Model provider setup, cost optimization, performance tuning, security configuration
- **Update Patterns:** This document should be updated when OpenRouter introduces new models, changes pricing, or updates API features

## Metadata
- **Created:** 2025-06-30
- **Last Updated:** 2025-06-30
- **Updated By:** Cline
- **Sources:** OpenRouter Documentation, API Reference, Best Practices

## Change History
- 2025-06-30: Initial creation of OpenRouter configuration guide for TypeScript LLM agents
