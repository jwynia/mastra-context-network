# Mastra Environment Setup Guide

## Overview

This guide covers environment configuration, local development setup, database initialization, and security practices for Mastra applications.

## Environment Variables

### Core Configuration

```bash
# .env.example
# Node Environment
NODE_ENV=development  # development | production | test

# Server Configuration
PORT=3000
HOST=localhost

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# Telemetry and Observability
TELEMETRY_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### AI Model Configuration

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...  # Optional
OPENAI_BASE_URL=https://api.openai.com/v1  # For proxies or alternatives

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_GENERATIVE_AI_API_KEY=...

# Groq
GROQ_API_KEY=gsk_...

# Fireworks
FIREWORKS_API_KEY=fw_...
```

### Database Configuration

```bash
# LibSQL (SQLite-based, default for development)
DATABASE_URL=file:./mastra.db
# For Turso (LibSQL cloud)
DATABASE_URL=libsql://[project].turso.io
DATABASE_AUTH_TOKEN=...

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/mastra
# Connection pool settings
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_IDLE_TIMEOUT=30000

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Vector Store Configuration

```bash
# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=mastra-vectors

# Chroma
CHROMA_URL=http://localhost:8000
CHROMA_API_KEY=...  # Optional

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...
```

### Security Configuration

```bash
# Authentication
AUTH_ENABLED=false  # Set to true in production
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true
```

## Environment Variable Management Strategies

### 1. Type-Safe Environment Variables

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),

  // API Keys (required in production)
  OPENAI_API_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().default('file:./mastra.db'),

  // Optional features
  TELEMETRY_ENABLED: z.string()
    .transform(val => val === 'true')
    .default('false'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Security (optional in dev, required in production)
  JWT_SECRET: z.string().optional(),
  AUTH_ENABLED: z.string()
    .transform(val => val === 'true')
    .default('false'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);

    // Production-specific validation
    if (env.NODE_ENV === 'production') {
      if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required in production');
      }
      if (env.DATABASE_URL.startsWith('file:')) {
        console.warn('Warning: Using file-based database in production');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
```

### 2. Environment-Specific Configuration

```typescript
// src/config/index.ts
import { env } from './env';

export const config = {
  development: {
    logger: {
      level: 'debug',
      pretty: true,
    },
    server: {
      cors: { origin: true }, // Allow all origins in dev
    },
    telemetry: {
      enabled: false,
    },
    storage: {
      url: 'file:./mastra.db',
    },
  },

  production: {
    logger: {
      level: 'warn',
      pretty: false,
    },
    server: {
      cors: {
        origin: env.CORS_ORIGIN?.split(',') || [],
        credentials: true,
      },
    },
    telemetry: {
      enabled: true,
      serviceName: 'mastra-app',
    },
    storage: {
      url: env.DATABASE_URL,
      poolSize: 20,
    },
  },

  test: {
    logger: {
      level: 'error',
      pretty: false,
    },
    server: {
      cors: { origin: true },
    },
    telemetry: {
      enabled: false,
    },
    storage: {
      url: ':memory:', // In-memory for tests
    },
  },
}[env.NODE_ENV];
```

## Local Development Setup

### 1. Initial Setup Steps

```bash
# Clone and setup
git clone <your-repo>
cd <project>

# Enable correct pnpm version
corepack enable

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# At minimum, add OPENAI_API_KEY or another LLM provider key

# Build the application
pnpm build

# Start development services (if needed)
pnpm dev:services:up
```

### 2. Docker Services Setup

For integration tests and development with external services:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mastra_dev
      POSTGRES_USER: mastra
      POSTGRES_PASSWORD: mastra_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mastra"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  redis_data:
  chroma_data:
  qdrant_data:
```

**Management Commands**:
```bash
# Start all services
pnpm dev:services:up
# or
docker-compose up -d

# Check service health
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Stop all services
pnpm dev:services:down
# or
docker-compose down

# Stop and remove volumes (clean state)
docker-compose down -v
```

### 3. Database Initialization

#### LibSQL (Default)

```typescript
// src/storage/init.ts
import { LibSQLStore } from '@mastra/libsql';

