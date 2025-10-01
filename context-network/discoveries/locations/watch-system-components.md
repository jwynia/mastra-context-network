# Watch System Components - Key Locations

## Overview
Key code locations for the file watching and incremental update system.

## Classification
- **Domain:** Locations
- **Stability:** Stable
- **Abstraction:** Implementation Detail
- **Confidence:** Established

## Component Locations

### Debouncer Utility
**What**: Generic debouncing utility for delaying function execution
**Where**: `scripts/utils/debounce.ts`
**Key Exports**:
- `Debouncer<T>` class (lines 17-82)

**Important Methods**:
- `trigger(...args)` - Trigger with timer reset (`debounce.ts:38-55`)
- `flush()` - Execute immediately (`debounce.ts:60-70`)
- `cancel()` - Cancel pending execution (`debounce.ts:75-81`)

**Tests**: `scripts/utils/debounce.test.ts` (10 test cases, 143 lines)

**Usage Example**:
```typescript
import { Debouncer } from "./utils/debounce.ts";
const debouncer = new Debouncer(() => console.log("done"), 500);
debouncer.trigger();  // Will execute after 500ms
```

**Related**: Used by FileWatcher, reusable for other features

---

### Incremental Scanner
**What**: Detects file changes by comparing hash snapshots
**Where**: `scripts/lib/incremental-scanner.ts`
**Key Exports**:
- `IncrementalScanner` class (lines 24-66)
- `FileHashRecord` type (line 6)
- `FileChanges` interface (lines 8-12)

**Important Methods**:
- `detectChanges(previous, current)` - Full change analysis (`incremental-scanner.ts:31-53`)
- `needsRescan(previous, current)` - Files to rescan (`incremental-scanner.ts:62-65`)

**Algorithm**: O(n + m) where n = old files, m = new files

**Tests**: `scripts/lib/incremental-scanner.test.ts` (10 test cases, 158 lines)

**Usage Example**:
```typescript
import { IncrementalScanner } from "./lib/incremental-scanner.ts";
const scanner = new IncrementalScanner();
const changes = scanner.detectChanges(oldHashes, newHashes);
// changes = { added: [...], modified: [...], deleted: [...] }
```

**Related**: Used by watch command for change detection

---

### File Watcher
**What**: Monitors file system changes with debouncing
**Where**: `scripts/lib/file-watcher.ts`
**Key Exports**:
- `FileWatcher` class (lines 42-208)
- `WatchOptions` interface (lines 9-18)
- `FileEvent` interface (lines 20-23)
- `WatchCallback` type (line 25)

**Important Methods**:
- `start(callback)` - Begin watching (`file-watcher.ts:62-109`)
- `stop()` - Stop watching with flush (`file-watcher.ts:114-134`)
- `filterPaths(paths)` - Apply ignore patterns (`file-watcher.ts:139-155`)
- `matchPattern(path, pattern)` - Glob matching (`file-watcher.ts:161-184`)

**Key Features**:
- Uses `Deno.watchFs` for native file watching
- Integrates Debouncer for event consolidation
- Pattern-based filtering (glob-like)
- Graceful shutdown with cleanup

**Pattern Matching**: Lines 161-184 (convert glob to regex)
**Event Loop**: Lines 81-101 (async iteration over file events)

**No Unit Tests**: Integration component, manual testing only

**Usage Example**:
```typescript
import { FileWatcher } from "./lib/file-watcher.ts";
const watcher = new FileWatcher({
  paths: ["./src"],
  debounceMs: 500,
  ignorePatterns: ["**/*.test.ts"]
});
await watcher.start(async (event) => {
  console.log("Changed:", event.paths);
});
```

**Related**: Used by watch command, could be used by other monitoring features

---

### Watch Command
**What**: CLI command for monitoring files and incremental updates
**Where**: `scripts/commands/watch.ts`
**Key Exports**:
- `watchCommand` - Cliffy Command (lines 26-42)

**Important Functions**:
- `runWatch(options)` - Main watch loop (`watch.ts:47-134`)
- `getInitialHashes(path, patterns)` - Initial file scan (`watch.ts:139-163`)
- `getCurrentHashes(path, patterns)` - Re-scan files (`watch.ts:168-173`)

**Orchestration Flow**:
1. Get initial hashes (lines 63-65)
2. Create FileWatcher (lines 68-72)
3. Register signal handlers (lines 87-88)
4. Start watching with callback (lines 91-133)
5. On change: hash files, detect changes, log summary

**Signal Handling**: Lines 77-88 (graceful shutdown)
**Change Detection**: Lines 98-114 (detect and log changes)

**TODO**: Lines 120-122 (scanner integration pending)

