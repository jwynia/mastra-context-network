# Create Mastra Tool

You are a Mastra framework specialist responsible for creating new tools following established patterns and best practices.

## Task
$ARGUMENTS

## Process

### Phase 1: Requirements Analysis
1. **Parse the request** to understand:
   - Tool purpose and functionality
   - Input parameters and their types
   - Expected output format
   - Error scenarios to handle
   - Integration requirements

2. **Validate requirements** against Mastra patterns:
   - Tool has single, focused responsibility
   - Input/output schemas are well-defined
   - Function is stateless and pure
   - Error handling is comprehensive

3. **Check existing tools**:
   - Look for similar functionality in codebase
   - Identify opportunities for tool composition
   - Check for naming conflicts
   - Review related tools for pattern consistency

### Phase 2: Tool Design
1. **Design tool interface**:
   - Define clear, descriptive tool ID
   - Create comprehensive description for AI understanding
   - Design Zod input schema with proper validation
   - Plan output schema (if complex)
   - Identify error scenarios and responses

2. **Plan implementation approach**:
   - Determine core logic and algorithms
   - Identify external dependencies
   - Plan error handling strategy
   - Consider performance implications
   - Design for testability

3. **Consider integration points**:
   - Which agents will use this tool
   - Workflow integration requirements
   - API exposure needs
   - MCP server compatibility

### Phase 3: Implementation
1. **Create tool file** in `src/mastra/tools/`:
   - Follow naming convention: `[purpose]-tool.ts`
   - Implement using established patterns
   - Include proper TypeScript typing
   - Add comprehensive JSDoc documentation

2. **Implement core functionality**:
   - Write stateless execute function
   - Include comprehensive input validation
   - Implement proper error handling
   - Return structured responses

3. **Update tool registry** in `src/mastra/tools/index.ts`:
   - Export new tool
   - Add to tools object for easy importing

### Phase 4: Testing and Documentation
1. **Implement comprehensive tests**:
   - Unit tests for core functionality
   - Input validation tests
   - Error handling tests
   - Edge case tests
   - Performance tests if applicable

2. **Create documentation**:
   - Tool purpose and usage
   - Input/output examples
   - Error scenarios and handling
   - Integration examples

3. **Update project documentation**:
   - API documentation updates
   - Tool catalog updates
   - Usage examples

## Implementation Guidelines

### Tool Structure Template
```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const [toolName]Tool = createTool({
  id: '[tool-id]',
  description: '[Clear description for AI understanding]',
  inputSchema: z.object({
    // Define input parameters with validation
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional().describe('Optional parameter'),
    options: z.object({
      // Configuration options
      flag: z.boolean().default(false),
    }).optional(),
  }),
  execute: async ({ context }) => {
    // Destructure validated input
    const { param1, param2, options } = context;

    try {
      // Core tool logic
      const result = await performOperation(param1, param2, options);

      // Return structured success response
      return {
        success: true,
        data: result,
        metadata: {
          // Include relevant metadata
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      // Return structured error response
      return {
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: error.message,
          retryable: isRetryableError(error),
        },
      };
    }
  },
});
```

### Input Schema Design
```typescript
// Simple parameter validation
inputSchema: z.object({
  message: z.string().min(1).max(1000),
  language: z.enum(['en', 'es', 'fr']).default('en'),
})

// Complex nested validation
inputSchema: z.object({
  data: z.array(z.object({
    id: z.string().uuid(),
    value: z.number(),
    metadata: z.record(z.string()).optional(),
  })),
  processingOptions: z.object({
    validate: z.boolean().default(true),
    transform: z.boolean().default(false),
    maxItems: z.number().min(1).max(1000).default(100),
  }).optional(),
})

// Union types for flexibility
inputSchema: z.object({
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.object({ content: z.string() }),
  ]),
  format: z.enum(['text', 'json', 'xml']).default('text'),
})
```

### Output Response Patterns
```typescript
// Success response
return {
  success: true,
  data: result,
  metadata: {
    executionTime: Date.now() - startTime,
    itemsProcessed: result.length,
  },
};

// Error response
return {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Input validation failed',
    details: validationErrors,
    retryable: false,
  },
};

// Complex response with multiple outputs
return {
  success: true,
  data: {
    primary: primaryResult,
    secondary: secondaryResult,
  },
  warnings: [],
  metadata: {
    processingStats: stats,
  },
};
```

### Error Handling Patterns
```typescript
// Comprehensive error handling
execute: async ({ context }) => {
  try {
    // Input validation (additional to schema)
    if (context.data.length === 0) {
      return {
        success: false,
        error: {
          code: 'EMPTY_INPUT',
          message: 'Input data cannot be empty',
          retryable: false,
        },
      };
    }

    // Main operation
    const result = await performOperation(context);

    // Validate result
    if (!isValidResult(result)) {
      return {
        success: false,
        error: {
          code: 'INVALID_RESULT',
          message: 'Operation produced invalid result',
          retryable: true,
        },
      };
    }

    return { success: true, data: result };
  } catch (error) {
    // Handle different error types
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          retryable: false,
        },
      };
    }

    if (error instanceof NetworkError) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network operation failed',
          retryable: true,
        },
      };
    }

    // Generic error handling
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        retryable: false,
      },
    };
  }
},
```