export async function initStorage() {
  const storage = new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:./mastra.db',
  });

  // LibSQL auto-creates tables as needed
  // No manual migration required

  return storage;
}
```

#### PostgreSQL

```typescript
// src/storage/init.ts
import { PostgresStore } from '@mastra/pg';

export async function initStorage() {
  const storage = new PostgresStore({
    url: process.env.DATABASE_URL!,
  });

  // Run migrations (if using a migration system)
  await runMigrations(storage);

  return storage;
}

// Optional: Simple migration system
async function runMigrations(storage: PostgresStore) {
  const client = await storage.getClient();

  try {
    // Create migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Apply pending migrations
    const migrations = [
      {
        name: '001_initial_schema',
        sql: `
          CREATE TABLE IF NOT EXISTS agents (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            config JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `,
      },
      // Add more migrations as needed
    ];

    for (const migration of migrations) {
      const result = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        console.log(`✅ Applied migration: ${migration.name}`);
      }
    }
  } finally {
    client.release();
  }
}
```

## Security Best Practices

### 1. API Key Management

**Development**:
```typescript
// .env (local, never commit)
OPENAI_API_KEY=sk-development-key-here

// For team development, use a shared test key or individual keys
```

**Production**:
```typescript
// Use environment variables from hosting provider
// Vercel: Dashboard → Settings → Environment Variables
// Netlify: Site Settings → Build & Deploy → Environment
// Cloudflare: Workers & Pages → Settings → Environment Variables

// Or use secrets management
import { getSecret } from '@vercel/kv';

export async function getApiKey() {
  return await getSecret('OPENAI_API_KEY');
}
```

### 2. Secrets Rotation Strategy

```typescript
// src/config/secrets.ts
interface SecretVersion {
  current: string;
  previous?: string; // For graceful rotation
}

export class SecretsManager {
  private secrets: Map<string, SecretVersion> = new Map();

  async getApiKey(name: string): Promise<string> {
    const secret = this.secrets.get(name);
    if (!secret) {
      throw new Error(`Secret not found: ${name}`);
    }
    return secret.current;
  }

  async rotateSecret(name: string, newValue: string) {
    const current = this.secrets.get(name);
    this.secrets.set(name, {
      current: newValue,
      previous: current?.current,
    });

    // Allow previous key to work for 24 hours
    setTimeout(() => {
      const secret = this.secrets.get(name);
      if (secret) {
        this.secrets.set(name, {
          current: secret.current,
          previous: undefined,
        });
      }
    }, 24 * 60 * 60 * 1000);
  }

  async validateApiKey(name: string, key: string): Promise<boolean> {
    const secret = this.secrets.get(name);
    if (!secret) return false;
    return key === secret.current || key === secret.previous;
  }
}
```

### 3. Environment Isolation

```typescript
// Prevent accidental production data access in development
export function ensureEnvironmentIsolation() {
  if (process.env.NODE_ENV === 'development') {
    const prodIndicators = [
      'prod',
      'production',
      'live',
      'prd',
    ];

    const dbUrl = process.env.DATABASE_URL?.toLowerCase() || '';

    if (prodIndicators.some(indicator => dbUrl.includes(indicator))) {
      throw new Error(
        '⚠️  DANGER: Development environment is pointing to production database!\n' +
        'Check your DATABASE_URL environment variable.'
      );
    }
  }
}
```

## Configuration Patterns

### 1. Feature Flags

```typescript
// src/config/features.ts
export const features = {
  // Core features
  authentication: process.env.AUTH_ENABLED === 'true',
  rateLimiting: process.env.RATE_LIMIT_ENABLED !== 'false',
  telemetry: process.env.TELEMETRY_ENABLED === 'true',

  // Experimental features
  experimental: {
    voiceAgents: process.env.FEATURE_VOICE === 'true',
    multimodal: process.env.FEATURE_MULTIMODAL === 'true',
    agentNetworks: process.env.FEATURE_AGENT_NETWORKS === 'true',
  },

  // Integration features
  integrations: {
    github: !!process.env.GITHUB_TOKEN,
    slack: !!process.env.SLACK_BOT_TOKEN,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  },
};

