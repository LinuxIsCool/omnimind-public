#!/usr/bin/env npx ts-node
/**
 * OMNIMIND Feedback Loop Test
 *
 * Tests the complete substrate operation chain:
 * 1. Search existing knowledge
 * 2. Retrieve specific atoms
 * 3. List atoms by domain/type
 * 4. Get statistics
 * 5. Ingest new knowledge
 * 6. Verify the ingested atom is searchable
 */

import { join } from "node:path";
import { homedir } from "node:os";
import { openSubstrate } from "../src/substrate.js";
import { IndexManager } from "../src/indexes/index.js";

const ROOT = join(homedir(), ".omnimind", "knowledge");

type TestResult = {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
};

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const substrate = openSubstrate(ROOT);
  const indexes = new IndexManager(join(ROOT, "indexes"));
  indexes.init();

  // Test 1: Search for existing knowledge
  console.log("\n🔍 Test 1: Search existing knowledge...");
  let start = Date.now();
  try {
    const searchResults = indexes.search("recursive self-improvement agent", 5);
    const passed = searchResults.length > 0;
    results.push({
      name: "Search existing knowledge",
      passed,
      details: passed
        ? `Found ${searchResults.length} results. Top: ${searchResults[0]?.hash.slice(0, 12)}`
        : "No results found",
      duration: Date.now() - start,
    });
    console.log(`   ${passed ? "✅" : "❌"} ${results[results.length - 1].details}`);
  } catch (e) {
    results.push({
      name: "Search existing knowledge",
      passed: false,
      details: `Error: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start,
    });
    console.log(`   ❌ ${results[results.length - 1].details}`);
  }

  // Test 2: Retrieve specific atom
  console.log("\n📖 Test 2: Retrieve specific atom...");
  start = Date.now();
  try {
    const hashes: string[] = [];
    for await (const h of substrate.list({ limit: 1 })) {
      hashes.push(h);
    }
    if (hashes.length > 0) {
      const atom = await substrate.get(hashes[0] as any);
      const passed = atom !== null;
      results.push({
        name: "Retrieve specific atom",
        passed,
        details: passed
          ? `Retrieved atom: ${atom.meta.domain} (${atom.body.length} bytes)`
          : "Failed to retrieve",
        duration: Date.now() - start,
      });
      console.log(`   ${passed ? "✅" : "❌"} ${results[results.length - 1].details}`);
    } else {
      results.push({
        name: "Retrieve specific atom",
        passed: false,
        details: "No atoms in substrate",
        duration: Date.now() - start,
      });
      console.log(`   ❌ ${results[results.length - 1].details}`);
    }
  } catch (e) {
    results.push({
      name: "Retrieve specific atom",
      passed: false,
      details: `Error: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start,
    });
    console.log(`   ❌ ${results[results.length - 1].details}`);
  }

  // Test 3: List atoms by domain prefix
  console.log("\n📋 Test 3: List atoms by domain prefix...");
  start = Date.now();
  try {
    const singularityAtoms: string[] = [];
    for await (const h of substrate.list({ domainPrefix: "singularity", limit: 10 })) {
      singularityAtoms.push(h);
    }
    const dataSystemsAtoms: string[] = [];
    for await (const h of substrate.list({ domainPrefix: "data-systems", limit: 10 })) {
      dataSystemsAtoms.push(h);
    }
    const passed = singularityAtoms.length > 0 && dataSystemsAtoms.length > 0;
    results.push({
      name: "List atoms by domain prefix",
      passed,
      details: `singularity: ${singularityAtoms.length}, data-systems: ${dataSystemsAtoms.length}`,
      duration: Date.now() - start,
    });
    console.log(`   ${passed ? "✅" : "❌"} ${results[results.length - 1].details}`);
  } catch (e) {
    results.push({
      name: "List atoms by domain prefix",
      passed: false,
      details: `Error: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start,
    });
    console.log(`   ❌ ${results[results.length - 1].details}`);
  }

  // Test 4: Get statistics
  console.log("\n📊 Test 4: Get statistics...");
  start = Date.now();
  try {
    const stats = await substrate.stats();
    const passed = stats.totalAtoms > 0;
    results.push({
      name: "Get statistics",
      passed,
      details: `${stats.totalAtoms} atoms, ${(stats.diskUsage / 1024).toFixed(2)} KB`,
      duration: Date.now() - start,
    });
    console.log(`   ${passed ? "✅" : "❌"} ${results[results.length - 1].details}`);
  } catch (e) {
    results.push({
      name: "Get statistics",
      passed: false,
      details: `Error: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start,
    });
    console.log(`   ❌ ${results[results.length - 1].details}`);
  }

  // Test 5: Ingest new knowledge
  console.log("\n💎 Test 5: Ingest new knowledge...");
  start = Date.now();
  const testAtomBody = `# Feedback Loop Test Atom

**Created:** ${new Date().toISOString()}

## Purpose

This atom was created by the feedback loop test to verify that new knowledge
can be crystallized into the substrate.

## Verification

If you can read this, the ingest operation worked correctly.`;

  try {
    const hash = await substrate.ingest({
      body: testAtomBody,
      domain: "test/feedback-loop",
      type: "insight",
      tags: ["test", "feedback-loop", "auto-generated"],
      confidence: 1.0,
    });

    // Index the new atom
    const newAtom = await substrate.get(hash);
    if (newAtom) {
      indexes.indexAKU(newAtom);
    }

    const passed = hash.length === 64;
    results.push({
      name: "Ingest new knowledge",
      passed,
      details: `Created atom: ${hash.slice(0, 12)}...`,
      duration: Date.now() - start,
    });
    console.log(`   ${passed ? "✅" : "❌"} ${results[results.length - 1].details}`);

    // Test 6: Verify ingested atom is searchable
    console.log("\n🔎 Test 6: Verify atom is searchable...");
    start = Date.now();
    try {
      const verifyResults = indexes.search("Feedback Loop Test Atom", 5);
      const found = verifyResults.some(r => r.hash === hash);
      results.push({
        name: "Verify atom searchable",
        passed: found,
        details: found
          ? "Newly ingested atom found in search results"
          : "Atom not found in search (may need reindex)",
        duration: Date.now() - start,
      });
      console.log(`   ${found ? "✅" : "⚠️"} ${results[results.length - 1].details}`);
    } catch (e) {
      results.push({
        name: "Verify atom searchable",
        passed: false,
        details: `Error: ${e instanceof Error ? e.message : String(e)}`,
        duration: Date.now() - start,
      });
      console.log(`   ❌ ${results[results.length - 1].details}`);
    }
  } catch (e) {
    results.push({
      name: "Ingest new knowledge",
      passed: false,
      details: `Error: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start,
    });
    console.log(`   ❌ ${results[results.length - 1].details}`);
  }

  // Test 7: Search across domains
  console.log("\n🌐 Test 7: Cross-domain search...");
  start = Date.now();
  try {
    const crossResults = indexes.search("intelligence architecture", 10);
    // Should find results from both singularity and data-systems
    const uniqueDomains = new Set<string>();
    for (const result of crossResults) {
      const atom = await substrate.get(result.hash as any);
      if (atom) {
        const topDomain = atom.meta.domain.split("/")[0];
        uniqueDomains.add(topDomain);
      }
    }
    const passed = uniqueDomains.size > 1;
    results.push({
      name: "Cross-domain search",
      passed,
      details: `Found results across ${uniqueDomains.size} domains: ${Array.from(uniqueDomains).join(", ")}`,
      duration: Date.now() - start,
    });
    console.log(`   ${passed ? "✅" : "⚠️"} ${results[results.length - 1].details}`);
  } catch (e) {
    results.push({
      name: "Cross-domain search",
      passed: false,
      details: `Error: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start,
    });
    console.log(`   ❌ ${results[results.length - 1].details}`);
  }

  return results;
}

