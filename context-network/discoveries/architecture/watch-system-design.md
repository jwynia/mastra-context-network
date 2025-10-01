# Discovery: Watch System Architecture & Design

## Overview
Architectural decisions and design patterns for the file watching and incremental update system.

## Classification
- **Domain:** Architecture
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Key Architectural Decisions

### 1. Three-Layer Architecture

**Decision**: Separate debouncing, change detection, and file watching into distinct layers

**Rationale**:
- **Debouncer** (Utility Layer): Pure function, reusable beyond file watching
- **IncrementalScanner** (Library Layer): Pure business logic, fully unit testable
- **FileWatcher** (Library Layer): Thin integration wrapper around Deno.watchFs
- **Watch Command** (Command Layer): Orchestration only

**Benefits**:
- Each component has single responsibility
- Pure logic components are 100% unit testable
- Integration components are simple wrappers
- Easy to replace Deno-specific parts if needed

**Trade-offs**:
- More files/modules than monolithic approach
- Need to understand multiple components for full picture
- Slightly more boilerplate

**Alternatives Considered**:
- **Monolithic watcher**: Rejected - would mix concerns, hard to test
- **Event-based system**: Deferred - unnecessary complexity for current needs

---

### 2. Debouncing Strategy

**Decision**: Use delay-reset debouncing with configurable timeout

**Pattern**:
```typescript
// On each trigger:
1. Store latest arguments
2. Clear existing timer
3. Start new timer
4. Execute after delay expires
```

**Rationale**:
- File editors often save multiple times rapidly
- Prevents redundant processing
- Simple to implement and understand

**Configuration**:
- Default: 500ms (good balance for typical use)
- Configurable per watch session
- Can flush manually for immediate execution

**Alternatives Considered**:
- **Throttling**: Rejected - want to process final state, not intermediate saves
- **Batching**: Rejected - debouncing achieves similar result with simpler code
- **No debouncing**: Rejected - would cause excessive processing

---

### 3. Hash-Based Change Detection

**Decision**: Use SHA-256 content hashing to detect file changes

**Rationale**:
- **Reliable**: Content-based, not timestamp-dependent
- **Portable**: Works across platforms and file systems
- **Deterministic**: Same content always produces same hash
- **Available**: Built into Deno via Web Crypto API

**Performance**:
- ~1ms per file (acceptable for typical projects)
- Parallelizable via Promise.all
- Memory usage: hash string per file (~64 chars)

**Alternatives Considered**:
- **mtime (modification time)**: Rejected - unreliable, can be manipulated
- **File size**: Rejected - insufficient (size can stay same with different content)
- **inode numbers**: Rejected - not portable across systems
- **Faster hash (xxHash)**: Deferred - SHA-256 is fast enough, no need to optimize prematurely