// Usage in Mastra configuration
export const mastra = new Mastra({
  agents: {
    ...coreAgents,
    ...(features.experimental.voiceAgents && {
      voiceAgent,
    }),
  },

  server: {
    middleware: [
      ...(features.authentication ? [authMiddleware] : []),
      ...(features.rateLimiting ? [rateLimitMiddleware] : []),
    ],
  },
});
```

### 2. Multi-Environment Configuration

```typescript
// src/config/environments.ts
export interface EnvironmentConfig {
  name: string;
  apiBaseUrl: string;
  storage: {
    type: 'libsql' | 'postgres' | 'memory';
    url: string;
    options?: Record<string, any>;
  };
  ai: {
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    temperature: number;
  };
  security: {
    requireAuth: boolean;
    rateLimiting: boolean;
    corsOrigins: string[];
  };
}

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'development',
    apiBaseUrl: 'http://localhost:3000',
    storage: {
      type: 'libsql',
      url: 'file:./mastra-dev.db',
    },
    ai: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    },
    security: {
      requireAuth: false,
      rateLimiting: false,
      corsOrigins: ['*'],
    },
  },

  staging: {
    name: 'staging',
    apiBaseUrl: 'https://staging-api.example.com',
    storage: {
      type: 'postgres',
      url: process.env.DATABASE_URL!,
      options: {
        ssl: true,
        poolSize: 10,
      },
    },
    ai: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.5,
    },
    security: {
      requireAuth: true,
      rateLimiting: true,
      corsOrigins: ['https://staging.example.com'],
    },
  },

  production: {
    name: 'production',
    apiBaseUrl: 'https://api.example.com',
    storage: {
      type: 'postgres',
      url: process.env.DATABASE_URL!,
      options: {
        ssl: true,
        poolSize: 20,
      },
    },
    ai: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
    },
    security: {
      requireAuth: true,
      rateLimiting: true,
      corsOrigins: ['https://app.example.com'],
    },
  },
};

export const currentEnv = environments[process.env.NODE_ENV || 'development'];
```

## Common Setup Issues and Solutions

### Issue: Database Connection Failures

**Symptoms**: Cannot connect to database, timeout errors

**Solutions**:
```typescript
// 1. Verify connection string format
console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

// 2. Test connection
import { LibSQLStore } from '@mastra/libsql';

async function testConnection() {
  try {
    const storage = new LibSQLStore({
      url: process.env.DATABASE_URL!,
    });

    await storage.get('test-key');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// 3. Check Docker service health
// Run: docker-compose ps
// Ensure database service is "healthy"
```

### Issue: Missing API Keys

**Symptoms**: "API key not found" errors, authentication failures

**Solutions**:
```typescript
// 1. Create a pre-flight check
export function checkRequiredEnvVars() {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nPlease check your .env file');
    process.exit(1);
  }
}

// 2. Add to startup
checkRequiredEnvVars();
```

### Issue: Port Conflicts

**Symptoms**: "Port already in use" errors

**Solutions**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

## Health Check Implementation

```typescript
// src/health.ts
export async function healthCheck() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    checks: {} as Record<string, any>,
  };

  // Check storage
  try {
    await storage.get('health-check');
    checks.checks.storage = { status: 'healthy' };
  } catch (error) {
    checks.checks.storage = {
      status: 'unhealthy',
      error: error.message,
    };
    checks.status = 'unhealthy';
  }

  // Check AI provider
  try {
    // Minimal API test
    const model = mastra.getAgent('default');
    checks.checks.ai = { status: 'healthy', provider: 'configured' };
  } catch (error) {
    checks.checks.ai = {
      status: 'degraded',
      error: 'No AI provider configured',
    };
    checks.status = 'degraded';
  }

  // Check memory
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    status: memUsage.heapUsed / memUsage.heapTotal > 0.9 ? 'degraded' : 'healthy',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
  };

  return checks;
}

// Add health endpoint
app.get('/health', async (c) => {
  const health = await healthCheck();
  return c.json(health, health.status === 'healthy' ? 200 : 503);
});
```

## See Also

- [[architecture.md]] - System architecture and component relationships
- [[deployment.md]] - Production deployment and operations
- [[troubleshooting.md]] - Common issues and debugging strategies
