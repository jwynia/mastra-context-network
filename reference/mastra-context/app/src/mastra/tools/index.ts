import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Example tool demonstrating basic tool creation pattern
 * Tools are the atomic units of functionality in Mastra
 */
export const exampleTool = createTool({
  id: 'example-tool',
  description: 'Demonstrates basic tool creation with input validation and execution',
  inputSchema: z.object({
    message: z.string().describe('The message to process'),
    options: z.object({
      uppercase: z.boolean().default(false).describe('Convert message to uppercase'),
      reverse: z.boolean().default(false).describe('Reverse the message'),
    }).optional(),
  }),
  execute: async ({ context }) => {
    let result = context.message;

    if (context.options?.uppercase) {
      result = result.toUpperCase();
    }

    if (context.options?.reverse) {
      result = result.split('').reverse().join('');
    }

    return {
      processed: result,
      original: context.message,
      transformations: {
        uppercase: context.options?.uppercase || false,
        reverse: context.options?.reverse || false,
      },
    };
  },
});

/**
 * Tool demonstrating API integration pattern
 * Shows how to handle external service calls with error handling
 */
export const weatherTool = createTool({
  id: 'weather-info',
  description: 'Fetches weather information for a given location',
  inputSchema: z.object({
    location: z.string().describe('The city or location to get weather for'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, you would call an actual weather API
    // This is a mock implementation for demonstration
    try {
      const temperature = Math.floor(Math.random() * 30) + 10; // Random temp between 10-40
      const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)];

      return {
        location: context.location,
        temperature: {
          value: temperature,
          unit: context.units,
        },
        conditions,
        humidity: Math.floor(Math.random() * 100),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool demonstrating data processing pattern
 * Shows how to handle complex data transformations
 */
export const dataProcessorTool = createTool({
  id: 'data-processor',
  description: 'Processes and analyzes data arrays with various statistical operations',
  inputSchema: z.object({
    data: z.array(z.number()).describe('Array of numbers to process'),
    operations: z.array(z.enum(['sum', 'average', 'min', 'max', 'count', 'median'])).default(['sum', 'average']),
  }),
  execute: async ({ context }) => {
    const { data, operations } = context;
    const results: Record<string, number> = {};

    if (data.length === 0) {
      throw new Error('Data array cannot be empty');
    }

    if (operations.includes('sum')) {
      results.sum = data.reduce((acc, val) => acc + val, 0);
    }

    if (operations.includes('average')) {
      results.average = data.reduce((acc, val) => acc + val, 0) / data.length;
    }

    if (operations.includes('min')) {
      results.min = Math.min(...data);
    }

    if (operations.includes('max')) {
      results.max = Math.max(...data);
    }

    if (operations.includes('count')) {
      results.count = data.length;
    }

    if (operations.includes('median')) {
      const sorted = [...data].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      results.median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }

    return {
      results,
      inputSize: data.length,
      operationsPerformed: operations,
    };
  },
});

/**
 * Tool demonstrating async operation with progress tracking
 * Shows how to handle long-running operations
 */
export const asyncTaskTool = createTool({
  id: 'async-task',
  description: 'Simulates a long-running async task with progress tracking',
  inputSchema: z.object({
    duration: z.number().min(1000).max(30000).default(5000).describe('Task duration in milliseconds'),
    steps: z.number().min(1).max(10).default(5).describe('Number of processing steps'),
  }),
  execute: async ({ context }) => {
    const { duration, steps } = context;
    const stepDuration = duration / steps;
    const results: string[] = [];

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      results.push(`Step ${i} completed at ${new Date().toISOString()}`);
    }

    return {
      taskId: `task_${Date.now()}`,
      totalDuration: duration,
      stepsCompleted: steps,
      results,
      completedAt: new Date().toISOString(),
    };
  },
});

// Export all tools for easy importing
export const tools = {
  exampleTool,
  weatherTool,
  dataProcessorTool,
  asyncTaskTool,
} as const;