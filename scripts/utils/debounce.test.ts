/**
 * Tests for debounce utility
 * Debouncing is critical for file watching to avoid rapid-fire events
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Debouncer } from "./debounce.ts";

Deno.test("debounce", async (t) => {
  await t.step("Debouncer - should call function after delay", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger();

    // Should not be called immediately
    assertEquals(callCount, 0, "Should not call immediately");

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(callCount, 1, "Should call once after delay");
  });

  await t.step("Debouncer - should debounce rapid triggers", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    // Trigger multiple times rapidly
    debouncer.trigger();
    debouncer.trigger();
    debouncer.trigger();
    debouncer.trigger();

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(callCount, 1, "Should only call once despite multiple triggers");
  });

  await t.step("Debouncer - should reset timer on each trigger", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger();

    // Trigger again before delay expires
    await new Promise(resolve => setTimeout(resolve, 25));
    debouncer.trigger();

    // Wait less than original delay would have been
    await new Promise(resolve => setTimeout(resolve, 40));
    assertEquals(callCount, 0, "Should not call yet, timer was reset");

    // Wait for full delay from second trigger
    await new Promise(resolve => setTimeout(resolve, 20));
    assertEquals(callCount, 1, "Should call after full delay from last trigger");
  });

  await t.step("Debouncer - should pass arguments to function", async () => {
    let receivedArg: string | undefined;
    const fn = (arg: string) => { receivedArg = arg; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger("test-value");

    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(receivedArg, "test-value", "Should pass argument to function");
  });

  await t.step("Debouncer - should use latest arguments on debounce", async () => {
    let receivedArg: string | undefined;
    const fn = (arg: string) => { receivedArg = arg; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger("first");
    debouncer.trigger("second");
    debouncer.trigger("third");

    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(receivedArg, "third", "Should use latest argument");
  });

  await t.step("Debouncer - should allow manual flush", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger();
    debouncer.flush();

    assertEquals(callCount, 1, "Should call immediately on flush");

    // Wait to ensure it doesn't call again
    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(callCount, 1, "Should not call again after flush");
  });

  await t.step("Debouncer - should allow cancellation", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger();
    debouncer.cancel();

    // Wait for what would have been the delay
    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(callCount, 0, "Should not call after cancellation");
  });

  await t.step("Debouncer - should handle multiple flush calls", () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger();
    debouncer.flush();
    debouncer.flush();
    debouncer.flush();

    assertEquals(callCount, 1, "Should only call once even with multiple flushes");
  });

  await t.step("Debouncer - should work after cancel and re-trigger", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 50);

    debouncer.trigger();
    debouncer.cancel();

    assertEquals(callCount, 0, "Should not have called after cancel");

    debouncer.trigger();
    await new Promise(resolve => setTimeout(resolve, 100));

    assertEquals(callCount, 1, "Should call after re-trigger");
  });

  await t.step("Debouncer - should support zero delay (immediate)", async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debouncer = new Debouncer(fn, 0);

    debouncer.trigger();
    debouncer.trigger();
    debouncer.trigger();

    // Even with 0 delay, should debounce via setTimeout
    assertEquals(callCount, 0, "Should not call synchronously");

    await new Promise(resolve => setTimeout(resolve, 10));

    assertEquals(callCount, 1, "Should call once after event loop");
  });
});