/**
 * Simple logging utility for consistent output formatting
 */

import { bold, green, yellow, red, dim, blue } from "https://deno.land/std@0.224.0/fmt/colors.ts";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerOptions {
  /** Enable JSON output mode for structured logging */
  jsonMode?: boolean;
}

class Logger {
  private level: LogLevel;
  private jsonMode: boolean;

  constructor(level: LogLevel = LogLevel.INFO, options: LoggerOptions = {}) {
    this.level = level;
    this.jsonMode = options.jsonMode ?? false;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setJsonMode(enabled: boolean): void {
    this.jsonMode = enabled;
  }

  private formatJson(level: string, message: string, data?: unknown): string {
    return JSON.stringify({
      timestamp: Date.now(),
      level,
      message,
      ...(data !== undefined && { data }),
    });
  }

  debug(...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      if (this.jsonMode) {
        const [message, ...rest] = args;
        console.log(this.formatJson("DEBUG", String(message), rest.length > 0 ? rest[0] : undefined));
      } else {
        console.log(dim("[DEBUG]"), ...args);
      }
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      if (this.jsonMode) {
        const [message, ...rest] = args;
        console.log(this.formatJson("INFO", String(message), rest.length > 0 ? rest[0] : undefined));
      } else {
        console.log(blue("[INFO]"), ...args);
      }
    }
  }

  success(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      if (this.jsonMode) {
        const [message, ...rest] = args;
        console.log(this.formatJson("SUCCESS", String(message), rest.length > 0 ? rest[0] : undefined));
      } else {
        console.log(green("✓"), ...args);
      }
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      if (this.jsonMode) {
        const [message, ...rest] = args;
        console.warn(this.formatJson("WARN", String(message), rest.length > 0 ? rest[0] : undefined));
      } else {
        console.warn(yellow("⚠"), ...args);
      }
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      if (this.jsonMode) {
        const [message, ...rest] = args;
        console.error(this.formatJson("ERROR", String(message), rest.length > 0 ? rest[0] : undefined));
      } else {
        console.error(red("✗"), ...args);
      }
    }
  }

  progress(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(dim(`  ${message}...`));
    }
  }

  section(title: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(bold(`\n${title}`));
      console.log("=" .repeat(50));
    }
  }

  subsection(title: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(bold(`\n${title}`));
    }
  }
}

// Create default logger instance
export const logger = new Logger(
  Deno.env.get("LOG_LEVEL") ?
    LogLevel[Deno.env.get("LOG_LEVEL") as keyof typeof LogLevel] :
    LogLevel.INFO
);

// Export for testing or custom instances
export { Logger };