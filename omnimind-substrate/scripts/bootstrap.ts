#!/usr/bin/env npx ts-node
/**
 * OMNIMIND Knowledge Substrate - Bootstrap Script
 *
 * Initializes a fresh substrate and seeds it with foundational knowledge.
 */

import { join } from "node:path";
import { homedir } from "node:os";
import { initSubstrate, openSubstrate } from "../src/substrate.js";
import { IndexManager } from "../src/indexes/index.js";
import { getDataSystemsSeeds } from "../src/seeds/data-systems.js";

const DEFAULT_ROOT = join(homedir(), ".omnimind", "knowledge");

async function bootstrap(root: string = DEFAULT_ROOT): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           OMNIMIND Knowledge Substrate Bootstrap             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Step 1: Initialize substrate
  console.log(`📁 Initializing substrate at: ${root}`);
  const substrate = initSubstrate(root);
  console.log("   ✓ Directory structure created");
  console.log("   ✓ Configuration written\n");

  // Step 2: Initialize indexes
  console.log("🗂️  Setting up indexes...");
  const indexes = new IndexManager(join(root, "indexes"));
  indexes.init();
  console.log("   ✓ Graph index (SQLite)");
  console.log("   ✓ Temporal index");
  console.log("   ✓ Full-text search (FTS5)\n");

  // Step 3: Seed with data systems knowledge
  const seeds = getDataSystemsSeeds();
  console.log(`🌱 Seeding with ${seeds.length} atoms from Data Systems Intelligence Explosion...\n`);

  let ingested = 0;
  const startTime = Date.now();

  for (const seed of seeds) {
    process.stdout.write(`   Ingesting: ${seed.domain.padEnd(50)}`);
    const hash = await substrate.ingest(seed);
    const aku = await substrate.get(hash);
    if (aku) {
      indexes.indexAKU(aku);
      process.stdout.write(`✓ ${hash.slice(0, 12)}...\n`);
      ingested++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // Step 4: Stats
  console.log("\n📊 Substrate Statistics:");
  const stats = await substrate.stats();
  console.log(`   Total atoms: ${stats.totalAtoms}`);
  console.log(`   Total links: ${stats.totalLinks}`);
  console.log(`   Disk usage: ${(stats.diskUsage / 1024).toFixed(2)} KB`);

  console.log("\n   By type:");
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`     ${type}: ${count}`);
  }

  console.log("\n   By domain:");
  for (const [domain, count] of Object.entries(stats.byDomain)) {
    console.log(`     ${domain}: ${count}`);
  }

  // Step 5: Verify
  console.log("\n🔍 Verifying integrity...");
  const report = await substrate.verify();
  if (report.valid) {
    console.log(`   ✓ All ${report.totalChecked} atoms verified\n`);
  } else {
    console.log(`   ✗ Issues found: ${report.corrupted.length} corrupted\n`);
  }

  // Done
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    Bootstrap Complete!                       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`✨ Ingested ${ingested} atoms in ${elapsed}s`);
  console.log(`\nThe substrate is alive. Use 'aku' CLI to interact:\n`);
  console.log(`  aku search "CAP theorem"      # Full-text search`);
  console.log(`  aku list --domain data-systems # List by domain`);
  console.log(`  aku recent 5                  # Show recent atoms`);
  console.log(`  aku stats                     # Show statistics\n`);

  indexes.close();
}

// Run if called directly
const customRoot = process.argv[2];
bootstrap(customRoot).catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
