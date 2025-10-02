# Mastra Migrations and Upgrades Guide

## Overview

This guide covers version upgrade strategies, handling breaking changes, data migration patterns, and maintaining backward compatibility when evolving Mastra applications.

## Version Upgrade Strategies

### Understanding Semantic Versioning

Mastra follows semantic versioning (semver):

```
MAJOR.MINOR.PATCH (e.g., 1.2.3)

MAJOR: Breaking changes
MINOR: New features, backward compatible
PATCH: Bug fixes, backward compatible
```

**Upgrade Safety by Version Type**:
- **Patch upgrades** (1.2.3 → 1.2.4): Safe, apply immediately
- **Minor upgrades** (1.2.0 → 1.3.0): Generally safe, review changelog
- **Major upgrades** (1.0.0 → 2.0.0): Breaking changes, requires migration plan

### Pre-Upgrade Checklist

Before upgrading Mastra versions:

```bash
# 1. Check current version
pnpm list @mastra/core

# 2. Review changelog for breaking changes
# Visit: https://github.com/mastra-ai/mastra/releases

# 3. Backup your data
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 4. Run tests on current version
pnpm test

# 5. Create a git branch for the upgrade
git checkout -b upgrade/mastra-v2.0.0

# 6. Update package.json
# Change: "@mastra/core": "^1.0.0"
# To:     "@mastra/core": "^2.0.0"

# 7. Install new version
pnpm install

# 8. Run tests on new version
pnpm test

# 9. Fix any breaking changes (see migration guides below)

# 10. Deploy to staging first
```

### Gradual Rollout Strategy

```typescript
// src/config/version-flags.ts
export const versionConfig = {
  // Feature flags for gradual rollout
  useNewAgentAPI: process.env.USE_NEW_AGENT_API === 'true',
  useNewWorkflowEngine: process.env.USE_NEW_WORKFLOW_ENGINE === 'true',
  useNewMemorySystem: process.env.USE_NEW_MEMORY_SYSTEM === 'true',

  // Version-based conditional logic
  mastraVersion: process.env.MASTRA_VERSION || '1.0.0',
};

// Conditional logic for gradual migration
if (versionConfig.useNewAgentAPI) {
  // Use new Agent API
  const agent = new Agent({ /* new API */ });
} else {
  // Use legacy Agent API
  const agent = createAgent({ /* old API */ });
}
```

## Handling Breaking Changes

### Common Breaking Change Patterns

#### 1. API Signature Changes

**Example**: Agent constructor signature change

```typescript
// OLD (v1.x)
const agent = new Agent({
  name: 'Assistant',
  model: 'gpt-4',
  tools: [tool1, tool2],
});

// NEW (v2.x)
const agent = new Agent({
  name: 'Assistant',
  model: openai('gpt-4'), // Model is now a provider object
  tools: { tool1, tool2 }, // Tools are now an object, not array
});
```

**Migration Helper**:

```typescript
// src/migration/agent-migration.ts
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

export function migrateAgentConfig(oldConfig: any) {
  // Convert array of tools to object
  const tools = Array.isArray(oldConfig.tools)
    ? oldConfig.tools.reduce((acc, tool, index) => {
        acc[tool.id || `tool${index}`] = tool;
        return acc;
      }, {})
    : oldConfig.tools;

  // Convert string model to provider object
  const model = typeof oldConfig.model === 'string'
    ? openai(oldConfig.model)
    : oldConfig.model;

  return new Agent({
    ...oldConfig,
    model,
    tools,
  });
}

// Usage
const agent = migrateAgentConfig(legacyAgentConfig);
```

#### 2. Configuration Structure Changes

**Example**: Mastra configuration restructuring

