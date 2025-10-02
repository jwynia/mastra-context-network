# Mastra Examples and Application Patterns Guide

## Overview

This guide walks through complete Mastra application examples, explaining design decisions, implementation patterns, and real-world use cases. Each example demonstrates different aspects of the framework.

## Example Application Categories

### 1. Basic Examples
- Simple agent interactions
- Basic tool usage
- Workflow orchestration
- Memory management

### 2. Integration Examples
- Third-party API integration
- Webhook handling
- OAuth authentication
- Multi-service orchestration

### 3. Advanced Patterns
- Agent networks (A2A)
- Complex workflows with suspend/resume
- Voice-enabled agents
- Multi-modal applications

## Example 1: Simple Weather Assistant

### Overview

A basic weather agent that demonstrates:
- Single agent with external API integration
- Tool creation for API calls
- Basic error handling
- Simple user interaction

### File Structure

```
weather-agent/
├── src/
│   ├── mastra/
│   │   ├── index.ts          # Mastra configuration
│   │   ├── agents/
│   │   │   └── weather.ts    # Weather agent
│   │   └── tools/
│   │       └── weather-api.ts # Weather API tool
│   └── index.ts               # Application entry
├── .env.example
└── package.json
```

### Implementation Walkthrough

#### 1. Weather API Tool (`tools/weather-api.ts`)

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Design Decision: Pure function tool
 * - Stateless for testability
 * - Clear input/output contracts via Zod
 * - Structured error responses
 */
export const getWeatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a city. Returns temperature, conditions, and forecast.',

  // Schema provides both type safety and AI understanding
  inputSchema: z.object({
    city: z.string().describe('City name (e.g., "San Francisco", "London")'),
    units: z.enum(['metric', 'imperial']).default('metric').describe('Temperature units'),
  }),

  execute: async ({ context }) => {
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'Weather API key not configured. Set WEATHER_API_KEY environment variable.',
      };
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?` +
        `q=${encodeURIComponent(context.city)}` +
        `&units=${context.units}` +
        `&appid=${apiKey}`
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Weather API error: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        city: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        conditions: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        units: context.units,
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

**Design Rationale**:
- **Structured Errors**: Return error objects instead of throwing to allow agent to handle gracefully
- **Descriptive Schemas**: AI models use descriptions to understand when/how to use tools
- **Environment Variables**: Secure API key management via environment

#### 2. Weather Agent (`agents/weather.ts`)

```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { getWeatherTool } from '../tools/weather-api';

/**
 * Design Decision: Focused agent with clear purpose
 * - Single responsibility: weather information
 * - Detailed instructions for consistent behavior
 * - Appropriate model selection for task complexity
 */
export const weatherAgent = new Agent({
  name: 'Weather Assistant',
  description: 'Provides weather information for cities worldwide',

  // Detailed instructions shape agent behavior
  instructions: `
You are a helpful weather assistant. Your job is to provide accurate weather information.

## When to use the get-weather tool:
- User asks about current weather in a specific city
- User wants to know temperature, conditions, or forecast

## Response guidelines:
1. Always confirm the city before providing weather
2. Present information clearly and conversationally
3. Include relevant details (temperature, conditions, humidity)
4. Suggest appropriate clothing or activities based on weather
5. If the weather API fails, apologize and suggest trying again

## Example interaction:
User: "What's the weather in Paris?"
You: Use get-weather tool with city="Paris", then respond with:
"The current weather in Paris is [conditions] with a temperature of [temp]°C.
[Additional context like humidity, wind]. [Suggestion based on weather]."
  `,

  // gpt-4o-mini is sufficient for this straightforward task
  model: openai('gpt-4o-mini'),

  // Only one tool needed for this agent
  tools: {
    getWeather: getWeatherTool,
  },
});
```

**Design Rationale**:
- **Clear Instructions**: Reduces unpredictable behavior and improves consistency
- **Model Selection**: Use simpler/cheaper models for simple tasks
- **Single Tool**: Focused agents are easier to test and maintain

#### 3. Mastra Configuration (`mastra/index.ts`)

```typescript
import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { weatherAgent } from './agents/weather';

/**
 * Design Decision: Minimal configuration for simple app
 * - Local SQLite storage for development
 * - Single agent registration
 * - No complex workflows needed
 */
export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: 'file:./mastra.db', // Local database file
  }),

  agents: {
    weather: weatherAgent, // Accessible via mastra.getAgent('weather')
  },
});
```

**Design Rationale**:
- **Local Storage**: SQLite is perfect for development and simple deployments
- **Explicit Registration**: Clear mapping of agent names to instances

#### 4. Using the Agent

```typescript
// src/index.ts
import { mastra } from './mastra';

async function main() {
  const agent = mastra.getAgent('weather');

  const response = await agent.generate([
    {
      role: 'user',
      content: "What's the weather like in Tokyo?",
    },
  ]);

  console.log(response.text);
}

