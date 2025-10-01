/**
 * Tests for logger utility enhancements
 * Tests JSON output mode and structured logging
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Logger, LogLevel } from "./logger.ts";

Deno.test("logger", async (t) => {
  await t.step("Logger - should support JSON mode", () => {
    const logger = new Logger(LogLevel.INFO, { jsonMode: true });

    // Capture console output
    const outputs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      outputs.push(args.join(" "));
    };

    logger.info("test message");

    // Restore console.log
    console.log = originalLog;

    assertEquals(outputs.length, 1, "Should output one line");

    const parsed = JSON.parse(outputs[0]);
    assertEquals(parsed.level, "INFO", "Should have level field");
    assertEquals(parsed.message, "test message", "Should have message field");
    assertEquals(typeof parsed.timestamp, "number", "Should have timestamp");
  });

  await t.step("Logger - should support structured data in JSON mode", () => {
    const logger = new Logger(LogLevel.INFO, { jsonMode: true });

    const outputs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      outputs.push(args.join(" "));
    };

    logger.info("test", { count: 42, name: "example" });

    console.log = originalLog;

    const parsed = JSON.parse(outputs[0]);
    assertEquals(parsed.level, "INFO");
    assertEquals(parsed.message, "test");
    assertEquals(parsed.data, { count: 42, name: "example" });
  });

  await t.step("Logger - should not use JSON mode by default", () => {
    const logger = new Logger(LogLevel.INFO);

    const outputs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      outputs.push(args.join(" "));
    };

    logger.info("test message");

    console.log = originalLog;

    // Should not be valid JSON
    let isJSON = true;
    try {
      JSON.parse(outputs[0]);
    } catch {
      isJSON = false;
    }

    assertEquals(isJSON, false, "Default mode should not be JSON");
  });

  await t.step("Logger - should respect log level in JSON mode", () => {
    const logger = new Logger(LogLevel.ERROR, { jsonMode: true });

    const outputs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      outputs.push(args.join(" "));
    };

    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    console.log = originalLog;

    // Only error should be logged (but through console.error, not console.log)
    // So console.log should have 0 outputs
    assertEquals(outputs.length, 0, "Should respect log level");
  });

  await t.step("Logger - should toggle JSON mode", () => {
    const logger = new Logger(LogLevel.INFO, { jsonMode: false });

    // Start in normal mode
    let outputs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      outputs.push(args.join(" "));
    };

    logger.info("normal");
    let isJSON = true;
    try {
      JSON.parse(outputs[0]);
    } catch {
      isJSON = false;
    }
    assertEquals(isJSON, false, "Should start in normal mode");

    // Switch to JSON mode
    outputs = [];
    logger.setJsonMode(true);
    logger.info("json");

    console.log = originalLog;

    const parsed = JSON.parse(outputs[0]);
    assertEquals(parsed.level, "INFO", "Should switch to JSON mode");
  });

  await t.step("Logger - should handle errors in JSON mode", () => {
    const logger = new Logger(LogLevel.ERROR, { jsonMode: true });

    const outputs: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      outputs.push(args.join(" "));
    };

    const error = new Error("test error");
    logger.error("error occurred", error);

    console.error = originalError;

    const parsed = JSON.parse(outputs[0]);
    assertEquals(parsed.level, "ERROR");
    assertEquals(parsed.message, "error occurred");
    assertEquals(typeof parsed.data, "object");
  });
});