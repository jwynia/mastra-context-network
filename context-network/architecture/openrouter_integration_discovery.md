# OpenRouter Integration Discovery

## Purpose
Document the discovered pattern for integrating OpenRouter with Mastra agents to prevent endpoint configuration issues.

## Classification
- **Domain:** Architecture
- **Stability:** Semi-stable
- **Abstraction:** Detailed
- **Confidence:** Established

## Discovery Summary

### Issue Identified
When using OpenRouter with Mastra agents, the OpenAI SDK adapter can incorrectly route OpenRouter API keys to OpenAI endpoints, causing authentication failures.

### Solution Pattern
Use `createOpenAI` from `@ai-sdk/openai` to create a custom client with OpenRouter's base URL:

```typescript
// src/mastra/agents/weather-agent.ts:6-15
import { createOpenAI } from '@ai-sdk/openai';

// Configure OpenRouter
const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost',
    'X-Title': process.env.OPENROUTER_X_TITLE || 'Mastra Weather Agent',
  },
});
```

### Key Implementation Details

1. **Import Pattern**: Use `createOpenAI` instead of the default `openai` export
2. **Base URL**: Must explicitly set to `https://openrouter.ai/api/v1`
3. **Headers**: OpenRouter requires HTTP-Referer and X-Title headers for analytics
4. **Model Usage**: Reference models using OpenRouter naming convention (e.g., `anthropic/claude-3-haiku-20240307`)

### Environment Variables Required
- `OPENROUTER_API_KEY`: OpenRouter API key (format: `sk-or-...`)
- `OPENROUTER_HTTP_REFERER`: Application identifier for analytics
- `OPENROUTER_X_TITLE`: Application title for analytics

## Relationships
- **Parent Nodes:** [architecture/system_architecture.md]
- **Related Nodes:** 
  - [cross_cutting/openrouter_configuration_guide.md] - detailed configuration guide
  - [architecture/agent_architecture.md] - agent patterns

## Metadata
- **Created:** 2025-06-30
- **Last Updated:** 2025-06-30
- **Updated By:** Assistant
- **Discovery Location:** `app/src/mastra/agents/weather-agent.ts`