# Create Mastra Workflow

You are a Mastra framework specialist responsible for creating new workflows following established patterns and best practices.

## Task
$ARGUMENTS

## Process

### Phase 1: Requirements Analysis
1. **Parse the request** to understand:
   - Workflow purpose and business logic
   - Input data structure and validation needs
   - Required processing steps and their sequence
   - Output format and structure
   - Error handling requirements
   - Suspend/resume capabilities needed

2. **Validate requirements** against Mastra patterns:
   - Workflow has clear, focused purpose
   - Steps are atomic and well-defined
   - Data flow between steps is logical
   - Error handling is comprehensive
   - Workflow can be suspended and resumed

3. **Analyze step dependencies**:
   - Identify step execution order
   - Map data dependencies between steps
   - Identify potential parallel execution opportunities
   - Check for circular dependencies

### Phase 2: Workflow Design
1. **Design workflow architecture**:
   - Define workflow ID, description, and schemas
   - Break down process into atomic steps
   - Design data contracts between steps
   - Plan error handling and recovery
   - Consider suspend/resume points

2. **Design individual steps**:
   - Define step IDs and descriptions
   - Create input/output schemas for each step
   - Plan step execution logic
   - Identify checkpoint requirements
   - Design error handling per step

3. **Plan integration**:
   - How workflow fits into agent orchestration
   - API exposure requirements
   - MCP server compatibility
   - Tool integration needs

### Phase 3: Implementation
1. **Create workflow file** in `src/mastra/workflows/`:
   - Follow naming convention: `[purpose]-workflow.ts`
   - Implement using established patterns
   - Include proper TypeScript typing
   - Add comprehensive JSDoc documentation

2. **Implement workflow structure**:
   - Create workflow with createWorkflow()
   - Define comprehensive input/output schemas
   - Set up workflow configuration

3. **Implement workflow steps**:
   - Create each step with createStep()
   - Implement step execution logic
   - Add proper error handling
   - Include checkpoint logic for suspend/resume

4. **Chain and commit workflow**:
   - Chain steps in correct order
   - Commit workflow to finalize structure

5. **Update workflow registry** in `src/mastra/workflows/index.ts`:
   - Export new workflow
   - Add to workflows object

6. **Update main Mastra configuration** in `src/mastra/index.ts`:
   - Register workflow in Mastra instance

### Phase 4: Testing and Documentation
1. **Implement comprehensive tests**:
   - Unit tests for individual steps
   - Integration tests for complete workflow
   - Error handling tests
   - Suspend/resume tests
   - Performance tests for complex workflows

2. **Create documentation**:
   - Workflow purpose and use cases
   - Step-by-step execution flow
   - Input/output examples
   - Error scenarios and handling
   - Suspend/resume capabilities

3. **Update project documentation**:
   - API documentation updates
   - Workflow catalog updates
   - Integration examples

## Implementation Guidelines

### Workflow Structure Template
```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

export const [workflowName]Workflow = createWorkflow({
  id: '[workflow-id]',
  description: '[Clear description of workflow purpose and process]',
  inputSchema: z.object({
    // Define input parameters with validation
    data: z.array(z.any()),
    options: z.object({
      // Processing options
      validate: z.boolean().default(true),
      transform: z.boolean().default(false),
    }).optional(),
  }),
  outputSchema: z.object({
    // Define expected output structure
    result: z.array(z.any()),
    metadata: z.object({
      stepsExecuted: z.array(z.string()),
      executionTime: z.number(),
      recordsProcessed: z.number(),
    }),
  }),
});

// Step implementations
const step1 = createStep({
  id: 'step-1-validation',
  description: 'Validates input data quality and structure',
  inputSchema: z.object({
    data: z.array(z.any()),
    options: z.object({
      validate: z.boolean(),
    }).optional(),
  }),
  outputSchema: z.object({
    validData: z.array(z.any()),
    invalidData: z.array(z.any()),
    validationSummary: z.object({
      totalRecords: z.number(),
      validRecords: z.number(),
      invalidRecords: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    // Step implementation logic
    const { data, options } = inputData;

    // Processing logic with error handling
    try {
      const result = await processStep1(data, options);
      return result;
    } catch (error) {
      // Handle step-specific errors
      throw new Error(`Step 1 failed: ${error.message}`);
    }
  },
});

const step2 = createStep({
  id: 'step-2-processing',
  description: 'Processes validated data according to business rules',
  inputSchema: z.object({
    validData: z.array(z.any()),
    invalidData: z.array(z.any()),
    validationSummary: z.object({
      totalRecords: z.number(),
      validRecords: z.number(),
      invalidRecords: z.number(),
    }),
  }),
  outputSchema: z.object({
    processedData: z.array(z.any()),
    processingMetadata: z.object({
      itemsProcessed: z.number(),
      processingTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    // Step 2 implementation
    const { validData } = inputData;

    // Long-running operation with checkpoints
    const result = await processWithCheckpoints(validData, {
      onProgress: async (progress) => {
        // Save checkpoint for resume capability
        await saveCheckpoint('step-2-processing', progress);
      },
    });

    return result;
  },
});

const step3 = createStep({
  id: 'step-3-finalization',
  description: 'Finalizes processing and generates output metadata',
  inputSchema: z.object({
    processedData: z.array(z.any()),
    processingMetadata: z.object({
      itemsProcessed: z.number(),
      processingTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    result: z.array(z.any()),
    metadata: z.object({
      stepsExecuted: z.array(z.string()),
      executionTime: z.number(),
      recordsProcessed: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    // Final step implementation
    const { processedData, processingMetadata } = inputData;

    return {
      result: processedData,
      metadata: {
        stepsExecuted: ['step-1-validation', 'step-2-processing', 'step-3-finalization'],
        executionTime: processingMetadata.processingTime,
        recordsProcessed: processingMetadata.itemsProcessed,
      },
    };
  },
});

// Chain steps and commit
[workflowName]Workflow
  .then(step1)
  .then(step2)
  .then(step3)
  .commit();
```