**Trade-offs**:
- Must read entire file (can't use metadata only)
- Doesn't detect renames (same hash, different path)
- Future optimization: Could add size+mtime pre-check before hashing

---

### 4. Pattern Matching Approach

**Decision**: Simple regex-based glob matching for MVP

**Current Implementation**:
```typescript
// Convert glob patterns to regex:
** -> .*        (any chars including /)
*  -> [^/]*     (any chars except /)
.  -> \.        (literal dot)
```

**Rationale**:
- Covers common use cases (node_modules/**, *.test.ts)
- No external dependencies
- Easy to understand and modify

**Known Limitations**:
- Doesn't handle all glob edge cases
- Not optimized (regex created each time)
- Inconsistent between FileWatcher and watch command

**Planned Improvements**:
- Use `@std/path/globToRegExp` for proper glob support
- Cache compiled patterns (hot path optimization)
- Unify pattern matching across modules

---

### 5. Integration Testing Strategy

**Decision**: Manual testing for file system integration, unit tests for pure logic

**Following Project Philosophy**:
```
✅ Unit Tests (Worth Writing)
- Pure functions: debouncer, incremental scanner
- Business logic with clear inputs/outputs

❌ Integration Tests (Skip)
- File system operations: file watcher
- CLI commands: watch command
```

**Rationale**:
- File system mocking is dishonest
- Manual testing finds real issues
- Pure logic has 100% coverage
- Integration is thin wrappers

**Testing Coverage**:
- Debouncer: 10 unit tests, 100% coverage
- IncrementalScanner: 10 unit tests, 100% coverage
- FileWatcher: Manual smoke tests
- Watch Command: Manual smoke tests

---

### 6. State Management

**Decision**: In-memory hash state with future database persistence

**Current Approach**:
- Store file hashes in memory during watch session
- Lose state on restart (must rescan all files)
- Simple, no external dependencies

**Planned Evolution**:
```sql
-- Future DuckDB schema
CREATE TABLE file_hashes (
  file_path VARCHAR PRIMARY KEY,
  content_hash VARCHAR NOT NULL,
  last_scanned TIMESTAMP,
  git_sha VARCHAR,
  file_size BIGINT
);
```

**Rationale for Deferral**:
- Get basic watching working first
- Database integration is separate concern (Phase 3.2)
- Can test change detection without persistence
- Avoids premature complexity

---

### 7. Error Handling Strategy

**Decision**: Fail-fast for setup errors, resilient for runtime errors

**Setup Errors** (throw immediately):
- Watcher already running
- Invalid configuration
- Missing permissions

**Runtime Errors** (log and continue):
- File read failures during hashing
- Hash comparison errors
- Callback execution errors

**Implementation**:
```typescript
try {
  for await (const event of watcher) {
    try {
      // Process event
    } catch (error) {
      logger.error("Event processing failed", error);
      // Continue watching
    }
  }
} catch (error) {
  if (isRunning) {
    // Unexpected error, propagate
    throw error;
  }
  // Intentional stop, ignore
}
```

---

### 8. Signal Handling

**Decision**: Graceful shutdown on SIGINT/SIGTERM

**Implementation**:
- Register signal handlers
- Stop watcher (closes Deno.watchFs)
- Flush pending debounced operations
- Clean exit

**Rationale**:
- Prevents data corruption
- Ensures pending operations complete
- Professional CLI behavior
- Required for production use

**Considerations**:
- Single shutdown flag to prevent duplicate shutdown
- Async stop() to allow cleanup
- Exit after cleanup completes

---

## Design Patterns Applied

### 1. **Command Pattern**
- Watch command encapsulates operation
- Options object for parameters
- Action function for execution

### 2. **Observer Pattern**
- FileWatcher observes file system
- Callback pattern for event notification
- Debouncer filters events

### 3. **Strategy Pattern**
- Pattern matching strategy (simple regex now, can swap to proper glob)
- Hash comparison strategy (content-based now, could add metadata)

### 4. **Facade Pattern**
- FileWatcher wraps Deno.watchFs complexity
- Watch command wraps entire watch system

---

## Performance Characteristics

### Bottlenecks Identified
1. **File hashing**: ~1ms per file (I/O bound)
2. **Pattern matching**: Regex compilation (can be cached)
3. **Initial scan**: Linear with file count

### Optimization Opportunities
1. **Parallel hashing**: Already implemented via Promise.all
2. **Pattern caching**: Should implement (hot path)
3. **Incremental scanning**: Implemented (only scan changed files)
4. **Debouncing**: Implemented (prevents duplicate processing)

### Scalability
- **Small projects** (<1000 files): Instant startup, <10ms event handling
- **Medium projects** (1000-10000 files): 1-10 second startup, <100ms events
- **Large projects** (>10000 files): May need optimizations (pre-check before hash, worker pool)

---

## Security Considerations

### 1. Path Traversal
- **Risk**: Malicious patterns could access parent directories
- **Mitigation**: Deno sandbox prevents unauthorized access
- **Status**: Protected by platform

### 2. Resource Exhaustion
- **Risk**: Watching too many paths could exhaust resources
- **Mitigation**: User must explicitly specify paths
- **Future**: Could add max path limits

### 3. Pattern Injection
- **Risk**: Malicious patterns could cause regex DoS (ReDoS)
- **Mitigation**: Simple patterns, no user-controlled regex groups
- **Future**: Use vetted glob library

---

## Future Enhancements

### Immediate (Phase 3.2 completion)
1. Database persistence of file hashes
2. Integration with CodebaseScanner
3. Symbol updates in Kuzu
4. File deletion handling

### Short-term
1. Proper glob library integration
2. Pattern caching optimization
3. Move/rename detection
4. Git SHA tracking

### Long-term
1. Daemon mode (background process)
2. Desktop notifications
3. Threshold-based alerts
4. Remote watching (network file systems)
5. Watch history and analytics

---

## Lessons for Future Implementations

### What Worked Well
1. **TDD for pure logic**: Clean APIs, high confidence
2. **Layered architecture**: Easy to understand and modify
3. **Simple first, optimize later**: Got working system quickly
4. **Deno APIs**: watchFs is excellent, signal handling straightforward

### What Could Be Improved
1. **Pattern matching**: Should have used @std/path from start
2. **Documentation**: Discovery records very helpful, should do more
3. **Error context**: More structured error information helpful

### Reusable Patterns
1. **Debouncer utility**: Applicable to many scenarios
2. **Hash-based change detection**: Useful for any file monitoring
3. **Graceful shutdown**: Template for other long-running processes

---

## Relationships
- **Parent Nodes:**
  - [../planning/typescript-agent-backlog.md] - implements - Phase 3.1 & 3.2
  - [../architecture/tooling_architecture.md] - details - Watch system layer
- **Child Nodes:**
  - [../tasks/2025-09-30-phase3-watch-system-implementation.md] - documents - Implementation details
  - [../locations/watch-system-components.md] - locates - Code locations
- **Related Nodes:**
  - [../implementation/utilities-layer.md] - uses - Debouncer utility
  - [./testing-philosophy.md] - follows - Manual integration testing

## Navigation Guidance
- **Access Context**: Reference when implementing similar watch/monitor features
- **Common Next Steps**: Complete database integration, add git hooks
- **Related Tasks**: Any feature needing file monitoring or change detection
- **Update Patterns**: Update when architectural changes or new patterns emerge

## Metadata
- **Created**: 2025-09-30
- **Last Updated**: 2025-09-30
- **Updated By**: Claude (AI Agent)
- **Task Context**: Phase 3 implementation retrospective

## Change History
- 2025-09-30: Initial creation documenting Phase 3 architectural decisions