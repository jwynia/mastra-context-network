/**
 * DuckDB Analytics Client - Handles metrics and analytics operations
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { config } from "../utils/config.ts";
import { logger } from "../utils/logger.ts";

const execAsync = promisify(exec);

export interface MetricRecord {
  timestamp: Date;
  metric_type: string;
  entity_id: string;
  entity_type: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface FileMetrics {
  filePath: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  complexitySum: number;
  complexityAvg: number;
  importCount: number;
  exportCount: number;
  classCount: number;
  functionCount: number;
  lastAnalyzed?: Date;
}

export interface QueryMetrics {
  query: string;
  executionTime: number;
  resultCount: number;
  timestamp: Date;
  success: boolean;
}

export interface DuckDBQueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  executionTime?: number;
}

export class DuckDBClient {
  private dbPath: string;
  private isInitialized = false;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || config.get("duckdbPath");
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!existsSync(this.dbPath)) {
      throw new Error(`DuckDB database not found at ${this.dbPath}. Run 'deno task db:init' first.`);
    }

    // Test connection with a simple query
    try {
      await this.query("SELECT 1 as test");
      this.isInitialized = true;
      logger.debug(`DuckDB client initialized with database at ${this.dbPath}`);
    } catch (error) {
      throw new Error(`Failed to connect to DuckDB database: ${error}`);
    }
  }

  /**
   * Execute a SQL query
   */
  async query(sql: string): Promise<DuckDBQueryResult> {
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(
        `echo "${sql.replace(/"/g, '\\"')}" | duckdb ${this.dbPath} -json`
      );

      if (stderr) {
        throw new Error(`Query error: ${stderr}`);
      }

      const result = this.parseQueryOutput(stdout);
      result.executionTime = Date.now() - startTime;
      
      return result;
    } catch (error) {
      logger.error(`Query failed: ${sql}`);
      throw error;
    }
  }

  /**
   * Parse DuckDB JSON output
   */
  private parseQueryOutput(output: string): DuckDBQueryResult {
    if (!output.trim()) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    try {
      const data = JSON.parse(output);
      
      if (Array.isArray(data) && data.length > 0) {
        const columns = Object.keys(data[0]);
        return {
          rows: data,
          columns,
          rowCount: data.length
        };
      }
      
      return { rows: [], columns: [], rowCount: 0 };
    } catch (error) {
      logger.error(`Failed to parse DuckDB output: ${error}`);
      return { rows: [], columns: [], rowCount: 0 };
    }
  }

  /**
   * Insert file metrics
   */
  async insertFileMetrics(metrics: FileMetrics[]): Promise<void> {
    if (metrics.length === 0) return;

    const values = metrics.map(m =>
      `('${this.escapeSQL(m.filePath)}', ${m.totalLines}, ${m.codeLines}, ` +
      `${m.commentLines}, ${m.blankLines}, ${m.complexitySum}, ${m.complexityAvg}, ` +
      `${m.importCount}, ${m.exportCount}, ${m.classCount}, ${m.functionCount}` +
      (m.lastAnalyzed ? `, '${m.lastAnalyzed.toISOString()}'` : '') + `)`
    ).join(',\n');

    const hasLastAnalyzed = metrics.some(m => m.lastAnalyzed);
    const sql = `
      INSERT OR REPLACE INTO file_metrics
        (file_path, total_lines, code_lines, comment_lines, blank_lines,
         complexity_sum, complexity_avg, import_count, export_count,
         class_count, function_count${hasLastAnalyzed ? ', last_analyzed' : ''})
      VALUES ${values}
    `;

    await this.query(sql);
    logger.debug(`Inserted ${metrics.length} file metrics`);
  }

  /**
   * Insert performance metrics
   */
  async insertMetric(metric: MetricRecord): Promise<void> {
    const sql = `
      INSERT INTO metrics 
        (timestamp, metric_type, entity_id, entity_type, value, metadata)
      VALUES (
        '${metric.timestamp.toISOString()}',
        '${this.escapeSQL(metric.metric_type)}',
        '${this.escapeSQL(metric.entity_id)}',
        '${this.escapeSQL(metric.entity_type)}',
        ${metric.value},
        '${JSON.stringify(metric.metadata || {})}'
      )
    `;

    await this.query(sql);
  }

  /**
   * Insert query performance metrics
   */
  async insertQueryMetrics(metrics: QueryMetrics): Promise<void> {
    const sql = `
      INSERT INTO query_performance 
        (query_text, execution_time, result_count, timestamp, success)
      VALUES (
        '${this.escapeSQL(metrics.query)}',
        ${metrics.executionTime},
        ${metrics.resultCount},
        '${metrics.timestamp.toISOString()}',
        ${metrics.success}
      )
    `;

    await this.query(sql);
  }

  /**
   * Get file metrics for incremental scanning
   */
  async getFileMetrics(filePath: string): Promise<FileMetrics | null> {
    const sql = `
      SELECT * FROM file_metrics
      WHERE file_path = '${this.escapeSQL(filePath)}'
      LIMIT 1
    `;

    const result = await this.query(sql);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      filePath: row.file_path,
      totalLines: row.total_lines,
      codeLines: row.code_lines,
      commentLines: row.comment_lines,
      blankLines: row.blank_lines,
      complexitySum: row.complexity_sum,
      complexityAvg: row.complexity_avg,
      importCount: row.import_count,
      exportCount: row.export_count,
      classCount: row.class_count,
      functionCount: row.function_count,
      lastAnalyzed: row.last_analyzed ? new Date(row.last_analyzed) : undefined
    };
  }

  /**
   * Get changed files since last scan
   */
  async getChangedFiles(since: Date): Promise<string[]> {
    const sql = `
      SELECT DISTINCT file_path 
      FROM file_metrics 
      WHERE last_modified > '${since.toISOString()}'
      ORDER BY file_path
    `;

    const result = await this.query(sql);
    return result.rows.map(row => row.file_path);
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(
    metricType: string,
    entityType?: string,
    since?: Date
  ): Promise<any[]> {
    const conditions = [`metric_type = '${this.escapeSQL(metricType)}'`];
    
    if (entityType) {
      conditions.push(`entity_type = '${this.escapeSQL(entityType)}'`);
    }
    
    if (since) {
      conditions.push(`timestamp > '${since.toISOString()}'`);
    }

    const sql = `
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        entity_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count
      FROM metrics
      WHERE ${conditions.join(' AND ')}
      GROUP BY hour, entity_type
      ORDER BY hour DESC
    `;

    const result = await this.query(sql);
    return result.rows;
  }

  /**
   * Get complexity trends
   */
  async getComplexityTrends(limit = 10): Promise<any[]> {
    const sql = `
      SELECT
        file_path,
        complexity_sum as complexity,
        total_lines as line_count,
        ROUND(complexity_avg, 2) as complexity_per_line,
        last_analyzed
      FROM file_metrics
      ORDER BY complexity_sum DESC
      LIMIT ${limit}
    `;

    const result = await this.query(sql);
    return result.rows;
  }

  /**
   * Get dependency statistics
   */
  async getDependencyStats(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(DISTINCT file_path) as total_files,
        AVG(dependencies) as avg_dependencies,
        MAX(dependencies) as max_dependencies,
        MIN(dependencies) as min_dependencies,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dependencies) as median_dependencies,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY dependencies) as p95_dependencies
      FROM file_metrics
    `;

    const result = await this.query(sql);
    return result.rows[0];
  }

  /**
   * Get query performance statistics
   */
  async getQueryPerformanceStats(): Promise<any> {
    const sql = `
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as query_count,
        AVG(execution_time) as avg_time,
        MAX(execution_time) as max_time,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
      FROM query_performance
      WHERE timestamp > NOW() - INTERVAL 24 HOUR
      GROUP BY hour
      ORDER BY hour DESC
    `;

    const result = await this.query(sql);
    return result.rows;
  }

  /**
   * Clean old metrics data
   */
  async cleanOldMetrics(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const sql = `
      DELETE FROM metrics 
      WHERE timestamp < '${cutoffDate.toISOString()}'
    `;

    const result = await this.query(sql);
    logger.info(`Cleaned metrics older than ${daysToKeep} days`);
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    // Get table sizes - use actual existing tables
    const tables = ['file_metrics', 'analysis_history', 'dependency_metrics', 'symbol_complexity'];

    for (const table of tables) {
      try {
        const result = await this.query(`SELECT COUNT(*) as count FROM ${table}`);
        stats[`${table}_count`] = result.rows[0]?.count || 0;
      } catch {
        stats[`${table}_count`] = 0;
      }
    }

    // Get database size (use correct column names)
    try {
      const sizeResult = await this.query(`
        SELECT
          database_name,
          path
        FROM duckdb_databases()
      `);

      if (sizeResult.rows.length > 0) {
        stats.database = sizeResult.rows[0];
      }
    } catch {
      // duckdb_databases() might not be available in all versions
      stats.database = { name: 'metrics', path: this.dbPath };
    }

    return stats;
  }

  /**
   * Helper to escape SQL strings
   */
  private escapeSQL(str: string): string {
    return str.replace(/'/g, "''");
  }

  /**
   * Execute raw SQL (for migrations, etc.)
   */
  async execute(sql: string): Promise<void> {
    await this.query(sql);
  }

  /**
   * Clear all data from specific table
   */
  async clearTable(tableName: string): Promise<void> {
    const validTables = ['metrics', 'file_metrics', 'query_performance', 'scan_history'];
    
    if (!validTables.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    await this.query(`DELETE FROM ${tableName}`);
    logger.info(`Cleared all data from ${tableName} table`);
  }
}

// Export singleton instance for convenience
export const duckdbClient = new DuckDBClient();