// === MAIN ===

console.log("═══════════════════════════════════════════════════════════════════");
console.log("        OMNIMIND Feedback Loop Test");
console.log("═══════════════════════════════════════════════════════════════════");
console.log(`Substrate: ${ROOT}`);

runTests()
  .then((results) => {
    console.log("\n═══════════════════════════════════════════════════════════════════");
    console.log("                         RESULTS");
    console.log("═══════════════════════════════════════════════════════════════════");

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n  Tests: ${passed}/${total} passed`);
    console.log(`  Time:  ${totalTime}ms total\n`);

    for (const result of results) {
      const icon = result.passed ? "✅" : "❌";
      console.log(`  ${icon} ${result.name} (${result.duration}ms)`);
      console.log(`     ${result.details}\n`);
    }

    if (passed === total) {
      console.log("╔═══════════════════════════════════════════════════════════════════╗");
      console.log("║     🎉 ALL TESTS PASSED - Feedback Loop Operational!              ║");
      console.log("╚═══════════════════════════════════════════════════════════════════╝");
    } else {
      console.log("╔═══════════════════════════════════════════════════════════════════╗");
      console.log(`║     ⚠️  ${total - passed} tests failed - Review needed              `);
      console.log("╚═══════════════════════════════════════════════════════════════════╝");
    }

    process.exit(passed === total ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Test runner failed:", error);
    process.exit(1);
  });
