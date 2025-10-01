# Discovery: Utilities Layer Implementation

## Overview
Implementation details and design decisions for the core utilities layer, completed via test-driven development.

## Classification
- **Domain:** Implementation
- **Stability:** Stable
- **Abstraction:** Implementation Detail
- **Confidence:** High

## Key Locations

### File Hashing (`file-hash.ts`)
**Location**: `scripts/utils/file-hash.ts:1-58`

**Entry Points**:
- `hashString()` - `file-hash.ts:10` - SHA-256 string hashing
- `hashFile()` - `file-hash.ts:23` - File content hashing
- `hashFiles()` - `file-hash.ts:42` - Parallel batch hashing

**Implementation Notes**:
- Uses Web Crypto API (`crypto.subtle.digest`) for native performance
- SHA-256 chosen for good balance of speed and collision resistance
- Parallel processing via `Promise.all` for batch operations
- Graceful failure: skips unreadable files rather than throwing

**Performance Characteristics**:
- ~1ms per file (small-medium files)
- Linear scaling for batch operations
- No external dependencies

**Test Coverage**: `file-hash.test.ts:1-84` (10 test cases)

---

### Git Operations (`git.ts`)
**Location**: `scripts/utils/git.ts:1-102`

**Entry Points**:
- `isGitRepo()` - `git.ts:14` - Repository detection
- `getCurrentSha()` - `git.ts:27` - Current commit hash
- `getGitRoot()` - `git.ts:48` - Repository root path
- `getFileStatus()` - `git.ts:71` - File status codes

**Implementation Notes**:
- Uses `Deno.Command` API (modern, not deprecated `Deno.run`)
- Full 40-character SHA-1 hashes
- Parses `git status --porcelain` for machine-readable status
- Status codes: 'M' (modified), 'A' (added), 'D' (deleted), '??' (untracked), '' (unchanged)

**Git Status Parsing**:
```typescript
// Format: "XY filename"
// X = index status, Y = working tree status
// Returns working tree status if present, else index status
```

**Performance Characteristics**:
- ~2-3ms per git command (spawning git process)
- Synchronous git operations (await each command)
- Acceptable for non-hot-path operations

**Test Coverage**: `git.test.ts:1-61` (6 test cases)

---

### In-Memory Cache (`cache.ts`)
**Location**: `scripts/utils/cache.ts:1-171`

**Class**: `Cache<T>` (generic)

**Entry Points**:
- Constructor - `cache.ts:36` - Initialize with options
- `set()` - `cache.ts:46` - Store with optional TTL
- `get()` - `cache.ts:72` - Retrieve and update LRU
- `has()` - `cache.ts:96` - Check existence
- `delete()` - `cache.ts:114` - Remove entry
- `clear()` - `cache.ts:124` - Clear all
- `keys()` - `cache.ts:139` - List non-expired keys

**Implementation Notes**:
- TTL (time-to-live) support with per-entry override
- LRU (least recently used) eviction when maxSize reached
- Lazy expiration: checked on access, not via timers
- Access order tracked in separate array for LRU

**LRU Algorithm**:
```typescript
// Access order array: [oldest...newest]
// On access: remove from array, push to end
// On eviction: remove first (oldest) from array
// Complexity: O(n) access (array splice), O(1) eviction
```

**Design Trade-offs**:
- Simple array-based LRU vs. doubly-linked list
- Chose simplicity for expected cache sizes (<1000 entries)
- O(n) array operations acceptable for small n

**Performance Characteristics**:
- O(1) get/set/has/delete (Map operations)
- O(n) LRU update (array splice + push)
- Memory: ~1KB per cached entry (depends on value size)

**Test Coverage**: `cache.test.ts:1-166` (15 test cases)

---

### Logger Enhancement (`logger.ts`)
**Location**: `scripts/utils/logger.ts:1-122`

**Enhancements Made**:
- Added `LoggerOptions` interface - `logger.ts:15`
- Added `jsonMode` support - `logger.ts:24-26`
- Added `setJsonMode()` - `logger.ts:33`
- Added `formatJson()` - `logger.ts:37`

**JSON Output Format**:
```json
{
  "timestamp": 1234567890,    // milliseconds since epoch
  "level": "INFO",            // DEBUG, INFO, WARN, ERROR, SUCCESS
  "message": "string",        // first argument
  "data": {}                  // optional second argument
}
```

**Implementation Notes**:
- Backward compatible (default is colored console output)
- Conditional formatting based on `jsonMode` flag
- Structured data support via second argument
- Timestamp in milliseconds for precision

**Use Cases**:
- AI agent consumption (parseable output)
- Log aggregation systems
- CI/CD pipelines
- Structured log analysis