## Workflow Patterns

### 1. Data Processing Pipeline
```typescript
export const dataProcessingWorkflow = createWorkflow({
  id: 'data-processing-pipeline',
  description: 'Complete data processing pipeline with validation, transformation, and analysis',
  inputSchema: z.object({
    rawData: z.array(z.any()),
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
    }),
    metadata: z.object({
      workflowId: z.string(),
      processedAt: z.string(),
      executionTime: z.number(),
    }),
  }),
});
```

### 2. Multi-Branch Workflow
```typescript
export const conditionalWorkflow = createWorkflow({
  id: 'conditional-processing',
  description: 'Workflow with conditional execution paths based on input data',
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
    processingPath: z.string(),
    executionMetadata: z.object({
      path: z.array(z.string()),
      duration: z.number(),
    }),
  }),
});
```

### 3. Parallel Processing Workflow
```typescript
export const parallelProcessingWorkflow = createWorkflow({
  id: 'parallel-processing',
  description: 'Processes multiple data streams in parallel with coordination',
  inputSchema: z.object({
    datasets: z.array(z.object({
      id: z.string(),
      data: z.array(z.any()),
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
```

## Step Implementation Patterns

### 1. Validation Step
```typescript
const validationStep = createStep({
  id: 'validation',
  description: 'Validates input data against business rules',
  inputSchema: z.object({
    data: z.array(z.any()),
    validationRules: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    validData: z.array(z.any()),
    invalidData: z.array(z.object({
      item: z.any(),
      errors: z.array(z.string()),
    })),
    summary: z.object({
      total: z.number(),
      valid: z.number(),
      invalid: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { data, validationRules } = inputData;
    const validData: any[] = [];
    const invalidData: any[] = [];

    for (const item of data) {
      const validation = await validateItem(item, validationRules);
      if (validation.isValid) {
        validData.push(item);
      } else {
        invalidData.push({
          item,
          errors: validation.errors,
        });
      }
    }

    return {
      validData,
      invalidData,
      summary: {
        total: data.length,
        valid: validData.length,
        invalid: invalidData.length,
      },
    };
  },
});
```

### 2. Transformation Step
```typescript
const transformationStep = createStep({
  id: 'transformation',
  description: 'Transforms data according to specified rules',
  inputSchema: z.object({
    data: z.array(z.any()),
    transformRules: z.object({
      mapping: z.record(z.string()).optional(),
      filters: z.array(z.string()).optional(),
    }).optional(),
  }),
  outputSchema: z.object({
    transformedData: z.array(z.any()),
    transformationStats: z.object({
      itemsTransformed: z.number(),
      transformationTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { data, transformRules } = inputData;
    const startTime = Date.now();

    const transformedData = await Promise.all(
      data.map(item => transformItem(item, transformRules))
    );

    return {
      transformedData,
      transformationStats: {
        itemsTransformed: transformedData.length,
        transformationTime: Date.now() - startTime,
      },
    };
  },
});
```

### 3. Aggregation Step
```typescript
const aggregationStep = createStep({
  id: 'aggregation',
  description: 'Aggregates processed data and generates summary statistics',
  inputSchema: z.object({
    data: z.array(z.any()),
    aggregationRules: z.object({
      groupBy: z.array(z.string()).optional(),
      metrics: z.array(z.enum(['count', 'sum', 'avg', 'min', 'max'])).optional(),
    }).optional(),
  }),
  outputSchema: z.object({
    aggregatedData: z.any(),
    statistics: z.object({
      recordCount: z.number(),
      groupCount: z.number(),
      metrics: z.record(z.number()),
    }),
  }),
  execute: async ({ inputData }) => {
    const { data, aggregationRules } = inputData;

    const aggregated = await aggregateData(data, aggregationRules);
    const statistics = calculateStatistics(aggregated);

    return {
      aggregatedData: aggregated,
      statistics,
    };
  },
});
```

