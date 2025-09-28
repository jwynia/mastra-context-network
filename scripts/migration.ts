#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

// Wraps jscodeshift with type-aware transforms
// Maintains type safety during large refactors
// Git integration for safe rollbacks