**Command Options**:
- `--path` - Directory to watch (default: ".")
- `--debounce` - Delay in ms (default: 500)
- `--include` - Include patterns (comma-separated)
- `--exclude` - Exclude patterns (comma-separated)
- `--verbose` - Enable debug logging

**Usage Example**:
```bash
deno task watch --path src --verbose
deno task watch --exclude "*.test.ts,**/generated/**"
```

**Related**: Integrated into CLI router (`scripts/cli.ts:36`)

---

## Component Relationships

```
watch command (CLI layer)
    ├─> FileWatcher (integration layer)
    │     ├─> Deno.watchFs (platform API)
    │     └─> Debouncer (utility layer)
    ├─> IncrementalScanner (business logic)
    │     └─> file-hash utility (from Phase 2)
    └─> logger (utility layer)
```

---

## File Organization

```
scripts/
  utils/
    debounce.ts               # Pure utility (reusable)
    debounce.test.ts          # 10 unit tests
  lib/
    incremental-scanner.ts    # Pure business logic
    incremental-scanner.test.ts  # 10 unit tests
    file-watcher.ts           # Integration wrapper
  commands/
    watch.ts                  # CLI orchestration
```

---

## Testing Locations

**Unit Tests** (TDD, run via `deno task test`):
- `scripts/utils/debounce.test.ts` - 10 test cases
- `scripts/lib/incremental-scanner.test.ts` - 10 test cases

**Manual Tests** (integration):
- Run: `deno task watch --verbose`
- Test file changes, signal handling, pattern filtering

---

## Integration Points

### CLI Router
**Where**: `scripts/cli.ts:36`
```typescript
.command("watch", watchCommand)
```

**Help Display**:
```bash
deno task cli watch --help
```

### Configuration
**Where**: `scripts/utils/config.ts`
```typescript
watchIgnorePatterns: string[]  // Default ignore patterns
watchDebounceMs: number        // Default debounce delay
```

### Logger
**Where**: `scripts/utils/logger.ts`
- Used throughout for info/debug/error logging
- Supports verbose mode with `--verbose` flag

### File Hash Utility
**Where**: `scripts/utils/file-hash.ts` (Phase 2)
- `hashFiles(paths)` - Batch hash files
- Used for change detection

---

## Common Navigation Patterns

### "I want to understand file watching"
1. Start: `discoveries/architecture/watch-system-design.md` (architecture)
2. Then: This file (code locations)
3. Then: Read `file-watcher.ts` (implementation)

### "I want to add a new watch feature"
1. Check: `file-watcher.ts` (can it be done there?)
2. Or: Create new command using FileWatcher
3. Reference: `watch.ts` for patterns

### "I want to debug watch issues"
1. Enable: `--verbose` flag for debug logging
2. Check: Event handling in `file-watcher.ts:81-101`
3. Check: Pattern matching in `file-watcher.ts:161-184`

### "I want to test watch functionality"
1. Unit tests: Run `deno task test`
2. Manual test: Run `deno task watch --verbose`
3. Monitor: Edit files and observe console output

---

## Performance Hot Spots

**Pattern Matching** (`file-watcher.ts:161-184`):
- Called for every file event
- Creates new RegExp each time
- **Optimization**: Add pattern caching (see code review)

**File Hashing** (`watch.ts:96`):
- Reads all watched files
- ~1ms per file
- **Optimization**: Already parallelized via `hashFiles()`

**Change Detection** (`incremental-scanner.ts:31-53`):
- O(n + m) algorithm
- Fast for typical project sizes
- **No optimization needed**

---

## Future Locations (Pending Implementation)

**Database Integration** (Phase 3.2):
- DuckDB schema for file_hashes table
- Persistence of hash state
- Location: TBD in `scripts/lib/` or `scripts/commands/scan.ts`

**Git Hooks** (Phase 3.3):
- Post-commit hook script
- Location: `scripts/hooks/post-commit.ts`
- Integration: Call watch/scan on commit

---

## Relationships
- **Parent Nodes:**
  - [../tasks/2025-09-30-phase3-watch-system-implementation.md] - locates - Implementation task
  - [../architecture/watch-system-design.md] - locates - Architecture decisions
- **Related Nodes:**
  - [./semantic-analysis-tools.md] - complements - Scanner locations
  - [../implementation/utilities-layer.md] - documents - Utility components

## Navigation Guidance
- **Access Context**: Quick reference when working on watch system
- **Common Use**: Finding code locations, understanding component relationships
- **Related Tasks**: Debugging, enhancing, or extending watch functionality
- **Update Patterns**: Update when new watch components added or locations change

## Metadata
- **Created**: 2025-09-30
- **Last Updated**: 2025-09-30
- **Updated By**: Claude (AI Agent)
- **Task Context**: Phase 3 implementation retrospective

## Change History
- 2025-09-30: Initial creation for watch system components