# Discovery: Kuzu Requires Semicolons for Query Termination

## What I Was Looking For
Why manually entered Cypher queries worked but programmatically generated ones didn't.

## Found
**Location**: `scripts/lib/kuzu-client.ts:217,244,281-284`

Kuzu CLI requires semicolons to terminate Cypher statements when reading from stdin or files, but not when typed interactively.

## Summary
Generated CREATE queries like `CREATE (:Symbol {...})` were syntactically correct but missing the terminating semicolon. When executed via file input or stdin, Kuzu would wait for more input or silently fail.

## Significance
This subtle difference between interactive and programmatic execution caused all INSERT operations to fail without clear error messages. The queries would appear to execute successfully (no errors) but no data would be inserted.

## Solution
Added semicolons to all generated Cypher queries:
- Symbol creation: `CREATE (:Symbol ${props});`
- Type creation: `CREATE (:Type ${props});`
- Relationship creation: `CREATE (from)-[:${type}]->(to);`

## Testing
Verified by:
1. Writing query to temp file and inspecting
2. Executing manually with semicolon - worked
3. Executing without semicolon - failed silently

## Related
- [[kuzu-path-issue]] - Discovered while debugging this issue
- [[kuzu-relationship-tables]] - Missing tables found during testing