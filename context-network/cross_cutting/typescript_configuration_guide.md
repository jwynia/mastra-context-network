# TypeScript Configuration Guide for LLM Agent Projects

## Purpose
This document provides comprehensive guidelines for configuring TypeScript in LLM agent projects using the Mastra framework, including tsconfig.json best practices, compiler options, and agent-specific project structure recommendations.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### TypeScript Configuration Principles

#### Core Configuration Goals

1. **Type Safety First**
   - Enable strict mode for maximum type safety
   - Catch errors at compile time rather than runtime
   - Provide excellent developer experience with IDE support

2. **Modern JavaScript Standards**
   - Target modern ECMAScript versions compatible with Node.js
   - Use latest module resolution strategies
   - Leverage modern JavaScript features

3. **Development Efficiency**
   - Fast compilation times
   - Excellent debugging support
   - Clear error messages and diagnostics

4. **Production Readiness**
   - Optimized output for deployment
   - Source maps for debugging
   - Declaration files for library publishing

### Recommended Base Configuration

#### Standard Mastra Agent TypeScript Configuration

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",                    // Modern JS features supported by Node.js 18+
    "module": "NodeNext",                  // Use NodeNext for ESM/CJS interop
    "moduleResolution": "NodeNext",        // Modern module resolution
    "lib": ["ES2022"],                     // Include standard library definitions
    
    // Type Checking
    "strict": true,                        // Enable all strict type-checking options
    "noImplicitAny": true,                 // Error on expressions with implied 'any' type
    "strictNullChecks": true,              // Enable strict null checks
    "strictFunctionTypes": true,           // Enable strict checking of function types
    "strictBindCallApply": true,           // Enable strict 'bind', 'call', and 'apply'
    "strictPropertyInitialization": true, // Enable strict checking of property initialization
    "noImplicitThis": true,                // Error on 'this' expressions with implied 'any'
    "alwaysStrict": true,                  // Parse in strict mode and emit "use strict"
    "noImplicitReturns": true,             // Error when not all code paths return a value
    "noFallthroughCasesInSwitch": true,    // Error on fallthrough cases in switch
    "noUncheckedIndexedAccess": true,      // Add 'undefined' to index signature results
    "noImplicitOverride": true,            // Ensure overriding members are marked with override
    "exactOptionalPropertyTypes": true,    // Interpret optional property types as written
    
    // Module Resolution
    "esModuleInterop": true,               // Enables emit interoperability between CommonJS and ES Modules
    "allowSyntheticDefaultImports": true,  // Allow default imports from modules with no default export
    "forceConsistentCasingInFileNames": true, // Ensure consistent casing in file names
    "resolveJsonModule": true,             // Include modules imported with '.json' extension
    
    // Emit
    "outDir": "./dist",                    // Redirect output structure to the directory
    "rootDir": "./src",                    // Specify the root directory of input files
    "sourceMap": true,                     // Generate corresponding '.map' file
    "declaration": true,                   // Generate corresponding '.d.ts' file
    "declarationMap": true,                // Generate a sourcemap for each corresponding '.d.ts' file
    "removeComments": false,               // Keep comments in output for better debugging
    "importHelpers": true,                 // Import emit helpers from 'tslib'
    "downlevelIteration": true,            // Provide full support for iterables in 'for-of', spread, and destructuring
    
    // Interop Constraints
    "isolatedModules": true,               // Ensure each file can be safely transpiled without relying on other imports
    "allowJs": false,                      // Don't allow JavaScript files to be compiled
    "checkJs": false,                      // Don't report errors in JavaScript files
    
    // Completeness
    "skipLibCheck": true,                  // Skip type checking of declaration files (improves performance)
    
    // Advanced
    "incremental": true,                   // Enable incremental compilation
    "tsBuildInfoFile": "./dist/.tsbuildinfo", // Specify file to store incremental compilation information
    "experimentalDecorators": true,        // Enable experimental support for decorators
    "emitDecoratorMetadata": true          // Enable experimental support for emitting type metadata for decorators
  },
  "include": [
    "src/**/*"                             // Include all files in src directory
  ],
  "exclude": [
    "node_modules",                        // Exclude node_modules
    "dist",                                // Exclude build output
    "**/*.test.ts",                        // Exclude test files from main build
    "**/*.spec.ts"                         // Exclude spec files from main build
  ],
  "ts-node": {
    "esm": true                            // Enable ESM support in ts-node
  }
}
```

#### Agent-Specific Configurations

**Mastra Agent Projects:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,        // For Mastra decorators
    "emitDecoratorMetadata": true,         // For dependency injection
    "types": ["node"],
    "resolveJsonModule": true,             // For configuration files
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "src/**/*",
    "src/mastra/**/*"                      // Include Mastra-specific files
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}
```

