#!/usr/bin/env node
/**
 * OMNIMIND Knowledge Substrate - CLI
 *
 * Command-line interface for managing the knowledge substrate.
 */

import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { openSubstrate, initSubstrate } from "./substrate.js";
import { IndexManager } from "./indexes/index.js";
import type { IngestInput, KnowledgeType } from "./types.js";

// === CONFIGURATION ===

const DEFAULT_ROOT = join(homedir(), ".omnimind", "knowledge");

function getRoot(): string {
  return process.env.OMNIMIND_ROOT || DEFAULT_ROOT;
}

// === COMMANDS ===

async function cmdInit(args: string[]): Promise<void> {
  const root = args[0] || getRoot();
  console.log(`Initializing knowledge substrate at: ${root}`);

  const substrate = initSubstrate(root);
  const indexes = new IndexManager(join(root, "indexes"));
  indexes.init();

  console.log("✓ Created directory structure");
  console.log("✓ Initialized configuration");
  console.log("✓ Set up indexes");
  console.log(`\nSubstrate ready at: ${root}`);
}

async function cmdIngest(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      domain: { type: "string", short: "d" },
      type: { type: "string", short: "t", default: "fact" },
      tags: { type: "string", short: "T" },
      confidence: { type: "string", short: "c" },
      stdin: { type: "boolean", short: "s" },
    },
    allowPositionals: true,
  });

  const substrate = openSubstrate(getRoot());
  const indexes = new IndexManager(join(getRoot(), "indexes"));
  indexes.init();

  let body: string;

  if (values.stdin) {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString("utf8");
  } else if (positionals[0]) {
    // Read from file
    const filePath = resolve(positionals[0]);
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    body = readFileSync(filePath, "utf8");
  } else {
    console.error("Usage: aku ingest [file] --domain <domain> [--type <type>] [--tags <tags>]");
    console.error("       aku ingest --stdin --domain <domain>");
    process.exit(1);
  }

  if (!values.domain) {
    console.error("Error: --domain is required");
    process.exit(1);
  }

  const input: IngestInput = {
    body,
    domain: values.domain,
    type: (values.type as KnowledgeType) || "fact",
    tags: values.tags ? values.tags.split(",").map((t) => t.trim()) : [],
    confidence: values.confidence ? parseFloat(values.confidence) : undefined,
  };

  const hash = await substrate.ingest(input);

  // Index the AKU
  const aku = await substrate.get(hash);
  if (aku) {
    indexes.indexAKU(aku);
  }

  console.log(hash);
}

async function cmdGet(args: string[]): Promise<void> {
  const hash = args[0];
  if (!hash) {
    console.error("Usage: aku get <hash>");
    process.exit(1);
  }

  const substrate = openSubstrate(getRoot());
  const aku = await substrate.get(hash);

  if (!aku) {
    console.error(`AKU not found: ${hash}`);
    process.exit(1);
  }

  // Output as YAML frontmatter + body (original format)
  console.log("---");
  console.log(`id: ${aku.id}`);
  console.log(`domain: ${aku.meta.domain}`);
  console.log(`type: ${aku.meta.type}`);
  console.log(`created: ${aku.meta.created}`);
  console.log(`confidence: ${aku.meta.confidence}`);
  console.log(`tags: [${aku.meta.tags.join(", ")}]`);
  console.log("---");
  console.log(aku.body);
}

async function cmdList(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      domain: { type: "string", short: "d" },
      type: { type: "string", short: "t" },
      limit: { type: "string", short: "l", default: "20" },
      format: { type: "string", short: "f", default: "short" },
    },
  });

  const substrate = openSubstrate(getRoot());

  let count = 0;
  const limit = parseInt(values.limit || "20", 10);

  for await (const hash of substrate.list({
    domain: values.domain,
    type: values.type as KnowledgeType | undefined,
    limit,
  })) {
    if (values.format === "hash") {
      console.log(hash);
    } else {
      const aku = await substrate.get(hash);
      if (aku) {
        console.log(`${hash.slice(0, 12)}... | ${aku.meta.domain} | ${aku.meta.type}`);
      }
    }
    count++;
  }

  if (values.format !== "hash") {
    console.log(`\n${count} atoms`);
  }
}

async function cmdSearch(args: string[]): Promise<void> {
  const query = args.join(" ");
  if (!query) {
    console.error("Usage: aku search <query>");
    process.exit(1);
  }

  const indexes = new IndexManager(join(getRoot(), "indexes"));
  indexes.init();

  const results = indexes.search(query, 20);

  if (results.length === 0) {
    console.log("No results found.");
    return;
  }

  const substrate = openSubstrate(getRoot());

  for (const result of results) {
    const aku = await substrate.get(result.hash);
    if (aku) {
      const title = aku.body.split("\n").find((l) => l.startsWith("#"))?.slice(2) || "(untitled)";
      console.log(`${result.score.toFixed(2)} | ${result.hash.slice(0, 12)}... | ${title}`);
    }
  }
}

async function cmdStats(): Promise<void> {
  const substrate = openSubstrate(getRoot());
  const stats = await substrate.stats();

  console.log("=== Knowledge Substrate Statistics ===\n");
  console.log(`Total atoms: ${stats.totalAtoms}`);
  console.log(`Total links: ${stats.totalLinks}`);
  console.log(`Disk usage: ${(stats.diskUsage / 1024).toFixed(2)} KB`);

  if (stats.oldestAtom) {
    console.log(`Oldest: ${stats.oldestAtom}`);
  }
  if (stats.newestAtom) {
    console.log(`Newest: ${stats.newestAtom}`);
  }

  console.log("\nBy type:");
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log("\nBy domain:");
  for (const [domain, count] of Object.entries(stats.byDomain)) {
    console.log(`  ${domain}: ${count}`);
  }
}