```typescript
// OLD (v1.x)
const mastra = new Mastra({
  storage: { type: 'libsql', url: '...' },
  vectors: { type: 'pinecone', apiKey: '...' },
});

// NEW (v2.x)
import { LibSQLStore } from '@mastra/libsql';
import { PineconeVectorStore } from '@mastra/pinecone';

const mastra = new Mastra({
  storage: new LibSQLStore({ url: '...' }),
  vectors: [new PineconeVectorStore({ apiKey: '...' })],
});
```

**Automated Migration Script**:

```typescript
// scripts/migrate-config.ts
import { readFileSync, writeFileSync } from 'fs';

function migrateConfig(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');

  // Replace old patterns with new patterns
  let migrated = content
    .replace(
      /storage:\s*{\s*type:\s*['"]libsql['"]\s*,\s*url:\s*([^\}]+)\}/g,
      'storage: new LibSQLStore({ url: $1 })'
    )
    .replace(
      /vectors:\s*{\s*type:\s*['"]pinecone['"]\s*,\s*apiKey:\s*([^\}]+)\}/g,
      'vectors: [new PineconeVectorStore({ apiKey: $1 })]'
    );

  // Add necessary imports
  if (migrated.includes('LibSQLStore')) {
    migrated = `import { LibSQLStore } from '@mastra/libsql';\n${migrated}`;
  }

  writeFileSync(filePath, migrated);
  console.log(`✅ Migrated: ${filePath}`);
}

// Run: pnpm tsx scripts/migrate-config.ts src/mastra/index.ts
```

## Data Migration Patterns

### Database Schema Migrations

#### Migration File Structure

```
migrations/
├── 001_initial_schema.sql
├── 002_add_agent_metadata.sql
├── 003_add_memory_indexes.sql
└── 004_migrate_to_v2_schema.sql
```

#### Migration Template

```sql
-- migrations/004_migrate_to_v2_schema.sql
-- Migration: v1 to v2 schema changes
-- Date: 2024-01-01

BEGIN;

-- Add new columns
ALTER TABLE agents
  ADD COLUMN model_provider VARCHAR(50),
  ADD COLUMN model_config JSONB;

-- Migrate existing data
UPDATE agents
SET
  model_provider = 'openai',
  model_config = jsonb_build_object(
    'model', model_name,
    'temperature', 0.7
  )
WHERE model_provider IS NULL;

-- Remove old columns (optional, keep for rollback)
-- ALTER TABLE agents DROP COLUMN model_name;

COMMIT;
```

#### Migration Runner

```typescript
// scripts/run-migrations.ts
import { createClient } from '@libsql/client';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface Migration {
  id: number;
  name: string;
  appliedAt: Date;
}

async function runMigrations() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
  });

  try {
    // Create migrations tracking table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const appliedResult = await client.execute(
      'SELECT name FROM schema_migrations ORDER BY id'
    );
    const applied = new Set(appliedResult.rows.map(r => r.name));

    // Get migration files
    const migrationDir = join(__dirname, '../migrations');
    const migrationFiles = readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        console.log(`⏭️  Skipping (already applied): ${file}`);
        continue;
      }

      console.log(`🔄 Applying migration: ${file}`);

      const sql = readFileSync(join(migrationDir, file), 'utf-8');

      // Execute migration
      await client.execute(sql);

      // Record migration
      await client.execute({
        sql: 'INSERT INTO schema_migrations (name) VALUES (?)',
        args: [file],
      });

      console.log(`✅ Applied: ${file}`);
    }

    console.log('✅ All migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runMigrations();
```

### Data Transformation Migrations

