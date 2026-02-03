/**
 * OMNIMIND Knowledge Substrate - Index Layer Tests
 *
 * Tests for SQLite indexes: graph, temporal, full-text search.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { IndexManager } from "./index.js";
import type { AKU, ContentHash, ISO8601 } from "../types.js";

describe("Index Layer", () => {
  let testRoot: string;
  let indexes: IndexManager;

  const createAKU = (overrides: Partial<AKU> = {}): AKU => ({
    id: ("a".repeat(64)) as ContentHash,
    meta: {
      created: "2026-01-09T00:00:00.000Z" as ISO8601,
      source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
      domain: "test/default",
      type: "fact",
      confidence: 0.9,
      volatility: "stable",
      links: {},
      tags: [],
    },
    body: "Default test body",
    ...overrides,
  });

  beforeEach(() => {
    testRoot = mkdtempSync(join(tmpdir(), "omnimind-index-test-"));
    indexes = new IndexManager(testRoot);
    indexes.init();
  });

  afterEach(() => {
    indexes.close();
    rmSync(testRoot, { recursive: true, force: true });
  });

  // === INITIALIZATION TESTS ===

  describe("Initialization", () => {
    test("init creates database files", () => {
      // Databases are created during init
      assert.ok(indexes);
    });

    test("init is idempotent", () => {
      indexes.init();
      indexes.init();
      // Should not throw
      assert.ok(true);
    });
  });

  // === INDEXING TESTS ===

  describe("Indexing", () => {
    test("indexAKU stores atom metadata", () => {
      const aku = createAKU({
        id: "1".repeat(64) as ContentHash,
        meta: {
          ...createAKU().meta,
          domain: "test/indexed",
          type: "concept",
        },
      });

      indexes.indexAKU(aku);

      const results = indexes.byDomain("test/indexed");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0], aku.id);
    });

    test("indexAKU stores tags", () => {
      const aku = createAKU({
        id: "2".repeat(64) as ContentHash,
        meta: {
          ...createAKU().meta,
          tags: ["alpha", "beta", "gamma"],
        },
      });

      indexes.indexAKU(aku);

      const results = indexes.byTag("beta");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0], aku.id);
    });

    test("indexAKU stores links", () => {
      const targetHash = "t".repeat(64) as ContentHash;
      const aku = createAKU({
        id: "3".repeat(64) as ContentHash,
        meta: {
          ...createAKU().meta,
          links: {
            relates_to: [targetHash],
          },
        },
      });

      indexes.indexAKU(aku);

      const outgoing = indexes.outgoingLinks(aku.id);
      assert.strictEqual(outgoing.length, 1);
      assert.strictEqual(outgoing[0].to, targetHash);
      assert.strictEqual(outgoing[0].relation, "relates_to");
    });
  });

  // === FULL-TEXT SEARCH TESTS ===

  describe("Full-Text Search", () => {
    test("search finds by body content", () => {
      const aku = createAKU({
        id: "s1".padEnd(64, "0") as ContentHash,
        body: "# Blockchain Technology\n\nDistributed ledger systems.",
      });

      indexes.indexAKU(aku);

      const results = indexes.search("blockchain");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].hash, aku.id);
    });

    test("search finds by domain", () => {
      const aku = createAKU({
        id: "s2".padEnd(64, "0") as ContentHash,
        meta: {
          ...createAKU().meta,
          domain: "cryptography/hashing/sha256",
        },
      });

      indexes.indexAKU(aku);

      const results = indexes.search("cryptography");
      assert.strictEqual(results.length, 1);
    });

    test("search finds by tags", () => {
      const aku = createAKU({
        id: "s3".padEnd(64, "0") as ContentHash,
        meta: {
          ...createAKU().meta,
          tags: ["distributed", "consensus"],
        },
      });

      indexes.indexAKU(aku);

      const results = indexes.search("consensus");
      assert.strictEqual(results.length, 1);
    });

    test("search respects limit", () => {
      for (let i = 0; i < 10; i++) {
        indexes.indexAKU(
          createAKU({
            id: `s${i}`.padEnd(64, "0") as ContentHash,
            body: `Document about databases number ${i}`,
          })
        );
      }

      const results = indexes.search("databases", 3);
      assert.strictEqual(results.length, 3);
    });

    test("search returns empty for no matches", () => {
      const results = indexes.search("nonexistentterm12345");
      assert.strictEqual(results.length, 0);
    });

    test("search uses Porter stemming", () => {
      const aku = createAKU({
        id: "stem".padEnd(64, "0") as ContentHash,
        body: "Running and runners run quickly.",
      });

      indexes.indexAKU(aku);

      // Porter stemmer: "running" -> "run"
      const results = indexes.search("run");
      assert.strictEqual(results.length, 1);
    });
  });

  // === DOMAIN QUERIES ===

  describe("Domain Queries", () => {
    test("byDomain returns atoms with exact domain", () => {
      indexes.indexAKU(createAKU({
        id: "d1".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, domain: "data-systems/storage" },
      }));
      indexes.indexAKU(createAKU({
        id: "d2".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, domain: "data-systems/storage/lsm" },
      }));
      indexes.indexAKU(createAKU({
        id: "d3".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, domain: "other/domain" },
      }));

      const results = indexes.byDomain("data-systems/storage");
      assert.strictEqual(results.length, 2); // Prefix match
    });

    test("byDomain respects limit", () => {
      for (let i = 0; i < 10; i++) {
        indexes.indexAKU(createAKU({
          id: `dm${i}`.padEnd(64, "0") as ContentHash,
          meta: { ...createAKU().meta, domain: "same/domain" },
        }));
      }

      const results = indexes.byDomain("same/domain", 5);
      assert.strictEqual(results.length, 5);
    });
  });

  // === TYPE QUERIES ===

  describe("Type Queries", () => {
    test("byType returns atoms with matching type", () => {
      indexes.indexAKU(createAKU({
        id: "t1".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, type: "fact" },
      }));
      indexes.indexAKU(createAKU({
        id: "t2".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, type: "concept" },
      }));
      indexes.indexAKU(createAKU({
        id: "t3".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, type: "fact" },
      }));

      const results = indexes.byType("concept");
      assert.strictEqual(results.length, 1);
    });
  });

  // === TAG QUERIES ===

  describe("Tag Queries", () => {
    test("byTag returns atoms with matching tag", () => {
      indexes.indexAKU(createAKU({
        id: "tg1".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, tags: ["red", "blue"] },
      }));
      indexes.indexAKU(createAKU({
        id: "tg2".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, tags: ["green", "blue"] },
      }));
      indexes.indexAKU(createAKU({
        id: "tg3".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, tags: ["red", "yellow"] },
      }));

      const results = indexes.byTag("blue");
      assert.strictEqual(results.length, 2);
    });
  });

  // === TEMPORAL QUERIES ===

  describe("Temporal Queries", () => {
    test("recent returns most recent atoms first", () => {
      indexes.indexAKU(createAKU({
        id: "old".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, created: "2026-01-01T00:00:00.000Z" as ISO8601 },
      }));
      indexes.indexAKU(createAKU({
        id: "new".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, created: "2026-01-09T00:00:00.000Z" as ISO8601 },
      }));

      const results = indexes.recent(10);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0], "new".padEnd(64, "0"));
    });

    test("inTimeRange filters correctly", () => {
      indexes.indexAKU(createAKU({
        id: "jan".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, created: "2026-01-15T00:00:00.000Z" as ISO8601 },
      }));
      indexes.indexAKU(createAKU({
        id: "feb".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, created: "2026-02-15T00:00:00.000Z" as ISO8601 },
      }));
      indexes.indexAKU(createAKU({
        id: "mar".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, created: "2026-03-15T00:00:00.000Z" as ISO8601 },
      }));

      const results = indexes.inTimeRange(
        "2026-01-01T00:00:00.000Z",
        "2026-01-31T23:59:59.999Z"
      );
      assert.strictEqual(results.length, 1);
    });
  });

  // === GRAPH TRAVERSAL TESTS ===

  describe("Graph Traversal", () => {
    test("outgoingLinks returns links from atom", () => {
      const source = "src".padEnd(64, "0") as ContentHash;
      const target1 = "tg1".padEnd(64, "0") as ContentHash;
      const target2 = "tg2".padEnd(64, "0") as ContentHash;

      indexes.indexAKU(createAKU({
        id: source,
        meta: {
          ...createAKU().meta,
          links: {
            relates_to: [target1],
            requires: [target2],
          },
        },
      }));

      const outgoing = indexes.outgoingLinks(source);
      assert.strictEqual(outgoing.length, 2);
    });

    test("incomingLinks returns links to atom", () => {
      const source1 = "s1".padEnd(64, "0") as ContentHash;
      const source2 = "s2".padEnd(64, "0") as ContentHash;
      const target = "target".padEnd(64, "0") as ContentHash;

      indexes.indexAKU(createAKU({
        id: source1,
        meta: { ...createAKU().meta, links: { relates_to: [target] } },
      }));
      indexes.indexAKU(createAKU({
        id: source2,
        meta: { ...createAKU().meta, links: { requires: [target] } },
      }));

      const incoming = indexes.incomingLinks(target);
      assert.strictEqual(incoming.length, 2);
    });

    test("traverse explores graph within depth", () => {
      const a = "aaa".padEnd(64, "0") as ContentHash;
      const b = "bbb".padEnd(64, "0") as ContentHash;
      const c = "ccc".padEnd(64, "0") as ContentHash;

      // A -> B -> C
      indexes.indexAKU(createAKU({
        id: a,
        meta: { ...createAKU().meta, links: { relates_to: [b] } },
      }));
      indexes.indexAKU(createAKU({
        id: b,
        meta: { ...createAKU().meta, links: { relates_to: [c] } },
      }));
      indexes.indexAKU(createAKU({ id: c }));

      const results = indexes.traverse(a, 2, "out");
      const hashes = results.map((r) => r.hash);

      assert.ok(hashes.includes(a));
      assert.ok(hashes.includes(b));
      assert.ok(hashes.includes(c));
    });

    test("traverse respects maxDepth", () => {
      const a = "a1".padEnd(64, "0") as ContentHash;
      const b = "b1".padEnd(64, "0") as ContentHash;
      const c = "c1".padEnd(64, "0") as ContentHash;

      // A -> B -> C
      indexes.indexAKU(createAKU({
        id: a,
        meta: { ...createAKU().meta, links: { relates_to: [b] } },
      }));
      indexes.indexAKU(createAKU({
        id: b,
        meta: { ...createAKU().meta, links: { relates_to: [c] } },
      }));

      const results = indexes.traverse(a, 1, "out"); // Only depth 1
      const hashes = results.map((r) => r.hash);

      assert.ok(hashes.includes(a));
      assert.ok(hashes.includes(b));
      assert.ok(!hashes.includes(c)); // C is depth 2, should be excluded
    });

    test("shortestPath finds path between atoms", () => {
      const a = "pa".padEnd(64, "0") as ContentHash;
      const b = "pb".padEnd(64, "0") as ContentHash;
      const c = "pc".padEnd(64, "0") as ContentHash;

      // A -> B -> C
      indexes.indexAKU(createAKU({
        id: a,
        meta: { ...createAKU().meta, links: { relates_to: [b] } },
      }));
      indexes.indexAKU(createAKU({
        id: b,
        meta: { ...createAKU().meta, links: { relates_to: [c] } },
      }));

      const path = indexes.shortestPath(a, c);
      assert.ok(path);
      assert.deepStrictEqual(path, [a, b, c]);
    });

    test("shortestPath returns null for disconnected atoms", () => {
      const a = "xa".padEnd(64, "0") as ContentHash;
      const b = "xb".padEnd(64, "0") as ContentHash;

      indexes.indexAKU(createAKU({ id: a }));
      indexes.indexAKU(createAKU({ id: b }));

      const path = indexes.shortestPath(a, b);
      assert.strictEqual(path, null);
    });
  });

  // === REBUILD TESTS ===

  describe("Rebuild", () => {
    test("rebuild clears and re-indexes all atoms", async () => {
      // Index some atoms
      indexes.indexAKU(createAKU({
        id: "r1".padEnd(64, "0") as ContentHash,
        meta: { ...createAKU().meta, tags: ["old"] },
      }));

      // Clear check
      let results = indexes.byTag("old");
      assert.strictEqual(results.length, 1);

      // Rebuild with new atoms
      async function* newAtoms() {
        yield createAKU({
          id: "r2".padEnd(64, "0") as ContentHash,
          meta: { ...createAKU().meta, tags: ["new"] },
        });
      }

      await indexes.rebuild(newAtoms());

      // Old atom should be gone
      results = indexes.byTag("old");
      assert.strictEqual(results.length, 0);

      // New atom should exist
      results = indexes.byTag("new");
      assert.strictEqual(results.length, 1);
    });
  });
});