main();
```

### Key Takeaways

1. **Tool-First Design**: Build reusable tools, compose into agents
2. **Clear Agent Purpose**: Each agent has specific, well-defined responsibilities
3. **Structured Data**: Zod schemas everywhere for type safety and AI understanding
4. **Error Handling**: Return structured errors, don't throw
5. **Simple Start**: Begin with minimal configuration, add complexity as needed

## Example 2: Multi-Agent Customer Support System

### Overview

An advanced example demonstrating:
- Agent network with delegation
- Memory persistence across conversations
- Multiple tools per agent
- Workflow integration for complex tasks

### Architecture

```
┌─────────────────────┐
│  Support Coordinator │
│      (Router)       │
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────────┐
    │             │              │
┌───▼───┐    ┌───▼────┐    ┌───▼────┐
│Tech   │    │Billing │    │General │
│Support│    │Support │    │Info    │
└───────┘    └────────┘    └────────┘
```

### Implementation

#### 1. Specialized Support Agents

```typescript
// src/mastra/agents/tech-support.ts
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';

export const techSupportAgent = new Agent({
  name: 'Technical Support Specialist',
  description: 'Handles technical issues, troubleshooting, and bug reports',

  instructions: `
You are a technical support specialist with deep product knowledge.

## Your Responsibilities:
1. Diagnose technical issues
2. Provide step-by-step troubleshooting
3. Escalate complex bugs to engineering
4. Document solutions in knowledge base

## Tools Available:
- checkSystemStatus: Verify service health
- searchKnowledgeBase: Find existing solutions
- createTicket: Escalate to engineering

## Approach:
1. Gather details about the issue
2. Search knowledge base for known solutions
3. If found, guide user through resolution
4. If not found, troubleshoot step by step
5. Create ticket if issue requires engineering attention
  `,

  model: openai('gpt-4o'),

  tools: {
    checkSystemStatus: systemStatusTool,
    searchKnowledge: knowledgeBaseTool,
    createTicket: ticketingTool,
  },

  // Memory enables conversation continuity
  memory: new Memory({
    maxMessages: 50, // Keep recent context
  }),
});
```

#### 2. Coordinator Agent (Router)

```typescript
// src/mastra/agents/coordinator.ts
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { techSupportAgent } from './tech-support';
import { billingSupportAgent } from './billing-support';
import { generalInfoAgent } from './general-info';

export const supportCoordinator = new Agent({
  name: 'Support Coordinator',
  description: 'Routes customer inquiries to specialized support agents',

  instructions: `
You are a support coordinator who routes customer inquiries to specialists.

## Available Specialists:
- **techSupport**: Technical issues, bugs, troubleshooting
- **billingSupport**: Payment, subscriptions, invoices
- **generalInfo**: Product information, features, general questions

## Routing Logic:
1. Analyze the customer's inquiry
2. Determine which specialist is most appropriate
3. Delegate to that specialist
4. If multiple specialists needed, coordinate between them
5. Synthesize responses into cohesive answer

## Important:
- Always acknowledge the customer's inquiry first
- Clearly explain if you're transferring to a specialist
- Ensure the customer gets a complete answer
  `,

  model: openai('gpt-4o'),

  // Sub-agents for delegation
  agents: {
    techSupport: techSupportAgent,
    billingSupport: billingSupportAgent,
    generalInfo: generalInfoAgent,
  },

  tools: {
    // Coordinator-level tools
    escalateToManager: escalationTool,
  },

  memory: new Memory(),
});
```

**Design Rationale**:
- **Separation of Concerns**: Each agent has specialized knowledge
- **Clear Delegation**: Coordinator understands when to route to specialists
- **Memory Throughout**: Each agent maintains conversation context

#### 3. Using the Agent Network

```typescript
// src/api/support.ts
import { Hono } from 'hono';
import { mastra } from '../mastra';

const app = new Hono();

app.post('/support/chat', async (c) => {
  const { message, threadId } = await c.req.json();

  // All requests go through coordinator
  const coordinator = mastra.getAgent('supportCoordinator');

  const response = await coordinator.generate([
    {
      role: 'user',
      content: message,
    },
  ], {
    threadId: threadId || `thread_${Date.now()}`,
  });

  return c.json({
    response: response.text,
    threadId,
  });
});

export default app;
```

### Key Takeaways

1. **Agent Networks**: Coordinator pattern for routing and delegation
2. **Specialization**: Each agent has focused expertise
3. **Memory Persistence**: Thread-based conversation continuity
4. **Clear Communication**: Agents explain their actions to users

## Example 3: Document Processing Workflow

### Overview

Demonstrates workflow usage for:
- Multi-step data processing
- Suspend/resume for long operations
- Error handling and retries
- Integration with agents

### Workflow Design

```
Input: PDF Document
    ↓
Step 1: Extract Text
    ↓
Step 2: Chunk Text
    ↓
Step 3: Generate Embeddings
    ↓
Step 4: Store in Vector DB
    ↓
Step 5: Summarize with Agent
    ↓
Output: Summary + Searchable Document
```

### Implementation

```typescript
// src/mastra/workflows/document-processing.ts
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

