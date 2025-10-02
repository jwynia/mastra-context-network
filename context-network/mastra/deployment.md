# Mastra Deployment Guide

## Overview

This guide covers deploying Mastra applications to production environments, including platform-specific deployment patterns, scaling strategies, monitoring setup, and operational best practices.

## Deployment Platforms

Mastra applications can be deployed to various platforms. Each has specific patterns and considerations.

### Vercel Deployment

**Best For**: Serverless deployments, Next.js applications, rapid deployment

#### Setup

```bash
# Install Vercel CLI
pnpm install -g vercel

# Login
vercel login

# Deploy
vercel
```

#### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": null,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Vercel Deployer Integration

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core';
import { VercelDeployer } from '@mastra/vercel';

export const mastra = new Mastra({
  agents: { /* ... */ },
  workflows: { /* ... */ },

  // Vercel-specific deployment configuration
  deployer: new VercelDeployer({
    runtime: 'edge', // or 'nodejs'
    regions: ['sfo1', 'iad1'], // Multi-region deployment
  }),
});
```

#### Environment Variables on Vercel

```bash
# Set via Vercel Dashboard or CLI
vercel env add OPENAI_API_KEY production
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production

# Or in vercel.json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database-url"  // Reference secret
    }
  }
}
```

### Netlify Deployment

**Best For**: Static sites with serverless functions, JAMstack applications

#### Setup

```bash
# Install Netlify CLI
pnpm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Netlify Configuration

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
```

#### Netlify Functions

```typescript
// netlify/functions/agent.ts
import { Handler } from '@netlify/functions';
import { mastra } from '../../src/mastra';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { agentId, message } = JSON.parse(event.body || '{}');

    const agent = mastra.getAgent(agentId);
    const result = await agent.generate([{
      role: 'user',
      content: message,
    }]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### Cloudflare Workers Deployment

**Best For**: Edge computing, global distribution, high performance

#### Cloudflare Setup

```bash
# Install Wrangler
pnpm install -g wrangler

# Login
wrangler login

# Deploy
wrangler deploy
```

#### Wrangler Configuration

```toml
# wrangler.toml
name = "mastra-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[build]
command = "pnpm build"

[[kv_namespaces]]
binding = "MASTRA_KV"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "MASTRA_DB"
database_name = "mastra-production"
database_id = "your-database-id"

[vars]
ENVIRONMENT = "production"
```

#### Cloudflare Worker Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono';
import { mastra } from './mastra';

const app = new Hono();

app.post('/api/agents/:agentId/chat', async (c) => {
  const agentId = c.req.param('agentId');
  const { message } = await c.req.json();

  const agent = mastra.getAgent(agentId);
  const result = await agent.generate([{
    role: 'user',
    content: message,
  }]);

  return c.json(result);
});

export default app;
```

### Docker Deployment

**Best For**: Self-hosted, custom infrastructure, development/production parity

#### Dockerfile

```dockerfile
# Multi-stage build for optimal size
FROM node:20-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mastra
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - mastra-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mastra
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - mastra-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - mastra-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - mastra-network

volumes:
  postgres_data:
  redis_data:

networks:
  mastra-network:
    driver: bridge
```

## Database Deployment Patterns

### PostgreSQL Production Setup

```typescript
// src/storage/production-storage.ts
import { PostgresStore } from '@mastra/pg';
import { Pool } from 'pg';

export function createProductionStorage() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false, // For managed databases
    } : false,
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await pool.end();
  });

  return new PostgresStore({ pool });
}
```

### Database Migration Strategy

```typescript
// scripts/migrate.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@libsql/client';

async function runMigrations() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
  });

  try {
    // Create migrations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationDir = join(__dirname, '../migrations');
    const migrations = readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const migration of migrations) {
      // Check if already applied
      const result = await client.execute({
        sql: 'SELECT * FROM migrations WHERE name = ?',
        args: [migration],
      });

      if (result.rows.length === 0) {
        console.log(`Applying migration: ${migration}`);

        const sql = readFileSync(join(migrationDir, migration), 'utf-8');
        await client.execute(sql);

        await client.execute({
          sql: 'INSERT INTO migrations (name) VALUES (?)',
          args: [migration],
        });

        console.log(`✅ Applied: ${migration}`);
      }
    }

    console.log('✅ All migrations complete');
  } finally {
    client.close();
  }
}