async function cmdVerify(): Promise<void> {
  console.log("Verifying substrate integrity...\n");

  const substrate = openSubstrate(getRoot());
  const report = await substrate.verify();

  if (report.valid) {
    console.log(`✓ All ${report.totalChecked} atoms verified successfully`);
  } else {
    console.log(`✗ Integrity issues found:`);
    console.log(`  Corrupted atoms: ${report.corrupted.length}`);
    console.log(`  Orphaned links: ${report.orphanedLinks.length}`);

    if (report.corrupted.length > 0) {
      console.log("\nCorrupted atoms:");
      for (const hash of report.corrupted) {
        console.log(`  ${hash}`);
      }
    }

    if (report.orphanedLinks.length > 0) {
      console.log("\nOrphaned links:");
      for (const link of report.orphanedLinks.slice(0, 10)) {
        console.log(`  ${link.from.slice(0, 12)}... -> ${link.to.slice(0, 12)}...`);
      }
      if (report.orphanedLinks.length > 10) {
        console.log(`  ... and ${report.orphanedLinks.length - 10} more`);
      }
    }

    process.exit(1);
  }
}

async function cmdRebuildIndexes(): Promise<void> {
  console.log("Rebuilding indexes...\n");

  const substrate = openSubstrate(getRoot());
  const indexes = new IndexManager(join(getRoot(), "indexes"));
  indexes.init();

  async function* atomIterator() {
    for await (const hash of substrate.list()) {
      const aku = await substrate.get(hash);
      if (aku) yield aku;
    }
  }

  const count = await indexes.rebuild(atomIterator());
  console.log(`✓ Indexed ${count} atoms`);
}

async function cmdSeed(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      force: { type: "boolean", short: "f" },
      dry: { type: "boolean" },
    },
  });

  // Load all seed modules
  const { getDataSystemsSeeds } = await import("./seeds/data-systems.js");
  const { getMetaIdeasSeeds } = await import("./seeds/meta-ideas.js");
  const { getHistorySeeds } = await import("./seeds/history.js");
  const { getInternalsSeeds } = await import("./seeds/internals.js");
  const { getProjectsSeeds } = await import("./seeds/projects.js");
  const { getSingularityCatalystSeeds } = await import("./seeds/singularity-catalysts.js");

  const seeds = [
    ...getDataSystemsSeeds(),
    ...getMetaIdeasSeeds(),
    ...getHistorySeeds(),
    ...getInternalsSeeds(),
    ...getProjectsSeeds(),
    ...getSingularityCatalystSeeds(),
  ];

  console.log(`Seeding knowledge substrate with ${seeds.length} atoms...\n`);

  if (values.dry) {
    console.log("Dry run - would ingest:");
    for (const seed of seeds) {
      console.log(`  - ${seed.domain}`);
    }
    return;
  }

  const substrate = openSubstrate(getRoot());
  const indexes = new IndexManager(join(getRoot(), "indexes"));
  indexes.init();

  let ingested = 0;
  let skipped = 0;

  for (const seed of seeds) {
    const hash = await substrate.ingest(seed);
    const aku = await substrate.get(hash);

    if (aku) {
      indexes.indexAKU(aku);
      process.stdout.write("✓");
      ingested++;
    }
  }

  console.log(`\n\n✓ Ingested ${ingested} atoms`);
  if (skipped > 0) {
    console.log(`  (${skipped} already existed)`);
  }
}

async function cmdRecent(args: string[]): Promise<void> {
  const limit = parseInt(args[0] || "10", 10);

  const indexes = new IndexManager(join(getRoot(), "indexes"));
  indexes.init();

  const substrate = openSubstrate(getRoot());
  const hashes = indexes.recent(limit);

  for (const hash of hashes) {
    const aku = await substrate.get(hash);
    if (aku) {
      const title = aku.body.split("\n").find((l) => l.startsWith("#"))?.slice(2) || "(untitled)";
      console.log(`${aku.meta.created.slice(0, 19)} | ${hash.slice(0, 12)}... | ${title}`);
    }
  }
}

// === MAIN ===

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  const commands: Record<string, (args: string[]) => Promise<void>> = {
    init: cmdInit,
    ingest: cmdIngest,
    get: cmdGet,
    list: cmdList,
    search: cmdSearch,
    stats: cmdStats,
    verify: cmdVerify,
    "rebuild-indexes": cmdRebuildIndexes,
    recent: cmdRecent,
    seed: cmdSeed,
  };

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(`
OMNIMIND Knowledge Substrate CLI

Usage: aku <command> [options]

Commands:
  init [path]              Initialize a new substrate
  ingest <file>            Ingest knowledge from a file
  get <hash>               Get an AKU by hash
  list [--domain] [--type] List AKUs
  search <query>           Full-text search
  stats                    Show substrate statistics
  verify                   Verify integrity
  rebuild-indexes          Rebuild all indexes
  recent [limit]           Show recent atoms
  seed [--dry] [--force]   Seed with data systems knowledge

Options:
  --domain, -d    Filter by domain
  --type, -t      Filter by type
  --tags, -T      Comma-separated tags
  --limit, -l     Limit results

Environment:
  OMNIMIND_ROOT   Knowledge root directory (default: ~/.omnimind/knowledge)
    `);
    return;
  }

  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error("Run 'aku help' for usage.");
    process.exit(1);
  }

  try {
    await handler(commandArgs);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
