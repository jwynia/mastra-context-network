# Database Client Key Locations

## Kuzu Client Implementation

### Configuration Loading
- **What**: Database path resolution from environment/config
- **Where**: `scripts/utils/config.ts:40-53`
- **Key insight**: Path normalization for `/workspace/` prefix issue

### Query Execution
- **What**: Cypher query execution via Kuzu CLI
- **Where**: `scripts/lib/kuzu-client.ts:64-101`
- **Method**: Writes to temp file, executes via shell command

### Symbol Insertion
- **What**: Creating Symbol nodes in graph
- **Where**: `scripts/lib/kuzu-client.ts:203-222`
- **Format**: `CREATE (:Symbol {props});` - semicolon required!

### Relationship Creation
- **What**: Creating edges between nodes
- **Where**: `scripts/lib/kuzu-client.ts:269-289`
- **Note**: Assumes nodes already exist from symbol insertion

## DuckDB Client Implementation

### File Metrics Schema
- **What**: FileMetrics interface definition
- **Where**: `scripts/lib/duckdb-client.ts:22-35`
- **Columns**: totalLines, codeLines, commentLines, blankLines, complexitySum, etc.

### Metrics Insertion
- **What**: INSERT OR REPLACE for file metrics
- **Where**: `scripts/lib/duckdb-client.ts:135-156`
- **Note**: Uses different schema than initially expected

### Query Execution
- **What**: SQL execution via DuckDB CLI
- **Where**: `scripts/lib/duckdb-client.ts:64-101`
- **Format**: JSON output mode for structured results

## Common Patterns

### Database Initialization Check
Both clients check for database existence:
- Kuzu: `scripts/lib/kuzu-client.ts:44-58`
- DuckDB: `scripts/lib/duckdb-client.ts:57-71`

### Batch Query Execution
- **Location**: `scripts/lib/kuzu-client.ts:290-310`
- **Pattern**: Executes queries one by one, not in batch
- **Reason**: CREATE statements don't work well in batch mode