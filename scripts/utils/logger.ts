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

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(dim("[DEBUG]"), ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(blue("[INFO]"), ...args);
    }
  }

  success(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(green("✓"), ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(yellow("⚠"), ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(red("✗"), ...args);
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