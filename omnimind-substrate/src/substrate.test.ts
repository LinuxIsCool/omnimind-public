/**
 * OMNIMIND Knowledge Substrate - Substrate Module Tests
 *
 * Tests for core substrate operations: ingest, get, list, link, verify.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  Substrate,
  initSubstrate,
  openSubstrate,
  serializeAKU,
  parseAKU,
} from "./substrate.js";
import type { AKU, AKUMeta, IngestInput, ISO8601, ContentHash } from "./types.js";

describe("Substrate Module", () => {
  let testRoot: string;
  let substrate: Substrate;

  beforeEach(() => {
    testRoot = mkdtempSync(join(tmpdir(), "omnimind-test-"));
    substrate = initSubstrate(testRoot);
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  // === INITIALIZATION TESTS ===

  describe("Initialization", () => {
    test("initSubstrate creates directory structure", () => {
      assert.ok(existsSync(join(testRoot, ".aku", "version")));
      assert.ok(existsSync(join(testRoot, ".aku", "config.yaml")));
      assert.ok(existsSync(join(testRoot, "atoms")));
      assert.ok(existsSync(join(testRoot, "heads")));
      assert.ok(existsSync(join(testRoot, "indexes")));
      assert.ok(existsSync(join(testRoot, "WAL")));
    });

    test("openSubstrate on existing substrate does not reinitialize", () => {
      const sub1 = openSubstrate(testRoot);
      const sub2 = openSubstrate(testRoot);
      // Should not throw
      assert.ok(sub1);
      assert.ok(sub2);
    });

    test("openSubstrate on new path initializes", () => {
      const newRoot = mkdtempSync(join(tmpdir(), "omnimind-new-"));
      try {
        const sub = openSubstrate(newRoot);
        assert.ok(existsSync(join(newRoot, ".aku", "version")));
      } finally {
        rmSync(newRoot, { recursive: true, force: true });
      }
    });
  });

  // === INGEST TESTS ===

  describe("Ingest", () => {
    test("ingest returns content hash", async () => {
      const input: IngestInput = {
        body: "# Test\n\nThis is a test atom.",
        domain: "test/ingest",
        type: "fact",
        tags: ["test"],
      };

      const hash = await substrate.ingest(input);

      assert.match(hash, /^[a-f0-9]{64}$/);
    });

    test("ingest creates atom file", async () => {
      const input: IngestInput = {
        body: "Test body",
        domain: "test/file",
        type: "fact",
      };

      const hash = await substrate.ingest(input);
      const aku = await substrate.get(hash);

      assert.ok(aku);
      assert.strictEqual(aku.body, "Test body");
    });

    test("ingest deduplicates identical content", async () => {
      const input: IngestInput = {
        body: "Duplicate content",
        domain: "test/dedup",
        type: "fact",
        tags: ["dedup"],
      };

      const hash1 = await substrate.ingest(input);
      const hash2 = await substrate.ingest(input);

      assert.strictEqual(hash1, hash2, "Same content should produce same hash");
    });

    test("ingest sets default confidence", async () => {
      const input: IngestInput = {
        body: "Test",
        domain: "test/defaults",
        type: "fact",
      };

      const hash = await substrate.ingest(input);
      const aku = await substrate.get(hash);

      assert.ok(aku);
      assert.strictEqual(aku.meta.confidence, 0.8); // Default from config
    });

    test("ingest preserves custom confidence", async () => {
      const input: IngestInput = {
        body: "High confidence",
        domain: "test/confidence",
        type: "fact",
        confidence: 0.99,
      };

      const hash = await substrate.ingest(input);
      const aku = await substrate.get(hash);

      assert.ok(aku);
      assert.strictEqual(aku.meta.confidence, 0.99);
    });

    test("ingest handles unicode content", async () => {
      const input: IngestInput = {
        body: "日本語テスト 🎉 émojis and ümlauts",
        domain: "test/unicode",
        type: "fact",
        tags: ["日本語", "emoji"],
      };

      const hash = await substrate.ingest(input);
      const aku = await substrate.get(hash);

      assert.ok(aku);
      assert.strictEqual(aku.body, input.body);
      assert.deepStrictEqual(aku.meta.tags, input.tags);
    });

    test("ingest handles large body", async () => {
      const largeBody = "X".repeat(100000); // 100KB
      const input: IngestInput = {
        body: largeBody,
        domain: "test/large",
        type: "artifact",
      };

      const hash = await substrate.ingest(input);
      const aku = await substrate.get(hash);

      assert.ok(aku);
      assert.strictEqual(aku.body.length, 100000);
    });
  });

  // === GET TESTS ===

  describe("Get", () => {
    test("get returns null for non-existent hash", async () => {
      const fakeHash = "a".repeat(64);
      const aku = await substrate.get(fakeHash);
      assert.strictEqual(aku, null);
    });

    test("get throws for invalid hash format", async () => {
      await assert.rejects(
        async () => substrate.get("invalid" as ContentHash),
        /Invalid hash format/
      );
    });

    test("get returns complete AKU structure", async () => {
      const input: IngestInput = {
        body: "Complete structure test",
        domain: "test/structure",
        type: "concept",
        confidence: 0.95,
        volatility: "evolving",
        tags: ["a", "b"],
        links: { relates_to: [] },
      };

      const hash = await substrate.ingest(input);
      const aku = await substrate.get(hash);

      assert.ok(aku);
      assert.strictEqual(aku.id, hash);
      assert.strictEqual(aku.meta.domain, "test/structure");
      assert.strictEqual(aku.meta.type, "concept");
      assert.strictEqual(aku.meta.confidence, 0.95);
      assert.strictEqual(aku.meta.volatility, "evolving");
      assert.deepStrictEqual(aku.meta.tags, ["a", "b"]);
      assert.strictEqual(aku.body, "Complete structure test");
    });
  });

  // === EXISTS TESTS ===

  describe("Exists", () => {
    test("exists returns false for non-existent", async () => {
      const fakeHash = "b".repeat(64);
      assert.strictEqual(await substrate.exists(fakeHash), false);
    });

    test("exists returns true after ingest", async () => {
      const input: IngestInput = {
        body: "Exists test",
        domain: "test/exists",
        type: "fact",
      };

      const hash = await substrate.ingest(input);
      assert.strictEqual(await substrate.exists(hash), true);
    });
  });

  // === LIST TESTS ===

  describe("List", () => {
    test("list returns empty for fresh substrate", async () => {
      const hashes: string[] = [];
      for await (const hash of substrate.list()) {
        hashes.push(hash);
      }
      assert.strictEqual(hashes.length, 0);
    });

    test("list returns ingested atoms", async () => {
      await substrate.ingest({ body: "A", domain: "test/a", type: "fact" });
      await substrate.ingest({ body: "B", domain: "test/b", type: "fact" });
      await substrate.ingest({ body: "C", domain: "test/c", type: "fact" });

      const hashes: string[] = [];
      for await (const hash of substrate.list()) {
        hashes.push(hash);
      }

      assert.strictEqual(hashes.length, 3);
    });

    test("list respects limit", async () => {
      for (let i = 0; i < 10; i++) {
        await substrate.ingest({ body: `Item ${i}`, domain: `test/${i}`, type: "fact" });
      }

      const hashes: string[] = [];
      for await (const hash of substrate.list({ limit: 5 })) {
        hashes.push(hash);
      }

      assert.strictEqual(hashes.length, 5);
    });

    test("list filters by domain", async () => {
      await substrate.ingest({ body: "A", domain: "alpha/one", type: "fact" });
      await substrate.ingest({ body: "B", domain: "alpha/two", type: "fact" });
      await substrate.ingest({ body: "C", domain: "beta/one", type: "fact" });

      const hashes: string[] = [];
      for await (const hash of substrate.list({ domain: "alpha/one" })) {
        hashes.push(hash);
      }

      assert.strictEqual(hashes.length, 1);
    });

    test("list filters by type", async () => {
      await substrate.ingest({ body: "Fact", domain: "test/a", type: "fact" });
      await substrate.ingest({ body: "Concept", domain: "test/b", type: "concept" });
      await substrate.ingest({ body: "Another Fact", domain: "test/c", type: "fact" });

      const hashes: string[] = [];
      for await (const hash of substrate.list({ type: "concept" })) {
        hashes.push(hash);
      }

      assert.strictEqual(hashes.length, 1);
    });
  });

  // === SERIALIZATION TESTS ===

  describe("Serialization", () => {
    test("serializeAKU produces valid YAML frontmatter", () => {
      const aku: AKU = {
        id: "a".repeat(64) as ContentHash,
        meta: {
          created: "2026-01-09T00:00:00.000Z" as ISO8601,
          source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
          domain: "test/serialize",
          type: "fact",
          confidence: 0.9,
          volatility: "stable",
          links: {},
          tags: ["test"],
        },
        body: "Test body",
      };

      const serialized = serializeAKU(aku);

      assert.ok(serialized.startsWith("---\n"));
      assert.ok(serialized.includes("domain: test/serialize"));
      assert.ok(serialized.includes("Test body"));
    });

    test("parseAKU roundtrips with serializeAKU", () => {
      const original: AKU = {
        id: "b".repeat(64) as ContentHash,
        meta: {
          created: "2026-01-09T00:00:00.000Z" as ISO8601,
          source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
          domain: "test/roundtrip",
          type: "concept",
          confidence: 0.85,
          volatility: "evolving",
          links: { relates_to: ["c".repeat(64) as ContentHash] },
          tags: ["round", "trip"],
        },
        body: "# Roundtrip Test\n\nThis should survive serialization.",
      };

      const serialized = serializeAKU(original);
      const parsed = parseAKU(serialized, original.id);

      assert.strictEqual(parsed.id, original.id);
      assert.strictEqual(parsed.meta.domain, original.meta.domain);
      assert.strictEqual(parsed.meta.type, original.meta.type);
      assert.strictEqual(parsed.meta.confidence, original.meta.confidence);
      assert.deepStrictEqual(parsed.meta.tags, original.meta.tags);
      assert.strictEqual(parsed.body, original.body);
    });

    test("parseAKU throws on invalid frontmatter", () => {
      const invalid = "No frontmatter here";
      assert.throws(
        () => parseAKU(invalid, "a".repeat(64) as ContentHash),
        /missing frontmatter/
      );
    });
  });

  // === VERIFY TESTS ===

  describe("Verify", () => {
    test("empty substrate verifies successfully", async () => {
      const report = await substrate.verify();
      assert.strictEqual(report.valid, true);
      assert.strictEqual(report.totalChecked, 0);
    });

    test("valid atoms verify successfully", async () => {
      await substrate.ingest({ body: "Valid A", domain: "test/a", type: "fact" });
      await substrate.ingest({ body: "Valid B", domain: "test/b", type: "fact" });

      const report = await substrate.verify();

      assert.strictEqual(report.valid, true);
      assert.strictEqual(report.totalChecked, 2);
      assert.strictEqual(report.corrupted.length, 0);
    });
  });

  // === STATS TESTS ===

  describe("Stats", () => {
    test("empty substrate has zero stats", async () => {
      const stats = await substrate.stats();
      assert.strictEqual(stats.totalAtoms, 0);
      assert.strictEqual(stats.totalLinks, 0);
    });

    test("stats count atoms correctly", async () => {
      await substrate.ingest({ body: "A", domain: "test/a", type: "fact" });
      await substrate.ingest({ body: "B", domain: "test/b", type: "concept" });
      await substrate.ingest({ body: "C", domain: "other/c", type: "fact" });

      const stats = await substrate.stats();

      assert.strictEqual(stats.totalAtoms, 3);
      assert.strictEqual(stats.byType["fact"], 2);
      assert.strictEqual(stats.byType["concept"], 1);
      assert.strictEqual(stats.byDomain["test"], 2);
      assert.strictEqual(stats.byDomain["other"], 1);
    });
  });

  // === PATH VALIDATION TESTS ===

  describe("Path Validation", () => {
    test("valid domain paths are accepted", async () => {
      const validDomains = [
        "test",
        "test/sub",
        "test/sub/deep",
        "data-systems/storage/lsm-tree",
        "a1/b2/c3",
      ];

      for (const domain of validDomains) {
        const hash = await substrate.ingest({
          body: `Testing ${domain}`,
          domain,
          type: "fact",
        });
        assert.ok(hash, `Domain "${domain}" should be accepted`);
      }
    });

    test("rejects path traversal attempts", async () => {
      const maliciousDomains = [
        "../../../etc/passwd",
        "test/../../../etc",
        "..%2F..%2Fetc",
      ];

      for (const domain of maliciousDomains) {
        await assert.rejects(
          async () =>
            substrate.ingest({
              body: "Malicious",
              domain,
              type: "fact",
            }),
          /Invalid domain/,
          `Domain "${domain}" should be rejected`
        );
      }
    });
  });

  // === LINK TESTS ===

  describe("Link", () => {
    test("link creates graph edge", async () => {
      const hashA = await substrate.ingest({
        body: "Node A",
        domain: "test/a",
        type: "fact",
      });
      const hashB = await substrate.ingest({
        body: "Node B",
        domain: "test/b",
        type: "fact",
      });

      await substrate.link(hashA, hashB, "relates_to");

      // Verify link exists (via neighbors)
      const neighbors = await substrate.neighbors(hashA, "out");
      assert.ok(
        neighbors.includes(hashB),
        "Link should create edge from A to B"
      );
    });

    test("link throws for non-existent source", async () => {
      const fakeHash = "c".repeat(64) as ContentHash;
      const realHash = await substrate.ingest({
        body: "Real",
        domain: "test/real",
        type: "fact",
      });

      await assert.rejects(
        async () => substrate.link(fakeHash, realHash, "relates_to"),
        /not found/
      );
    });
  });
});