## Error Handling Patterns

### Step-Level Error Handling
```typescript
const resilientStep = createStep({
  id: 'resilient-step',
  execute: async ({ inputData }) => {
    try {
      // Main step logic
      const result = await performOperation(inputData);
      return result;
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError) {
        // Return partial success with validation issues
        return {
          partialData: error.validData,
          errors: error.validationErrors,
          success: false,
        };
      }

      if (error instanceof NetworkError && error.retryable) {
        // Retry logic for network errors
        return await retry(() => performOperation(inputData), {
          retries: 3,
          delay: 1000,
        });
      }

      // Re-throw unhandleable errors
      throw new Error(`Step failed: ${error.message}`);
    }
  },
});
```

### Workflow-Level Error Recovery
```typescript
// Error recovery step
const errorRecoveryStep = createStep({
  id: 'error-recovery',
  description: 'Handles and recovers from workflow errors',
  inputSchema: z.object({
    originalInput: z.any(),
    errorInfo: z.object({
      step: z.string(),
      error: z.string(),
    }),
  }),
  outputSchema: z.object({
    recoveredData: z.any(),
    recoveryStrategy: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { originalInput, errorInfo } = inputData;

    // Implement recovery strategies based on error type
    switch (errorInfo.step) {
      case 'validation':
        return await recoverFromValidationError(originalInput);
      case 'transformation':
        return await recoverFromTransformationError(originalInput);
      default:
        throw new Error(`No recovery strategy for step: ${errorInfo.step}`);
    }
  },
});
```

## Suspend/Resume Implementation

### Checkpoint Management
```typescript
const suspendableStep = createStep({
  id: 'long-running-step',
  execute: async ({ inputData, checkpoint }) => {
    // Check for existing checkpoint
    if (checkpoint?.progress) {
      console.log('Resuming from checkpoint:', checkpoint.progress);
      return await resumeOperation(inputData, checkpoint);
    }

    // Start new operation with checkpoint saving
    return await startOperation(inputData, {
      onProgress: async (progress) => {
        // Save checkpoint for potential resume
        await saveCheckpoint('long-running-step', {
          progress,
          timestamp: Date.now(),
          inputData,
        });
      },
    });
  },
});
```

## Quality Checklist

### Workflow Design
- [ ] Clear, focused workflow purpose
- [ ] Atomic, well-defined steps
- [ ] Logical data flow between steps
- [ ] Comprehensive input/output schemas
- [ ] Proper error handling strategy
- [ ] Suspend/resume capabilities where appropriate

### Implementation Quality
- [ ] All steps have descriptive IDs and descriptions
- [ ] Input/output schemas are comprehensive
- [ ] Error handling is robust
- [ ] Code follows project standards
- [ ] TypeScript types are correct
- [ ] JSDoc documentation complete

### Testing Coverage
- [ ] Unit tests for individual steps
- [ ] Integration tests for complete workflow
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Performance tests for complex workflows
- [ ] Suspend/resume tests

### Integration
- [ ] Workflow exported from workflows/index.ts
- [ ] Registered in main Mastra configuration
- [ ] Compatible with agent orchestration
- [ ] Can be exposed via APIs if needed

## File Locations

### Workflow Implementation
- **Workflow File**: `src/mastra/workflows/[workflow-name].ts`
- **Workflow Registry**: `src/mastra/workflows/index.ts`
- **Main Config**: `src/mastra/index.ts`

### Tests
- **Unit Tests**: `src/mastra/workflows/__tests__/[workflow-name].test.ts`
- **Integration Tests**: `tests/integration/workflows/[workflow-name].test.ts`

### Documentation
- **Workflow Docs**: Update relevant documentation files
- **API Docs**: Update workflow catalog and API documentation

## Success Criteria

### Functional Success
- [ ] Workflow executes correctly with valid inputs
- [ ] All steps execute in proper sequence
- [ ] Error handling works as expected
- [ ] Suspend/resume functionality works
- [ ] Output format is consistent and useful

### Code Quality Success
- [ ] Code follows project style guidelines
- [ ] Comprehensive test coverage (>90%)
- [ ] Clear documentation and examples
- [ ] No TypeScript errors or warnings

### Integration Success
- [ ] Workflow integrates with Mastra framework
- [ ] Compatible with existing agents
- [ ] Can be exposed via APIs if needed
- [ ] Performance meets requirements

## Notes

### Important Considerations
- Steps should be atomic and focused on single concerns
- Data schemas must be explicit and comprehensive
- Error handling should allow for recovery and continuation
- Consider long-running operations and suspend/resume needs
- Think about parallel execution opportunities

### Common Pitfalls
- Steps that are too complex or do multiple things
- Poor data contracts between steps
- Insufficient error handling
- Not considering suspend/resume requirements
- Circular dependencies between steps