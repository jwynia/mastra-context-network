import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Example workflow demonstrating basic workflow creation patterns
 * Workflows orchestrate multiple steps and handle data flow between them
 */
export const dataProcessingWorkflow = createWorkflow({
  id: 'data-processing-pipeline',
  description: 'Processes raw data through validation, transformation, and analysis steps',
  inputSchema: z.object({
    rawData: z.array(z.any()).describe('Raw data to process'),
    processingOptions: z.object({
      validateData: z.boolean().default(true),
      transformData: z.boolean().default(true),
      generateAnalytics: z.boolean().default(true),
    }).optional(),
  }),
  outputSchema: z.object({
    processedData: z.array(z.any()),
    analytics: z.object({
      totalRecords: z.number(),
      validRecords: z.number(),
      transformedRecords: z.number(),
      processingTime: z.number(),
    }),
    metadata: z.object({
      workflowId: z.string(),
      processedAt: z.string(),
      steps: z.array(z.string()),
    }),
  }),
});

// Step 1: Data Validation
const validateDataStep = createStep({
  id: 'validate-data',
  description: 'Validates input data and filters out invalid records',
  inputSchema: z.object({
    rawData: z.array(z.any()),
    processingOptions: z.object({
      validateData: z.boolean().default(true),
      transformData: z.boolean().default(true),
      generateAnalytics: z.boolean().default(true),
    }).optional(),
  }),
  outputSchema: z.object({
    validData: z.array(z.any()),
    invalidData: z.array(z.any()),
    validationStats: z.object({
      total: z.number(),
      valid: z.number(),
      invalid: z.number(),
    }),
    processingOptions: z.object({
      validateData: z.boolean().default(true),
      transformData: z.boolean().default(true),
      generateAnalytics: z.boolean().default(true),
    }).optional(),
  }),
  execute: async ({ inputData }) => {
    const startTime = Date.now();
    const { rawData, processingOptions } = inputData;

    if (!processingOptions?.validateData) {
      return {
        validData: rawData,
        invalidData: [],
        validationStats: {
          total: rawData.length,
          valid: rawData.length,
          invalid: 0,
        },
        processingOptions,
      };
    }

    const validData: any[] = [];
    const invalidData: any[] = [];

    // Simple validation logic - in real scenarios, this would be more sophisticated
    for (const item of rawData) {
      if (item != null && typeof item === 'object' && !Array.isArray(item)) {
        validData.push(item);
      } else {
        invalidData.push(item);
      }
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      validData,
      invalidData,
      validationStats: {
        total: rawData.length,
        valid: validData.length,
        invalid: invalidData.length,
      },
      processingOptions,
    };
  },
});

// Step 2: Data Transformation
const transformDataStep = createStep({
  id: 'transform-data',
  description: 'Transforms valid data according to processing rules',
  inputSchema: z.object({
    validData: z.array(z.any()),
    invalidData: z.array(z.any()),
    validationStats: z.object({
      total: z.number(),
      valid: z.number(),
      invalid: z.number(),
    }),
    processingOptions: z.object({
      validateData: z.boolean().default(true),
      transformData: z.boolean().default(true),
      generateAnalytics: z.boolean().default(true),
    }).optional(),
  }),
  outputSchema: z.object({
    transformedData: z.array(z.any()),
    transformationStats: z.object({
      transformed: z.number(),
      skipped: z.number(),
    }),
    validationStats: z.object({
      total: z.number(),
      valid: z.number(),
      invalid: z.number(),
    }),
    processingOptions: z.object({
      validateData: z.boolean().default(true),
      transformData: z.boolean().default(true),
      generateAnalytics: z.boolean().default(true),
    }).optional(),
  }),
  execute: async ({ inputData }) => {
    const { validData, validationStats, processingOptions } = inputData;

    if (!processingOptions?.transformData) {
      return {
        transformedData: validData,
        transformationStats: {
          transformed: validData.length,
          skipped: 0,
        },
        validationStats,
        processingOptions,
      };
    }

    const transformedData: any[] = [];
    let skipped = 0;

    // Example transformation logic
    for (const item of validData) {
      try {
        const transformed = {
          ...item,
          id: item.id || `generated_${Date.now()}_${Math.random()}`,
          processedAt: new Date().toISOString(),
          transformedFields: Object.keys(item).length,
        };
        transformedData.push(transformed);
      } catch (error) {
        skipped++;
      }
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      transformedData,
      transformationStats: {
        transformed: transformedData.length,
        skipped,
      },
      validationStats,
      processingOptions,
    };
  },
});