```typescript
// scripts/migrate-agent-data.ts
import { mastra } from '../src/mastra';

async function migrateAgentData() {
  const storage = mastra.getStorage();

  // Fetch all agents
  const agentKeys = await storage.list('agent:');

  console.log(`Found ${agentKeys.length} agents to migrate`);

  for (const key of agentKeys) {
    const agent = await storage.get(key);

    if (!agent) continue;

    // Transform data structure
    const migrated = {
      ...agent,
      version: 2,
      model: {
        provider: 'openai',
        name: agent.model || 'gpt-4o-mini',
        config: {
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 2000,
        },
      },
      tools: Array.isArray(agent.tools)
        ? agent.tools.reduce((acc, tool, i) => {
            acc[tool.id || `tool${i}`] = tool;
            return acc;
          }, {})
        : agent.tools,
    };

    // Remove deprecated fields
    delete migrated.temperature;
    delete migrated.maxTokens;

    // Save migrated data
    await storage.set(key, migrated);

    console.log(`✅ Migrated agent: ${key}`);
  }

  console.log('✅ Agent data migration complete');
}

migrateAgentData().catch(console.error);
```

## Memory and Conversation Migration

### Migrating Thread Data

```typescript
// scripts/migrate-threads.ts
import { Memory } from '@mastra/memory';

async function migrateThreads() {
  const oldMemory = new Memory({ version: 1 });
  const newMemory = new Memory({ version: 2 });

  // Get all thread IDs
  const threadIds = await oldMemory.getAllThreadIds();

  for (const threadId of threadIds) {
    // Fetch old messages
    const oldMessages = await oldMemory.getMemories(threadId);

    // Transform message format
    const newMessages = oldMessages.map(msg => ({
      ...msg,
      metadata: {
        ...msg.metadata,
        migratedAt: new Date().toISOString(),
        originalFormat: 'v1',
      },
      // Add new required fields
      timestamp: msg.timestamp || new Date().toISOString(),
      threadId,
    }));

    // Save to new format
    for (const message of newMessages) {
      await newMemory.saveMemory(threadId, message);
    }

    console.log(`✅ Migrated thread: ${threadId} (${newMessages.length} messages)`);
  }

  console.log('✅ Thread migration complete');
}

migrateThreads().catch(console.error);
```

## Backward Compatibility Patterns

### Dual API Support

```typescript
// src/agents/backward-compatible-agent.ts
import { Agent as AgentV2 } from '@mastra/core/agent';

// Support both v1 and v2 APIs
export function createAgent(config: any): AgentV2 {
  // Detect version based on config structure
  const isV1Config = Array.isArray(config.tools);

  if (isV1Config) {
    console.warn('⚠️  Using deprecated v1 Agent API. Please migrate to v2.');

    // Transform v1 config to v2
    return new AgentV2({
      name: config.name,
      instructions: config.instructions || config.systemPrompt,
      model: typeof config.model === 'string'
        ? openai(config.model)
        : config.model,
      tools: config.tools.reduce((acc: any, tool: any, i: number) => {
        acc[tool.id || `tool${i}`] = tool;
        return acc;
      }, {}),
    });
  }

  // Use v2 config directly
  return new AgentV2(config);
}
```

### Deprecation Warnings

```typescript
// src/utils/deprecation.ts
const deprecationWarnings = new Set<string>();

export function deprecate(
  feature: string,
  alternative: string,
  version: string
) {
  const key = `${feature}:${version}`;

  if (deprecationWarnings.has(key)) {
    return; // Don't spam warnings
  }

  deprecationWarnings.add(key);

  console.warn(
    `⚠️  DEPRECATION WARNING: ${feature} is deprecated and will be removed in ${version}.\n` +
    `   Please use ${alternative} instead.\n` +
    `   See migration guide: https://docs.mastra.com/migrations/${version}`
  );
}

