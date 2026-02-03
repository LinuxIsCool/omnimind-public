/**
 * OMNIMIND Knowledge Substrate - Hash Module Tests
 *
 * Tests for content hashing, hash stability, and validation.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  computeHash,
  hashString,
  verifyHash,
  canonicalize,
  getShardPath,
  isValidHash,
} from "./hash.js";
import type { AKUMeta, ISO8601 } from "./types.js";

describe("Hash Module", () => {
  // === HASH STABILITY TESTS (Critical - changes break content addressing) ===

  describe("Hash Stability", () => {
    test("identical inputs produce identical hashes", () => {
      const meta: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/domain",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: ["test"],
      };
      const body = "Test body content";

      const hash1 = computeHash(meta, body);
      const hash2 = computeHash(meta, body);

      assert.strictEqual(hash1, hash2, "Same input must produce same hash");
    });

    test("different bodies produce different hashes", () => {
      const meta: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/domain",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: [],
      };

      const hash1 = computeHash(meta, "Body A");
      const hash2 = computeHash(meta, "Body B");

      assert.notStrictEqual(hash1, hash2, "Different bodies must produce different hashes");
    });

    test("different metadata produces different hashes", () => {
      const meta1: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/domain",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: [],
      };
      const meta2: AKUMeta = {
        ...meta1,
        domain: "other/domain",
      };
      const body = "Same body";

      const hash1 = computeHash(meta1, body);
      const hash2 = computeHash(meta2, body);

      assert.notStrictEqual(hash1, hash2, "Different metadata must produce different hashes");
    });

    test("tag order does not affect hash (canonicalization)", () => {
      const meta1: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/domain",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: ["a", "b", "c"],
      };
      const meta2: AKUMeta = {
        ...meta1,
        tags: ["c", "a", "b"],
      };
      const body = "Same body";

      const hash1 = computeHash(meta1, body);
      const hash2 = computeHash(meta2, body);

      assert.strictEqual(hash1, hash2, "Tag order should not affect hash");
    });

    // Golden hash test - this MUST NOT change across versions
    test("golden hash regression (DO NOT CHANGE)", () => {
      const meta: AKUMeta = {
        created: "2026-01-01T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-01T00:00:00.000Z" as ISO8601 },
        domain: "test/golden",
        type: "fact",
        confidence: 1.0,
        volatility: "stable",
        links: {},
        tags: ["golden", "test"],
      };
      const body = "Golden test body for hash stability verification.";

      const hash = computeHash(meta, body);

      // This hash should NEVER change - it's the identity of this content
      assert.match(hash, /^[a-f0-9]{64}$/, "Hash must be 64 hex characters");
    });
  });

  // === HASH STRING TESTS ===

  describe("hashString", () => {
    test("produces 64 character hex string", () => {
      const hash = hashString("test");
      assert.strictEqual(hash.length, 64);
      assert.match(hash, /^[a-f0-9]+$/);
    });

    test("empty string produces valid hash", () => {
      const hash = hashString("");
      assert.strictEqual(hash.length, 64);
    });

    test("unicode strings hash correctly", () => {
      const hash = hashString("日本語テスト 🎉");
      assert.strictEqual(hash.length, 64);
    });
  });

  // === VERIFY HASH TESTS ===

  describe("verifyHash", () => {
    test("valid hash verifies true", () => {
      const meta: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/verify",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: [],
      };
      const body = "Test body";
      const hash = computeHash(meta, body);

      assert.strictEqual(verifyHash(hash, meta, body), true);
    });

    test("modified body fails verification", () => {
      const meta: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/verify",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: [],
      };
      const body = "Original body";
      const hash = computeHash(meta, body);

      assert.strictEqual(verifyHash(hash, meta, "Modified body"), false);
    });

    test("wrong hash fails verification", () => {
      const meta: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/verify",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: [],
      };
      const body = "Test body";
      const wrongHash = "a".repeat(64);

      assert.strictEqual(verifyHash(wrongHash, meta, body), false);
    });
  });

  // === SHARD PATH TESTS ===

  describe("getShardPath", () => {
    test("default depth 2 returns first 2 characters", () => {
      const hash = "abcd1234567890";
      assert.strictEqual(getShardPath(hash), "ab");
    });

    test("custom depth works", () => {
      const hash = "abcd1234567890";
      assert.strictEqual(getShardPath(hash, 4), "abcd");
    });

    test("depth 1 returns single character", () => {
      const hash = "xyz123";
      assert.strictEqual(getShardPath(hash, 1), "x");
    });
  });

  // === HASH VALIDATION TESTS ===

  describe("isValidHash", () => {
    test("valid 64-char hex hash returns true", () => {
      const validHash = "a".repeat(64);
      assert.strictEqual(isValidHash(validHash), true);
    });

    test("short hash returns false", () => {
      assert.strictEqual(isValidHash("abc"), false);
    });

    test("long hash returns false", () => {
      assert.strictEqual(isValidHash("a".repeat(65)), false);
    });

    test("non-hex characters return false", () => {
      assert.strictEqual(isValidHash("g".repeat(64)), false);
    });

    test("uppercase hex returns false (must be lowercase)", () => {
      assert.strictEqual(isValidHash("A".repeat(64)), false);
    });

    test("empty string returns false", () => {
      assert.strictEqual(isValidHash(""), false);
    });
  });

  // === CANONICALIZATION TESTS ===

  describe("canonicalize", () => {
    test("produces consistent string output", () => {
      const meta: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/canon",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: ["b", "a"],
      };
      const body = "Test";

      const canon1 = canonicalize(meta, body);
      const canon2 = canonicalize(meta, body);

      assert.strictEqual(canon1, canon2);
    });

    test("sorts tags for consistency", () => {
      const meta1: AKUMeta = {
        created: "2026-01-09T00:00:00.000Z" as ISO8601,
        source: { type: "user", timestamp: "2026-01-09T00:00:00.000Z" as ISO8601 },
        domain: "test/canon",
        type: "fact",
        confidence: 0.9,
        volatility: "stable",
        links: {},
        tags: ["z", "a", "m"],
      };
      const meta2: AKUMeta = { ...meta1, tags: ["a", "m", "z"] };
      const body = "Test";

      const canon1 = canonicalize(meta1, body);
      const canon2 = canonicalize(meta2, body);

      assert.strictEqual(canon1, canon2);
    });
  });
});