**Agent Tool Development:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,                   // For tool type definitions
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true,                     // Enable project references
    "types": ["node", "@mastra/core"]      // Include Mastra types
  }
}
```

**Agent Workflow Projects:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "@mastra/core"],
    "baseUrl": "./src",
    "paths": {
      "@/agents/*": ["mastra/agents/*"],
      "@/tools/*": ["mastra/tools/*"],
      "@/workflows/*": ["mastra/workflows/*"],
      "@/config/*": ["config/*"]
    }
  }
}
```

### Configuration Strategies by Agent Type

#### Conversational Agent

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "@mastra/core"],
    "baseUrl": "./src",
    "paths": {
      "@/agents/*": ["mastra/agents/*"],
      "@/memory/*": ["mastra/memory/*"],
      "@/config/*": ["config/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Multi-Tool Agent

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "@mastra/core", "@mastra/github", "@mastra/slack"],
    "baseUrl": "./src",
    "paths": {
      "@/agents/*": ["mastra/agents/*"],
      "@/tools/*": ["mastra/tools/*"],
      "@/integrations/*": ["mastra/integrations/*"]
    }
  }
}
```

#### Workflow-Orchestrated Agent

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "@mastra/core"],
    "baseUrl": "./src",
    "paths": {
      "@/workflows/*": ["mastra/workflows/*"],
      "@/steps/*": ["mastra/workflows/steps/*"],
      "@/agents/*": ["mastra/agents/*"],
      "@/tools/*": ["mastra/tools/*"]
    }
  },
  "include": [
    "src/**/*",
    "src/mastra/workflows/**/*"
  ]
}
```

### Advanced Configuration Patterns

#### Monorepo Configuration

**Root tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "./packages/api" },
    { "path": "./packages/web" },
    { "path": "./packages/shared" }
  ]
}
```

**Package-specific tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

#### Testing Configuration

**tsconfig.test.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "noEmit": true
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

#### Development vs Production

**tsconfig.dev.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": true,
    "removeComments": false,
    "incremental": true
  }
}
```

**tsconfig.prod.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "removeComments": true,
    "incremental": false
  }
}
```

### Path Mapping and Module Resolution

#### Path Mapping Configuration for Agents

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/agents/*": ["mastra/agents/*"],
      "@/tools/*": ["mastra/tools/*"],
      "@/workflows/*": ["mastra/workflows/*"],
      "@/memory/*": ["mastra/memory/*"],
      "@/config/*": ["config/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"],
      "@/integrations/*": ["mastra/integrations/*"]
    }
  }
}
```

#### Module Resolution Strategies

```typescript
// For different module systems
{
  "compilerOptions": {
    // For ESM projects
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    // For CommonJS projects
    "module": "CommonJS",
    "moduleResolution": "node",
    
    // For hybrid projects
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### Performance Optimization

#### Build Performance

```json
{
  "compilerOptions": {
    "skipLibCheck": true,                  // Skip type checking of declaration files
    "incremental": true,                   // Enable incremental compilation
    "tsBuildInfoFile": "./.tsbuildinfo",   // Store incremental info
    "assumeChangesOnlyAffectDirectDependencies": true
  },
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts",
    "coverage",
    "dist"
  ]
}
```

#### Memory Usage Optimization

```json
{
  "compilerOptions": {
    "preserveWatchOutput": true,
    "pretty": true
  },
  "watchOptions": {
    "watchFile": "useFsEvents",
    "watchDirectory": "useFsEvents",
    "fallbackPolling": "dynamicPriority",
    "synchronousWatchDirectory": true,
    "excludeDirectories": ["**/node_modules", "_build"]
  }
}
```

### Type Declaration Management

#### Custom Type Declarations for Agents

**types/global.d.ts:**
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      OPENROUTER_API_KEY: string;
      OPENROUTER_HTTP_REFERER?: string;
      OPENROUTER_X_TITLE?: string;
      MASTRA_LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
      UPSTASH_REDIS_URL?: string;
      UPSTASH_REDIS_TOKEN?: string;
      DAILY_BUDGET?: string;
      WEEKLY_BUDGET?: string;
    }
  }
}

declare module '*.json' {
  const value: any;
  export default value;
}

// Mastra-specific type augmentations
declare module '@mastra/core' {
  interface AgentContext {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }
}

export {};
```

#### Agent-Specific Module Augmentation

```typescript
// types/mastra.d.ts
import { Agent, Tool, Workflow } from '@mastra/core';

declare module '@mastra/core' {
  interface MastraConfig {
    agents: Record<string, Agent>;
    tools: Record<string, Tool>;
    workflows: Record<string, Workflow>;
    openRouter?: {
      apiKey: string;
      defaultModel?: string;
      fallbackModel?: string;
    };
  }
}

// Custom tool types
export interface CustomToolContext {
  userId: string;
  sessionId: string;
  permissions: string[];
}

// Agent response types
export interface AgentResponse<T = any> {
  content: string;
  data?: T;
  metadata: {
    model: string;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
    latency: number;
  };
}
```