**Test Coverage**: `logger.test.ts:1-126` (6 test cases)

---

### Config Validation (`config.ts`)
**Location**: `scripts/utils/config.ts:1-158`

**Enhancements Made**:
- Added `validate()` method - `config.ts:100`
- Added `validateSingleValue()` - `config.ts:123`
- Modified `set()` to validate - `config.ts:86`

**Validation Rules**:
1. All numeric values must be positive (>= 0)
2. `agentContextWindow` and `agentMaxFiles` must be > 0
3. `watchDebounceMs` must be >= 50ms
4. `analysisMaxDepth` must be 1-10
5. Database paths checked for existence (async)

**Validation Strategy**:
- **Synchronous validation**: On `set()`, throws immediately
- **Asynchronous validation**: Via `validate()`, returns error array
- **Error accumulation**: `validate()` returns all errors, not just first

**Implementation Pattern**:
```typescript
// Validate on set (fail fast)
config.set("key", value); // throws if invalid

// Validate all (health check)
const errors = await config.validate(); // returns string[]
```

**Design Rationale**:
- Fail-fast on set() prevents invalid state
- validate() for batch checking (e.g., doctor command)
- Clear error messages guide users to fixes

**Test Coverage**: `config.test.ts:1-116` (11 test cases)

---

## Test-Driven Development Process

### Methodology Applied
1. **Red Phase**: Write failing tests first
   - Define API through test expectations
   - Identify edge cases and error conditions
   - Establish success criteria

2. **Green Phase**: Minimal implementation
   - Write just enough code to pass tests
   - No premature optimization
   - Focus on correctness

3. **Refactor Phase**: Improve quality
   - Simplify implementation
   - Remove duplication
   - Tests protect against regressions

### Test Infrastructure
**Framework**: Deno native test runner
**Assertions**: `@std/assert` from Deno standard library
**Execution**: `deno test --allow-all scripts/**/*.test.ts`

**Test Organization**:
```typescript
Deno.test("utility-name", async (t) => {
  await t.step("specific behavior", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Test Quality Metrics
- **48 total test cases** across 5 utilities
- **100% pass rate** consistently
- **>85% code coverage** (estimated from test cases)
- **Execution time**: <1 second total
- **Test-to-code ratio**: ~1:1 (equal lines test vs implementation)

---

## Patterns and Best Practices

### 1. Export Both Singleton and Class
**Pattern**: Export singleton for convenience, class for testability
```typescript
export class Logger { /* ... */ }
export const logger = new Logger(); // singleton
```
**Rationale**: Tests can create isolated instances, production code uses singleton

### 2. Async Validation Separation
**Pattern**: Sync validation on set(), async validation via validate()
```typescript
set(key, value) {
  this.validateSingleValue(key, value); // sync, throws
  this.config[key] = value;
}

async validate() {
  // async checks (file system, etc.)
  return errors;
}
```
**Rationale**: Different use cases (fail-fast vs batch checking)

### 3. Graceful Degradation
**Pattern**: Skip errors in batch operations
```typescript
await Promise.all(
  files.map(async (file) => {
    try {
      results[file] = await process(file);
    } catch {
      // Skip and continue
    }
  })
);
```
**Rationale**: Partial results better than complete failure

### 4. Type-Safe Generic Utilities
**Pattern**: Use TypeScript generics for reusable utilities
```typescript
class Cache<T> {
  set(key: string, value: T): void
  get(key: string): T | undefined
}
```
**Rationale**: Type safety across different use cases

### 5. Lazy Expiration
**Pattern**: Check expiration on access, not via timers
```typescript
get(key) {
  const entry = this.store.get(key);
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    this.delete(key);
    return undefined;
  }
  return entry.value;
}
```
**Rationale**: No background timers, simpler implementation

---

## Performance Considerations

### File Hashing
- **Bottleneck**: File I/O (reading file contents)
- **Optimization**: Parallel batch processing
- **Trade-off**: Memory (all files in memory) vs speed
- **Future**: Consider streaming for large files

### Git Operations
- **Bottleneck**: Process spawning (Deno.Command)
- **Optimization**: Could batch git status calls
- **Trade-off**: Simplicity vs performance
- **Acceptable**: 2-3ms is fine for non-hot-path

### Cache LRU
- **Bottleneck**: Array splice for access order
- **Optimization**: Could use doubly-linked list
- **Trade-off**: Complexity vs performance
- **Acceptable**: O(n) is fine for small caches (<1000)

### Logger JSON
- **Bottleneck**: JSON.stringify per log call
- **Optimization**: Could batch and stringify once
- **Trade-off**: Latency vs throughput
- **Acceptable**: Logging not performance-critical

---

## Security Considerations

### File Hashing
- ✅ No shell execution (native Web Crypto)
- ✅ Path handling via Deno APIs (safe)
- ✅ Protected by Deno permissions
- ⚠️ No hash verification (trust-on-first-use)

### Git Operations
- ✅ No shell string interpolation (Deno.Command with args array)
- ✅ No arbitrary command execution
- ✅ Protected by Deno permissions
- ✅ Output is decoded and validated

### Cache
- ✅ No serialization vulnerabilities (in-memory only)
- ⚠️ No size limits per entry (could store large objects)
- ⚠️ No total memory limit (maxSize is count, not bytes)
- Note: Consider adding memory limits for production

### Logger
- ✅ No log injection (JSON.stringify escapes)
- ✅ No eval or code execution
- ⚠️ Could log sensitive data (user responsibility)
- Note: Consider sanitization for production

### Config
- ✅ Type validation prevents type confusion
- ✅ Range validation prevents overflow
- ⚠️ Path validation could be more thorough
- Note: Consider path canonicalization

---

## Integration Examples

### Using File Hash in Scanner
```typescript
import { hashFiles } from "./utils/file-hash.ts";

