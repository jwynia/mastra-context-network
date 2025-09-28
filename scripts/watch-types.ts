#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

import { parse } from "@std/flags";
import { green, red, yellow } from "@std/fmt/colors";

async function checkTypeCoverage() {
  // Run tsc with strict settings
  const tscResult = await new Deno.Command("npx", {
    args: ["tsc", "--noEmit", "--strict", "--listFiles"],
    stdout: "piped",
    stderr: "piped"
  }).output();

  // Analyze for 'any' usage
  const srcFiles = await Deno.readDir("./src");
  let totalLines = 0;
  let anyCount = 0;
  
  for await (const file of srcFiles) {
    if (file.name.endsWith(".ts")) {
      const content = await Deno.readTextFile(`./src/${file.name}`);
      const lines = content.split("\n");
      totalLines += lines.length;
      
      // Count explicit 'any' usage
      const anyMatches = content.match(/:\s*any\b/g);
      if (anyMatches) anyCount += anyMatches.length;
    }
  }

  const coverage = ((totalLines - anyCount) / totalLines * 100).toFixed(2);
  
  // Store historical data
  const history = JSON.parse(
    await Deno.readTextFile(".type-coverage-history.json").catch(() => "[]")
  );
  
  history.push({
    date: new Date().toISOString(),
    coverage: parseFloat(coverage),
    anyCount,
    totalLines
  });
  
  await Deno.writeTextFile(
    ".type-coverage-history.json",
    JSON.stringify(history, null, 2)
  );

  // Report
  console.log(`Type Coverage: ${coverage}%`);
  
  if (parseFloat(coverage) > 95) {
    console.log(green("✅ Excellent type coverage!"));
  } else if (parseFloat(coverage) > 85) {
    console.log(yellow("⚠️ Good coverage, but room for improvement"));
  } else {
    console.log(red("❌ Type coverage below acceptable threshold"));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await checkTypeCoverage();
}