export const documentProcessingWorkflow = createWorkflow({
  id: 'process-document',
  description: 'Extract, chunk, embed, and summarize documents',

  inputSchema: z.object({
    documentUrl: z.string().url(),
    chunkSize: z.number().default(1000),
    chunkOverlap: z.number().default(200),
  }),

  outputSchema: z.object({
    documentId: z.string(),
    summary: z.string(),
    chunks: z.number(),
    indexed: z.boolean(),
  }),
});

// Step 1: Extract text from PDF
const extractTextStep = createStep({
  id: 'extract-text',
  description: 'Extract text content from PDF',

  inputSchema: z.object({
    documentUrl: z.string(),
  }),

  outputSchema: z.object({
    text: z.string(),
    pageCount: z.number(),
  }),

  execute: async ({ inputData }) => {
    // PDF extraction logic (using pdf-parse or similar)
    const response = await fetch(inputData.documentUrl);
    const buffer = await response.arrayBuffer();
    const pdf = await parsePDF(buffer);

    return {
      text: pdf.text,
      pageCount: pdf.numpages,
    };
  },
});

// Step 2: Chunk text
const chunkTextStep = createStep({
  id: 'chunk-text',
  description: 'Split text into semantic chunks',

  inputSchema: z.object({
    text: z.string(),
    chunkSize: z.number(),
    chunkOverlap: z.number(),
  }),

  outputSchema: z.object({
    chunks: z.array(z.object({
      text: z.string(),
      index: z.number(),
    })),
  }),

  execute: async ({ inputData }) => {
    const chunks = chunkText(
      inputData.text,
      inputData.chunkSize,
      inputData.chunkOverlap
    );

    return {
      chunks: chunks.map((text, index) => ({ text, index })),
    };
  },
});

// Step 3: Generate embeddings (suspendable for large docs)
const generateEmbeddingsStep = createStep({
  id: 'generate-embeddings',
  description: 'Generate vector embeddings for chunks',

  inputSchema: z.object({
    chunks: z.array(z.object({
      text: z.string(),
      index: z.number(),
    })),
  }),

  outputSchema: z.object({
    embeddings: z.array(z.object({
      vector: z.array(z.number()),
      chunk: z.object({
        text: z.string(),
        index: z.number(),
      }),
    })),
  }),

  execute: async ({ inputData, suspend }) => {
    const embeddings = [];

    for (const [i, chunk] of inputData.chunks.entries()) {
      // Suspend periodically for long operations
      if (i > 0 && i % 100 === 0) {
        await suspend();
      }

      const embedding = await generateEmbedding(chunk.text);
      embeddings.push({
        vector: embedding,
        chunk,
      });
    }

    return { embeddings };
  },
});

// Compose workflow
documentProcessingWorkflow
  .then(extractTextStep)
  .then(chunkTextStep)
  .then(generateEmbeddingsStep)
  .commit();
```

**Design Rationale**:
- **Step Isolation**: Each step has clear input/output contracts
- **Suspendable**: Long operations can pause and resume
- **Validation**: Schemas ensure data integrity between steps
- **Testability**: Each step can be tested independently

### Key Takeaways

1. **Workflows for Processes**: Use workflows for multi-step operations
2. **Suspend/Resume**: Handle long-running operations gracefully
3. **Schema Validation**: Explicit contracts between steps prevent errors
4. **Composition**: Build complex processes from simple steps

## Common Application Patterns

### Pattern 1: Chat Interface

```typescript
// Chat application with memory
app.post('/chat', async (c) => {
  const { message, userId, sessionId } = await c.req.json();

  const threadId = `${userId}:${sessionId}`;
  const agent = mastra.getAgent('assistant');

  const response = await agent.generate([{
    role: 'user',
    content: message,
  }], { threadId });

  return c.json({ response: response.text, threadId });
});
```

### Pattern 2: Async Workflow Execution

```typescript
// Long-running workflow with status tracking
app.post('/process-document', async (c) => {
  const { documentUrl } = await c.req.json();
  const workflow = mastra.getWorkflow('processDocument');

  // Start workflow asynchronously
  const executionId = `exec_${Date.now()}`;

  workflow.execute({ documentUrl }).then(result => {
    // Store result when complete
    storage.set(`execution:${executionId}`, {
      status: 'completed',
      result,
    });
  });

  return c.json({
    executionId,
    status: 'processing',
    statusUrl: `/status/${executionId}`,
  });
});

app.get('/status/:executionId', async (c) => {
  const execution = await storage.get(`execution:${c.req.param('executionId')}`);
  return c.json(execution);
});
```

### Pattern 3: Tool Chaining

```typescript
// Agent that chains multiple tools
export const researchAgent = new Agent({
  name: 'Research Agent',
  instructions: `
Research topics using multiple sources:
1. Search web with searchWeb tool
2. For each result, fetch content with fetchUrl tool
3. Synthesize information into comprehensive summary
  `,
  tools: {
    searchWeb: webSearchTool,
    fetchUrl: urlFetchTool,
    summarize: summarizationTool,
  },
});
```

## See Also

- [[patterns.md]] - Core architectural patterns
- [[recipes.md]] - Code snippets and templates
- [[testing.md]] - Testing these examples
- [[deployment.md]] - Deploying example applications