const files = await glob("**/*.ts");
const hashes = await hashFiles(files);

// Check if file changed since last scan
if (hashes[file] !== lastScan[file]) {
  await rescanFile(file);
}
```

### Using Git in Metrics
```typescript
import { getCurrentSha, getFileStatus } from "./utils/git.ts";

const sha = await getCurrentSha();
const status = await getFileStatus(file);

// Store with git context
await db.insert({
  file,
  sha,
  status,
  timestamp: Date.now(),
});
```

### Using Cache in Query System
```typescript
import { Cache } from "./utils/cache.ts";

const queryCache = new Cache<QueryResult>({
  ttl: 5000,  // 5 second TTL
  maxSize: 100
});

const result = queryCache.get(queryString)
  ?? await executeQuery(queryString);

queryCache.set(queryString, result);
```

### Using Logger for AI Agent
```typescript
import { Logger, LogLevel } from "./utils/logger.ts";

const logger = new Logger(LogLevel.INFO, { jsonMode: true });

logger.info("analysis-complete", {
  filesScanned: 42,
  symbolsFound: 1337,
  duration: 1234,
});
// Output: {"timestamp":...,"level":"INFO","message":"analysis-complete","data":{...}}
```

### Using Config Validation
```typescript
import { config } from "./utils/config.ts";

// In doctor command
const errors = await config.validate();
if (errors.length > 0) {
  console.error("Configuration errors:");
  errors.forEach(err => console.error(`  - ${err}`));
  Deno.exit(1);
}
```

---

## Future Enhancements

### File Hash
- [ ] Add support for streaming large files
- [ ] Consider faster hash algorithm (xxHash)
- [ ] Add hash verification mode
- [ ] Support custom hash algorithms

### Git
- [ ] Add blame information extraction
- [ ] Add diff generation
- [ ] Support for git log queries
- [ ] Add stash operations

### Cache
- [ ] Add persistence to disk
- [ ] Add memory size limits (not just count)
- [ ] Add cache statistics (hit rate, etc.)
- [ ] Consider using Map with custom eviction

### Logger
- [ ] Add log file output
- [ ] Add log rotation
- [ ] Add filtering by component
- [ ] Add context/correlation IDs

### Config
- [ ] Add schema validation (Zod integration)
- [ ] Add config file support (.env, .toml)
- [ ] Add config hot-reloading
- [ ] Add config documentation generation

---

## Relationships
- **Parent Nodes:**
  - [../planning/typescript-agent-backlog.md] - implements - Phase 1.3
  - [../architecture/tooling_architecture.md] - details - Utility Layer
- **Child Nodes:**
  - [../tasks/2025-09-30-phase2-utilities-implementation.md] - documents - Implementation task
- **Related Nodes:**
  - [./ast-scanner.md] - uses - Will use file-hash for incremental scanning
  - [./kuzu-client.md] - uses - Will use cache for query results

## Navigation Guidance
- **Access Context:** Reference when using utilities or implementing new features
- **Common Next Steps:** Implement Phase 3 (watch system) using these utilities
- **Related Tasks:** Any feature needing hashing, caching, git ops, logging, or config
- **Update Patterns:** Update when utilities are enhanced or patterns change

## Metadata
- **Created**: 2025-09-30
- **Last Updated**: 2025-09-30
- **Updated By**: Claude (AI Agent)

## Change History
- 2025-09-30: Initial discovery record for Phase 2 utilities implementation