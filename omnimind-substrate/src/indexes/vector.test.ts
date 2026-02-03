/**
 * OMNIMIND Knowledge Substrate - Vector Index Tests
 *
 * Tests for vector storage, similarity search, and math utilities.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  VectorIndex,
  MockEmbeddingProvider,
  cosineSimilarity,
  euclideanDistance,
  normalizeVector,
  embeddingToBuffer,
  bufferToEmbedding,
} from "./vector.js";
import type { ContentHash, Embedding } from "../types.js";

describe("Vector Index", () => {
  let testRoot: string;
  let vectorIndex: VectorIndex;

  beforeEach(() => {
    testRoot = mkdtempSync(join(tmpdir(), "omnimind-vector-test-"));
    vectorIndex = new VectorIndex(testRoot, 128, "test-model");
  });

  afterEach(() => {
    vectorIndex.close();
    rmSync(testRoot, { recursive: true, force: true });
  });

  // === MATH UTILITIES ===

  describe("Vector Math", () => {
    test("cosineSimilarity returns 1 for identical vectors", () => {
      const v = new Float32Array([1, 2, 3, 4]) as Embedding;
      const similarity = cosineSimilarity(v, v);
      assert.ok(Math.abs(similarity - 1) < 0.0001);
    });

    test("cosineSimilarity returns 0 for orthogonal vectors", () => {
      const a = new Float32Array([1, 0, 0, 0]) as Embedding;
      const b = new Float32Array([0, 1, 0, 0]) as Embedding;
      const similarity = cosineSimilarity(a, b);
      assert.ok(Math.abs(similarity) < 0.0001);
    });

    test("cosineSimilarity returns -1 for opposite vectors", () => {
      const a = new Float32Array([1, 2, 3]) as Embedding;
      const b = new Float32Array([-1, -2, -3]) as Embedding;
      const similarity = cosineSimilarity(a, b);
      assert.ok(Math.abs(similarity + 1) < 0.0001);
    });

    test("euclideanDistance returns 0 for identical vectors", () => {
      const v = new Float32Array([1, 2, 3, 4]) as Embedding;
      const distance = euclideanDistance(v, v);
      assert.ok(Math.abs(distance) < 0.0001);
    });

    test("euclideanDistance computes correctly", () => {
      const a = new Float32Array([0, 0, 0]) as Embedding;
      const b = new Float32Array([3, 4, 0]) as Embedding;
      const distance = euclideanDistance(a, b);
      assert.ok(Math.abs(distance - 5) < 0.0001); // 3-4-5 triangle
    });

    test("normalizeVector produces unit length", () => {
      const v = new Float32Array([3, 4, 0]) as Embedding;
      const normalized = normalizeVector(v);

      let norm = 0;
      for (let i = 0; i < normalized.length; i++) {
        norm += normalized[i] * normalized[i];
      }
      norm = Math.sqrt(norm);

      assert.ok(Math.abs(norm - 1) < 0.0001);
    });

    test("buffer conversion roundtrips correctly", () => {
      const original = new Float32Array([1.5, -2.3, 0.001, 999.99]) as Embedding;
      const buffer = embeddingToBuffer(original);
      const recovered = bufferToEmbedding(buffer);

      assert.strictEqual(recovered.length, original.length);
      for (let i = 0; i < original.length; i++) {
        assert.ok(Math.abs(recovered[i] - original[i]) < 0.0001);
      }
    });
  });

  // === STORAGE ===

  describe("Storage", () => {
    test("store and retrieve embedding", () => {
      const hash = "a".repeat(64) as ContentHash;
      const embedding = new Float32Array(128).fill(0.5) as Embedding;

      vectorIndex.store(hash, embedding);
      const retrieved = vectorIndex.get(hash);

      assert.ok(retrieved);
      assert.strictEqual(retrieved.length, 128);
    });

    test("has returns false for missing hash", () => {
      const hash = "b".repeat(64) as ContentHash;
      assert.strictEqual(vectorIndex.has(hash), false);
    });

    test("has returns true after store", () => {
      const hash = "c".repeat(64) as ContentHash;
      const embedding = new Float32Array(128).fill(0.1) as Embedding;

      vectorIndex.store(hash, embedding);
      assert.strictEqual(vectorIndex.has(hash), true);
    });

    test("delete removes embedding", () => {
      const hash = "d".repeat(64) as ContentHash;
      const embedding = new Float32Array(128).fill(0.2) as Embedding;

      vectorIndex.store(hash, embedding);
      assert.strictEqual(vectorIndex.has(hash), true);

      const deleted = vectorIndex.delete(hash);
      assert.strictEqual(deleted, true);
      assert.strictEqual(vectorIndex.has(hash), false);
    });

    test("store rejects wrong dimensions", () => {
      const hash = "e".repeat(64) as ContentHash;
      const wrongDimensions = new Float32Array(64).fill(0.1) as Embedding;

      assert.throws(
        () => vectorIndex.store(hash, wrongDimensions),
        /dimension mismatch/
      );
    });

    test("stored vectors are normalized", () => {
      const hash = "f".repeat(64) as ContentHash;
      const unnormalized = new Float32Array(128).fill(10) as Embedding;

      vectorIndex.store(hash, unnormalized);
      const retrieved = vectorIndex.get(hash);

      assert.ok(retrieved);

      // Check that retrieved vector has unit length
      let norm = 0;
      for (let i = 0; i < retrieved.length; i++) {
        norm += retrieved[i] * retrieved[i];
      }
      norm = Math.sqrt(norm);

      assert.ok(Math.abs(norm - 1) < 0.0001);
    });
  });

  // === SEARCH ===

  describe("Search", () => {
    test("search finds similar vectors", async () => {
      const provider = new MockEmbeddingProvider(128);

      // Store some embeddings with unique hashes
      const targetHash = "target00".padEnd(64, "0") as ContentHash;
      const otherHash1 = "other001".padEnd(64, "0") as ContentHash;
      const otherHash2 = "other002".padEnd(64, "0") as ContentHash;

      const targetEmbedding = await provider.embed("specific unique content alpha");
      const otherEmbedding1 = await provider.embed("different content beta");
      const otherEmbedding2 = await provider.embed("another thing gamma");

      vectorIndex.store(targetHash, targetEmbedding);
      vectorIndex.store(otherHash1, otherEmbedding1);
      vectorIndex.store(otherHash2, otherEmbedding2);

      // Query with exact same text should return perfect match first
      const queryEmbedding = await provider.embed("specific unique content alpha");
      const results = vectorIndex.search(queryEmbedding, 10);

      // Should find results
      assert.ok(results.length > 0, "Should find at least one result");
      // First result should be the exact match with very high similarity
      assert.strictEqual(results[0].hash, targetHash, "Exact match should be first");
      assert.ok(results[0].similarity > 0.99, "Exact match should have similarity ~1.0");
    });

    test("search respects limit", async () => {
      const provider = new MockEmbeddingProvider(128);

      // Store many embeddings
      for (let i = 0; i < 20; i++) {
        const hash = `item${i}`.padEnd(64, "0") as ContentHash;
        const embedding = await provider.embed(`document number ${i}`);
        vectorIndex.store(hash, embedding);
      }

      const queryEmbedding = await provider.embed("document");
      const results = vectorIndex.search(queryEmbedding, 5);

      assert.strictEqual(results.length, 5);
    });

    test("search respects minSimilarity", async () => {
      const provider = new MockEmbeddingProvider(128);

      // Store diverse embeddings
      const texts = ["cat", "dog", "airplane", "quantum physics"];
      for (const text of texts) {
        const hash = text.replace(/\s/g, "").padEnd(64, "0") as ContentHash;
        const embedding = await provider.embed(text);
        vectorIndex.store(hash, embedding);
      }

      const queryEmbedding = await provider.embed("cat");
      const results = vectorIndex.search(queryEmbedding, 10, 0.5);

      // Should filter out dissimilar results
      for (const result of results) {
        assert.ok(result.similarity >= 0.5);
      }
    });

    test("findNearest excludes self", async () => {
      const provider = new MockEmbeddingProvider(128);

      const hashes: ContentHash[] = [];
      const texts = ["item one", "item two", "item three"];

      for (const text of texts) {
        const hash = text.replace(/\s/g, "").padEnd(64, "0") as ContentHash;
        const embedding = await provider.embed(text);
        vectorIndex.store(hash, embedding);
        hashes.push(hash);
      }

      const results = vectorIndex.findNearest(hashes[0], 5);

      // Should not include the query hash
      for (const result of results) {
        assert.notStrictEqual(result.hash, hashes[0]);
      }
    });
  });

  // === STATISTICS ===

  describe("Statistics", () => {
    test("stats returns correct count", async () => {
      const provider = new MockEmbeddingProvider(128);

      for (let i = 0; i < 5; i++) {
        const hash = `stat${i}`.padEnd(64, "0") as ContentHash;
        const embedding = await provider.embed(`content ${i}`);
        vectorIndex.store(hash, embedding);
      }

      const stats = vectorIndex.stats();
      assert.strictEqual(stats.count, 5);
      assert.strictEqual(stats.dimensions, 128);
      assert.strictEqual(stats.model, "test-model");
    });

    test("clear removes all embeddings", async () => {
      const provider = new MockEmbeddingProvider(128);

      for (let i = 0; i < 5; i++) {
        const hash = `clear${i}`.padEnd(64, "0") as ContentHash;
        const embedding = await provider.embed(`content ${i}`);
        vectorIndex.store(hash, embedding);
      }

      assert.strictEqual(vectorIndex.stats().count, 5);

      vectorIndex.clear();

      assert.strictEqual(vectorIndex.stats().count, 0);
    });
  });

  // === MOCK PROVIDER ===

  describe("Mock Embedding Provider", () => {
    test("produces deterministic embeddings", async () => {
      const provider = new MockEmbeddingProvider(128);

      const text = "hello world";
      const embedding1 = await provider.embed(text);
      const embedding2 = await provider.embed(text);

      for (let i = 0; i < embedding1.length; i++) {
        assert.strictEqual(embedding1[i], embedding2[i]);
      }
    });

    test("different texts produce different embeddings", async () => {
      const provider = new MockEmbeddingProvider(128);

      const embedding1 = await provider.embed("hello");
      const embedding2 = await provider.embed("goodbye");

      let different = false;
      for (let i = 0; i < embedding1.length; i++) {
        if (embedding1[i] !== embedding2[i]) {
          different = true;
          break;
        }
      }
      assert.ok(different);
    });

    test("embedBatch returns correct count", async () => {
      const provider = new MockEmbeddingProvider(128);
      const texts = ["a", "b", "c", "d", "e"];

      const embeddings = await provider.embedBatch(texts);
      assert.strictEqual(embeddings.length, 5);
    });

    test("produced embeddings are normalized", async () => {
      const provider = new MockEmbeddingProvider(128);
      const embedding = await provider.embed("test content");

      let norm = 0;
      for (let i = 0; i < embedding.length; i++) {
        norm += embedding[i] * embedding[i];
      }
      norm = Math.sqrt(norm);

      assert.ok(Math.abs(norm - 1) < 0.0001);
    });
  });
});
