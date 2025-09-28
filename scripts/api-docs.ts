#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

// Uses api-extractor to track public API changes
// Generates markdown docs and breaking change reports
// Can block releases if unintended API changes detected