### Configuration Validation

#### Runtime Configuration Validation for Agents

```typescript
// src/config/agent-config.ts
import { z } from 'zod';

const AgentConfigSchema = z.object({
  name: z.string(),
  instructions: z.string(),
  model: z.object({
    provider: z.literal('OPEN_ROUTER'),
    name: z.string(),
    apiKey: z.string(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
  }),
  tools: z.record(z.string()).optional(),
  memory: z.union([
    z.boolean(),
    z.object({
      type: z.enum(['thread', 'semantic']),
      maxMessages: z.number().positive().optional(),
      summarizeAfter: z.number().positive().optional(),
    })
  ]).optional(),
});

const OpenRouterConfigSchema = z.object({
  apiKey: z.string().startsWith('sk-or-'),
  baseURL: z.string().url(),
  defaultHeaders: z.record(z.string()).optional(),
  models: z.object({
    premium: z.record(z.string()),
    fast: z.record(z.string()),
    specialized: z.record(z.string()),
  }),
});

export const validateAgentConfig = (config: unknown) => {
  return AgentConfigSchema.parse(config);
};

export const validateOpenRouterConfig = (config: unknown) => {
  return OpenRouterConfigSchema.parse(config);
};

// Environment validation
const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().startsWith('sk-or-'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MASTRA_LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
  DAILY_BUDGET: z.string().transform(Number).pipe(z.number().positive()).optional(),
  WEEKLY_BUDGET: z.string().transform(Number).pipe(z.number().positive()).optional(),
});

export const validateEnvironment = () => {
  return EnvSchema.parse(process.env);
};
```

### Best Practices Checklist

#### Development Setup
- [ ] Enable strict mode for all new projects
- [ ] Use modern target (ES2020+) compatible with Node.js version
- [ ] Configure path mapping for cleaner imports
- [ ] Set up incremental compilation for faster builds
- [ ] Include source maps for debugging
- [ ] Configure proper include/exclude patterns

#### Type Safety
- [ ] Enable all strict type checking options
- [ ] Use `noUncheckedIndexedAccess` for safer array/object access
- [ ] Configure `exactOptionalPropertyTypes` for precise optional handling
- [ ] Set up proper type declarations for environment variables
- [ ] Use branded types for sensitive data

#### Performance
- [ ] Enable `skipLibCheck` for faster compilation
- [ ] Use incremental compilation
- [ ] Optimize watch options for development
- [ ] Exclude unnecessary files from compilation
- [ ] Use project references for monorepos

#### Production
- [ ] Generate declaration files for libraries
- [ ] Configure proper output directories
- [ ] Set up build optimization flags
- [ ] Enable tree shaking compatible settings
- [ ] Configure proper module resolution

### Common Configuration Issues and Solutions

#### Issue: Slow Compilation

**Solution:**
```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "incremental": true,
    "assumeChangesOnlyAffectDirectDependencies": true
  },
  "exclude": ["node_modules", "**/*.test.ts", "dist"]
}
```

#### Issue: Module Resolution Errors

**Solution:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true
  }
}
```

#### Issue: Decorator Errors

**Solution:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Tools and Integration

#### Package.json Scripts for Agents

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "build:prod": "tsc --project tsconfig.prod.json",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:agents": "vitest run tests/agents",
    "test:tools": "vitest run tests/tools",
    "test:workflows": "vitest run tests/workflows",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "agent:create": "npx @mastra/cli agent create",
    "tool:create": "npx @mastra/cli tool create",
    "workflow:create": "npx @mastra/cli workflow create"
  }
}
```

#### IDE Configuration

**VS Code settings.json:**
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** None
- **Related Nodes:** 
  - [cross_cutting/mastra_integration_guide.md] - complements - Mastra framework TypeScript integration
  - [cross_cutting/openrouter_configuration_guide.md] - uses - OpenRouter API TypeScript types
  - [cross_cutting/nodejs_security_guide.md] - complements - TypeScript security considerations for agents
  - [processes/creation.md] - implements - TypeScript setup in agent creation process

## Navigation Guidance
- **Access Context:** Use this document when setting up TypeScript configuration for LLM agents or optimizing existing agent setups
- **Common Next Steps:** After configuring TypeScript, typically set up Mastra integration, OpenRouter configuration, and agent testing
- **Related Tasks:** Agent project setup, build optimization, type safety implementation, Mastra integration
- **Update Patterns:** This document should be updated when new TypeScript versions, Mastra framework updates, or agent development patterns introduce breaking changes or new features

## Metadata
- **Created:** 2025-06-26
- **Last Updated:** 2025-06-26
- **Updated By:** Cline
- **Sources:** TypeScript Official Documentation, TSConfig Reference, Total TypeScript

## Change History
- 2025-06-30: Transformed to focus on TypeScript LLM agent development with Mastra framework
- 2025-06-26: Initial creation based on current TypeScript best practices and configuration recommendations