// Usage
export function oldFunction() {
  deprecate(
    'oldFunction()',
    'newFunction()',
    'v3.0.0'
  );

  // Legacy implementation
}
```

## Version-Specific Migration Guides

### Migrating from v1 to v2 (Example)

```typescript
// Migration guide for v1 → v2
export const v1ToV2Migration = {
  name: 'v1-to-v2',
  description: 'Migrate from Mastra v1 to v2',

  changes: [
    {
      component: 'Agent',
      breaking: true,
      description: 'Agent configuration structure changed',
      before: `
const agent = new Agent({
  name: 'Assistant',
  model: 'gpt-4',
  tools: [tool1, tool2],
  systemPrompt: 'You are an assistant',
});
      `,
      after: `
const agent = new Agent({
  name: 'Assistant',
  model: openai('gpt-4'),
  tools: { tool1, tool2 },
  instructions: 'You are an assistant',
});
      `,
    },
    {
      component: 'Storage',
      breaking: true,
      description: 'Storage providers now use class instances',
      before: `
const mastra = new Mastra({
  storage: { type: 'libsql', url: '...' },
});
      `,
      after: `
import { LibSQLStore } from '@mastra/libsql';

const mastra = new Mastra({
  storage: new LibSQLStore({ url: '...' }),
});
      `,
    },
  ],

  async run() {
    console.log('Running v1 to v2 migration...');

    // 1. Update configuration files
    await this.migrateConfigFiles();

    // 2. Migrate database schema
    await this.migrateSchema();

    // 3. Transform data
    await this.migrateData();

    console.log('✅ Migration complete');
  },

  async migrateConfigFiles() {
    // Automated config file migration
  },

  async migrateSchema() {
    // Database schema updates
  },

  async migrateData() {
    // Data transformation
  },
};
```

## Rollback Strategy

### Preparation for Rollback

```typescript
// scripts/create-rollback-point.ts
import { execSync } from 'child_process';

function createRollbackPoint() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tag = `rollback-point-${timestamp}`;

  // Tag current state
  execSync(`git tag -a ${tag} -m "Rollback point before upgrade"`);

  // Backup database
  execSync(`pg_dump $DATABASE_URL > backups/${tag}.sql`);

  // Save current package versions
  execSync(`pnpm list --json > backups/${tag}-packages.json`);

  console.log(`✅ Rollback point created: ${tag}`);
  console.log(`   Git tag: ${tag}`);
  console.log(`   Database backup: backups/${tag}.sql`);
  console.log(`   Package versions: backups/${tag}-packages.json`);
}

createRollbackPoint();
```

### Executing Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ROLLBACK_TAG=$1

if [ -z "$ROLLBACK_TAG" ]; then
  echo "Usage: ./rollback.sh <rollback-tag>"
  exit 1
fi

echo "🔄 Rolling back to: $ROLLBACK_TAG"

# 1. Restore code
git checkout $ROLLBACK_TAG

# 2. Restore dependencies
pnpm install

# 3. Restore database
psql $DATABASE_URL < backups/${ROLLBACK_TAG}.sql

# 4. Rebuild
pnpm build

# 5. Restart services
pm2 restart mastra-app

echo "✅ Rollback complete"
```

## Testing Migrations

```typescript
// test/migrations/v1-to-v2.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { migrateV1ToV2 } from '../../scripts/migrations/v1-to-v2';

describe('v1 to v2 Migration', () => {
  beforeEach(async () => {
    // Set up test database with v1 schema and data
    await setupV1TestData();
  });

  it('should migrate agent configuration', async () => {
    await migrateV1ToV2();

    const agent = await getAgent('test-agent');

    expect(agent.version).toBe(2);
    expect(agent.model).toHaveProperty('provider');
    expect(agent.tools).toBeTypeOf('object');
  });

  it('should preserve data integrity', async () => {
    const beforeCount = await getAgentCount();

    await migrateV1ToV2();

    const afterCount = await getAgentCount();

    expect(afterCount).toBe(beforeCount);
  });

  it('should be idempotent', async () => {
    await migrateV1ToV2();
    const firstResult = await getAgents();

    await migrateV1ToV2();
    const secondResult = await getAgents();

    expect(secondResult).toEqual(firstResult);
  });
});
```

## See Also

- [[environment-setup.md]] - Environment and configuration management
- [[deployment.md]] - Deployment strategies
- [[troubleshooting.md]] - Migration debugging
- [[architecture.md]] - Understanding system architecture for migrations