// Step 3: Analytics Generation
const generateAnalyticsStep = createStep({
  id: 'generate-analytics',
  description: 'Generates analytics and metadata for the processed data',
  inputSchema: z.object({
    transformedData: z.array(z.any()),
    transformationStats: z.object({
      transformed: z.number(),
      skipped: z.number(),
    }),
    validationStats: z.object({
      total: z.number(),
      valid: z.number(),
      invalid: z.number(),
    }),
    processingOptions: z.object({
      validateData: z.boolean().default(true),
      transformData: z.boolean().default(true),
      generateAnalytics: z.boolean().default(true),
    }).optional(),
  }),
  outputSchema: z.object({
    processedData: z.array(z.any()),
    analytics: z.object({
      totalRecords: z.number(),
      validRecords: z.number(),
      transformedRecords: z.number(),
      processingTime: z.number(),
    }),
    metadata: z.object({
      workflowId: z.string(),
      processedAt: z.string(),
      steps: z.array(z.string()),
    }),
  }),
  execute: async ({ inputData }) => {
    const { transformedData, transformationStats, validationStats, processingOptions } = inputData;
    const processingTime = Date.now();

    let analytics;
    if (processingOptions?.generateAnalytics) {
      analytics = {
        totalRecords: validationStats.total,
        validRecords: validationStats.valid,
        transformedRecords: transformationStats.transformed,
        processingTime: processingTime,
      };
    } else {
      analytics = {
        totalRecords: validationStats.total,
        validRecords: validationStats.valid,
        transformedRecords: transformationStats.transformed,
        processingTime: 0,
      };
    }

    const metadata = {
      workflowId: 'data-processing-pipeline',
      processedAt: new Date().toISOString(),
      steps: ['validate-data', 'transform-data', 'generate-analytics'],
    };

    return {
      processedData: transformedData,
      analytics,
      metadata,
    };
  },
});

// Chain the steps together
dataProcessingWorkflow
  .then(validateDataStep)
  .then(transformDataStep)
  .then(generateAnalyticsStep)
  .commit();

/**
 * Example workflow demonstrating conditional execution and branching
 */
export const conditionalWorkflow = createWorkflow({
  id: 'conditional-processing',
  description: 'Demonstrates conditional workflow execution based on input parameters',
  inputSchema: z.object({
    data: z.any(),
    processingType: z.enum(['simple', 'complex', 'batch']),
    options: z.object({
      async: z.boolean().default(false),
      retries: z.number().min(0).max(3).default(0),
    }).optional(),
  }),
  outputSchema: z.object({
    result: z.any(),
    processingType: z.string(),
    executionPath: z.array(z.string()),
    completed: z.boolean(),
  }),
});

const conditionalProcessingStep = createStep({
  id: 'conditional-processing',
  description: 'Processes data based on the specified processing type',
  inputSchema: z.object({
    data: z.any(),
    processingType: z.enum(['simple', 'complex', 'batch']),
    options: z.object({
      async: z.boolean().default(false),
      retries: z.number().min(0).max(3).default(0),
    }).optional(),
  }),
  outputSchema: z.object({
    result: z.any(),
    processingType: z.string(),
    executionPath: z.array(z.string()),
    completed: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { data, processingType, options } = inputData;
    const executionPath: string[] = ['conditional-processing'];
    let result: any;

    // Simulate different processing paths based on type
    switch (processingType) {
      case 'simple':
        executionPath.push('simple-processing');
        result = { processed: data, type: 'simple' };
        if (options?.async) {
          await new Promise(resolve => setTimeout(resolve, 100));
          executionPath.push('async-completion');
        }
        break;

      case 'complex':
        executionPath.push('complex-processing');
        // Simulate more complex processing
        await new Promise(resolve => setTimeout(resolve, 300));
        result = {
          processed: data,
          type: 'complex',
          complexity: 'high',
          processingTime: 300,
        };
        executionPath.push('complex-completion');
        break;

      case 'batch':
        executionPath.push('batch-processing');
        // Simulate batch processing
        const batchSize = Array.isArray(data) ? data.length : 1;
        await new Promise(resolve => setTimeout(resolve, batchSize * 50));
        result = {
          processed: data,
          type: 'batch',
          batchSize,
          processingTime: batchSize * 50,
        };
        executionPath.push('batch-completion');
        break;
    }

    return {
      result,
      processingType,
      executionPath,
      completed: true,
    };
  },
});

conditionalWorkflow.then(conditionalProcessingStep).commit();

// Export workflows for use in Mastra configuration
export const workflows = {
  dataProcessingWorkflow,
  conditionalWorkflow,
} as const;