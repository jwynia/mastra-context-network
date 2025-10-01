/**
 * Tests for config utility validation
 * Tests configuration validation and error handling
 */

import { assertEquals, assertExists, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ConfigManager } from "./config.ts";

Deno.test("config", async (t) => {
  await t.step("ConfigManager - should load default configuration", () => {
    const config = new ConfigManager();
    const all = config.getAll();

    assertExists(all.kuzuDbPath, "Should have kuzuDbPath");
    assertExists(all.duckdbPath, "Should have duckdbPath");
    assertEquals(typeof all.agentContextWindow, "number", "agentContextWindow should be number");
  });

  await t.step("ConfigManager - should get individual config values", () => {
    const config = new ConfigManager();

    const kuzuPath = config.get("kuzuDbPath");
    assertExists(kuzuPath, "Should get kuzuDbPath");
    assertEquals(typeof kuzuPath, "string", "kuzuDbPath should be string");
  });

  await t.step("ConfigManager - should set config values", () => {
    const config = new ConfigManager();

    config.set("agentMaxFiles", 50);
    assertEquals(config.get("agentMaxFiles"), 50, "Should update value");
  });

  await t.step("ConfigManager - should validate numeric ranges", () => {
    const config = new ConfigManager();

    // Valid range
    config.set("agentContextWindow", 10);
    assertEquals(config.get("agentContextWindow"), 10);

    // Invalid range (negative)
    assertThrows(
      () => config.set("agentContextWindow", -5),
      Error,
      "must be positive"
    );

    // Invalid range (zero)
    assertThrows(
      () => config.set("agentContextWindow", 0),
      Error,
      "must be positive"
    );
  });

  await t.step("ConfigManager - should validate debounce time", () => {
    const config = new ConfigManager();

    // Valid debounce
    config.set("watchDebounceMs", 500);
    assertEquals(config.get("watchDebounceMs"), 500);

    // Too low
    assertThrows(
      () => config.set("watchDebounceMs", 10),
      Error,
      "watchDebounceMs must be at least 50ms"
    );

    // Negative
    assertThrows(
      () => config.set("watchDebounceMs", -100),
      Error,
      "must be positive"
    );
  });

  await t.step("ConfigManager - should validate analysis depth", () => {
    const config = new ConfigManager();

    // Valid depth
    config.set("analysisMaxDepth", 5);
    assertEquals(config.get("analysisMaxDepth"), 5);

    // Too deep
    assertThrows(
      () => config.set("analysisMaxDepth", 20),
      Error,
      "analysisMaxDepth must be between 1 and 10"
    );

    // Too shallow
    assertThrows(
      () => config.set("analysisMaxDepth", 0),
      Error,
      "analysisMaxDepth must be between 1 and 10"
    );
  });

  await t.step("ConfigManager - should validate boolean types", () => {
    const config = new ConfigManager();

    config.set("analysisIncludeTests", true);
    assertEquals(config.get("analysisIncludeTests"), true);

    config.set("analysisIncludeTests", false);
    assertEquals(config.get("analysisIncludeTests"), false);
  });

  await t.step("ConfigManager - should validate database paths exist on validate()", async () => {
    const config = new ConfigManager();

    // Set to a path that doesn't exist
    config.set("kuzuDbPath", "/nonexistent/path/db");

    // Validation should fail
    const errors = await config.validate();
    assertEquals(errors.length > 0, true, "Should have validation errors");
    assertEquals(
      errors.some(e => e.includes("kuzuDbPath")),
      true,
      "Should have error for kuzuDbPath"
    );
  });

  await t.step("ConfigManager - should validate ignore patterns are valid globs", () => {
    const config = new ConfigManager();

    // Valid patterns
    config.set("watchIgnorePatterns", ["**/*.test.ts", "**/node_modules/**"]);
    assertEquals(config.get("watchIgnorePatterns").length, 2);

    // Empty is OK
    config.set("watchIgnorePatterns", []);
    assertEquals(config.get("watchIgnorePatterns").length, 0);
  });

  await t.step("ConfigManager - should reload configuration from environment", () => {
    const config = new ConfigManager();

    const originalValue = config.get("agentMaxFiles");

    // Change environment variable
    Deno.env.set("AGENT_MAX_FILES", "99");

    // Reload should pick up new value
    config.reload();
    assertEquals(config.get("agentMaxFiles"), 99, "Should reload from environment");

    // Cleanup
    Deno.env.delete("AGENT_MAX_FILES");
  });

  await t.step("ConfigManager - should return all validation errors at once", async () => {
    const config = new ConfigManager();

    // Set multiple invalid values
    config.set("kuzuDbPath", "/nonexistent1");
    config.set("duckdbPath", "/nonexistent2");

    const errors = await config.validate();

    assertEquals(errors.length >= 2, true, "Should return multiple errors");
  });
});