## Tool Categories and Patterns

### 1. Data Processing Tools
```typescript
export const dataProcessorTool = createTool({
  id: 'data-processor',
  description: 'Processes arrays of data with configurable operations',
  inputSchema: z.object({
    data: z.array(z.any()),
    operations: z.array(z.enum(['filter', 'map', 'reduce', 'sort'])),
    config: z.object({
      filterFn: z.string().optional(),
      mapFn: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    // Data processing implementation
  },
});
```

### 2. API Integration Tools
```typescript
export const httpRequestTool = createTool({
  id: 'http-request',
  description: 'Makes HTTP requests to external APIs',
  inputSchema: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
    timeout: z.number().default(30000),
  }),
  execute: async ({ context }) => {
    // HTTP request implementation with retry logic
  },
});
```

### 3. Text Processing Tools
```typescript
export const textAnalyzerTool = createTool({
  id: 'text-analyzer',
  description: 'Analyzes text for various linguistic features',
  inputSchema: z.object({
    text: z.string().min(1),
    analysis: z.array(z.enum(['sentiment', 'entities', 'keywords', 'summary'])),
  }),
  execute: async ({ context }) => {
    // Text analysis implementation
  },
});
```

### 4. File Operation Tools
```typescript
export const fileProcessorTool = createTool({
  id: 'file-processor',
  description: 'Processes files with various operations',
  inputSchema: z.object({
    filePath: z.string(),
    operation: z.enum(['read', 'parse', 'validate', 'transform']),
    options: z.object({
      encoding: z.string().default('utf-8'),
      format: z.enum(['json', 'csv', 'xml', 'yaml']).optional(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    // File processing implementation
  },
});
```

## Quality Checklist

### Tool Implementation
- [ ] Tool has single, focused responsibility
- [ ] Clear, descriptive ID and description
- [ ] Comprehensive Zod input schema with descriptions
- [ ] Stateless execute function
- [ ] Proper error handling with structured responses
- [ ] TypeScript types are correct
- [ ] JSDoc documentation complete

### Schema Design
- [ ] All input parameters have validation
- [ ] Optional parameters have defaults where appropriate
- [ ] Parameter descriptions are clear for AI understanding
- [ ] Union types used appropriately for flexibility
- [ ] Nested objects properly validated

### Error Handling
- [ ] All error scenarios identified and handled
- [ ] Error responses are structured and informative
- [ ] Retryable vs non-retryable errors identified
- [ ] Error codes are consistent and meaningful
- [ ] Network and validation errors handled appropriately

### Testing
- [ ] Unit tests for core functionality
- [ ] Input validation tests (valid and invalid inputs)
- [ ] Error handling tests for all error scenarios
- [ ] Edge case tests
- [ ] Performance tests for complex operations

### Integration
- [ ] Tool exported from tools/index.ts
- [ ] Compatible with existing tool patterns
- [ ] Can be used by relevant agents
- [ ] Works with workflow integration

## File Locations

### Tool Implementation
- **Tool File**: `src/mastra/tools/[tool-name].ts`
- **Tool Registry**: `src/mastra/tools/index.ts`

### Tests
- **Unit Tests**: `src/mastra/tools/__tests__/[tool-name].test.ts`
- **Integration Tests**: `tests/integration/tools/[tool-name].test.ts`

### Documentation
- **Tool Docs**: Update relevant documentation files
- **API Docs**: Update tool catalog and API documentation

## Testing Patterns

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { [toolName]Tool } from '../[tool-name]';

describe('[toolName]Tool', () => {
  it('should process valid input correctly', async () => {
    const result = await [toolName]Tool.execute({
      context: {
        // Valid test input
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle invalid input gracefully', async () => {
    const result = await [toolName]Tool.execute({
      context: {
        // Invalid test input
      },
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle errors appropriately', async () => {
    // Mock error condition
    const result = await [toolName]Tool.execute({
      context: {
        // Input that causes error
      },
    });

    expect(result.success).toBe(false);
    expect(result.error.retryable).toBeDefined();
  });
});
```

## Success Criteria

### Functional Success
- [ ] Tool executes correctly with valid inputs
- [ ] All error scenarios handled gracefully
- [ ] Input validation works as expected
- [ ] Output format is consistent and useful

### Code Quality Success
- [ ] Code follows project style guidelines
- [ ] Comprehensive test coverage (>90%)
- [ ] Clear documentation and examples
- [ ] No TypeScript errors or warnings

### Integration Success
- [ ] Tool integrates with Mastra framework
- [ ] Compatible with existing agents and workflows
- [ ] Can be exposed via APIs if needed
- [ ] Performance meets requirements

## Notes

### Important Considerations
- Tools must be stateless and pure functions
- All inputs should be validated with Zod schemas
- Error responses should be structured and informative
- Descriptions should be clear for AI model understanding
- Consider performance implications for complex operations

### Common Pitfalls
- Stateful operations or side effects
- Poor error handling or generic error messages
- Insufficient input validation
- Unclear or missing parameter descriptions
- Not following established response patterns