runMigrations().catch(console.error);
```

## Scaling Patterns

### Horizontal Scaling with Load Balancer

```nginx
# nginx.conf
upstream mastra_backend {
    least_conn;  # Load balancing method

    server app1:3000 max_fails=3 fail_timeout=30s;
    server app2:3000 max_fails=3 fail_timeout=30s;
    server app3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://mastra_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://mastra_backend/health;
    }
}
```

### Auto-scaling with Kubernetes

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mastra-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mastra
  template:
    metadata:
      labels:
        app: mastra
    spec:
      containers:
      - name: mastra
        image: your-registry/mastra:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mastra-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: mastra-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mastra-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mastra-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Monitoring and Observability

### Application Monitoring Setup

```typescript
// src/monitoring/setup.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

export function setupMonitoring() {
  if (process.env.TELEMETRY_ENABLED !== 'true') {
    return;
  }

  const sdk = new NodeSDK({
    serviceName: 'mastra-app',
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      }),
      exportIntervalMillis: 60000, // 1 minute
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Telemetry terminated'))
      .catch((error) => console.error('Error terminating telemetry', error))
      .finally(() => process.exit(0));
  });
}
```

### Custom Metrics

```typescript
// src/monitoring/metrics.ts
import { MeterProvider } from '@opentelemetry/sdk-metrics';

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('mastra-app');

// Custom metrics
export const agentRequestCounter = meter.createCounter('agent_requests_total', {
  description: 'Total number of agent requests',
});

export const agentResponseTime = meter.createHistogram('agent_response_time', {
  description: 'Agent response time in milliseconds',
  unit: 'ms',
});

export const activeAgents = meter.createUpDownCounter('active_agents', {
  description: 'Number of active agent instances',
});

// Usage in agent
export async function executeAgent(agentId: string, input: any) {
  agentRequestCounter.add(1, { agentId });

  const start = Date.now();

  try {
    const result = await agent.generate(input);
    const duration = Date.now() - start;

    agentResponseTime.record(duration, { agentId, status: 'success' });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    agentResponseTime.record(duration, { agentId, status: 'error' });

    throw error;
  }
}
```

### Structured Logging

```typescript
// src/logging/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  ...(process.env.NODE_ENV === 'production' && {
    transport: {
      target: '@logtail/pino',
      options: {
        sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
      },
    },
  }),
});

// Usage
logger.info({ agentId: 'assistant', userId: 'user123' }, 'Agent request started');
logger.error({ error, agentId: 'assistant' }, 'Agent request failed');
```

## Security Hardening

### Production Security Checklist

```typescript
// src/security/middleware.ts
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from './rate-limiter';
import { validateJWT } from './auth';

export function applySecurityMiddleware(app: Hono) {
  // Security headers
  app.use('*', secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }));

  // Rate limiting
  app.use('/api/*', rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
  }));

  // Authentication for protected routes
  app.use('/api/protected/*', async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token || !await validateJWT(token)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  });

  return app;
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compilation clean (`pnpm typecheck`)
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

### Deployment Process

- [ ] Build production bundle
- [ ] Run database migrations
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Verify key functionality

### Post-Deployment

- [ ] Monitor logs for errors
- [ ] Check performance metrics
- [ ] Verify integrations working
- [ ] Test critical user flows
- [ ] Document any issues
- [ ] Update runbook if needed

## Rollback Strategy

```bash
# Docker rollback
docker-compose down
docker-compose -f docker-compose.prod.yml up -d --build previous-tag

# Vercel rollback
vercel rollback

# Kubernetes rollback
kubectl rollout undo deployment/mastra-app
kubectl rollout status deployment/mastra-app
```

## See Also

- [[environment-setup.md]] - Environment configuration
- [[troubleshooting.md]] - Production debugging
- [[architecture.md]] - System architecture understanding
