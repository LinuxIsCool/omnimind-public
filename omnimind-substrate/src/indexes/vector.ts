/**
 * OMNIMIND Knowledge Substrate - Vector Index
 *
 * SQLite-based vector storage with pure JavaScript similarity search.
 * Supports pluggable embedding providers.
 *
 * Architecture:
 * - Vectors stored as BLOBs in SQLite (portable, no external deps)
 * - Cosine similarity computed in JS (works offline)
 * - Brute-force search for now (sufficient for <100k vectors)
 * - Future: HNSW index for larger scale
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import type {
  ContentHash,
  Embedding,
  EmbeddingProvider,
  VectorSearchResult,
} from "../types.js";

// === VECTOR MATH UTILITIES ===

/**
 * Compute cosine similarity between two vectors.
 * Returns value in [-1, 1] where 1 = identical, 0 = orthogonal, -1 = opposite.
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Compute Euclidean distance between two vectors.
 * Returns value >= 0 where 0 = identical.
 */
export function euclideanDistance(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Normalize a vector to unit length (L2 norm = 1).
 * Returns new normalized vector.
 */
export function normalizeVector(v: Embedding): Embedding {
  let norm = 0;
  for (let i = 0; i < v.length; i++) {
    norm += v[i] * v[i];
  }
  norm = Math.sqrt(norm);

  if (norm === 0) return v;

  const normalized = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) {
    normalized[i] = v[i] / norm;
  }
  return normalized;
}

/**
 * Convert Float32Array to Buffer for SQLite storage.
 */
export function embeddingToBuffer(embedding: Embedding): Buffer {
  return Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
}

/**
 * Convert Buffer from SQLite to Float32Array.
 */
export function bufferToEmbedding(buffer: Buffer): Embedding {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

// === VECTOR INDEX ===

export class VectorIndex {
  private db: Database.Database;
  private dimensions: number;
  private model: string;

  constructor(indexRoot: string, dimensions: number = 1536, model: string = "unknown") {
    mkdirSync(indexRoot, { recursive: true });
    const dbPath = join(indexRoot, "vectors.db");
    this.db = new Database(dbPath);
    this.dimensions = dimensions;
    this.model = model;
    this.init();
  }

  /**
   * Initialize the vector index schema.
   */
  private init(): void {
    this.db.exec(`
      -- Vector embeddings table
      CREATE TABLE IF NOT EXISTS embeddings (
        hash TEXT PRIMARY KEY,
        vector BLOB NOT NULL,
        dimensions INTEGER NOT NULL,
        model TEXT NOT NULL,
        created TEXT NOT NULL
      );

      -- Metadata about the index
      CREATE TABLE IF NOT EXISTS index_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Index for fast model filtering
      CREATE INDEX IF NOT EXISTS idx_embeddings_model ON embeddings(model);
    `);

    // Store index configuration
    const insertMeta = this.db.prepare(`
      INSERT OR REPLACE INTO index_meta (key, value) VALUES (?, ?)
    `);
    insertMeta.run("dimensions", String(this.dimensions));
    insertMeta.run("model", this.model);
  }

  /**
   * Store a vector embedding for an AKU.
   */
  store(hash: ContentHash, embedding: Embedding): void {
    if (embedding.length !== this.dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimensions}, got ${embedding.length}`
      );
    }

    // Normalize for consistent cosine similarity
    const normalized = normalizeVector(embedding);
    const buffer = embeddingToBuffer(normalized);

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO embeddings (hash, vector, dimensions, model, created)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(hash, buffer, this.dimensions, this.model, new Date().toISOString());
  }

  /**
   * Get the embedding for an AKU.
   */
  get(hash: ContentHash): Embedding | null {
    const row = this.db.prepare(`
      SELECT vector FROM embeddings WHERE hash = ?
    `).get(hash) as { vector: Buffer } | undefined;

    if (!row) return null;
    return bufferToEmbedding(row.vector);
  }

  /**
   * Check if an embedding exists for a hash.
   */
  has(hash: ContentHash): boolean {
    const row = this.db.prepare(`
      SELECT 1 FROM embeddings WHERE hash = ?
    `).get(hash);
    return row !== undefined;
  }

  /**
   * Delete an embedding.
   */
  delete(hash: ContentHash): boolean {
    const result = this.db.prepare(`
      DELETE FROM embeddings WHERE hash = ?
    `).run(hash);
    return result.changes > 0;
  }

  /**
   * Search for similar vectors using brute-force cosine similarity.
   * Returns results sorted by similarity (highest first).
   */
  search(query: Embedding, limit: number = 10, minSimilarity: number = 0): VectorSearchResult[] {
    if (query.length !== this.dimensions) {
      throw new Error(
        `Query dimension mismatch: expected ${this.dimensions}, got ${query.length}`
      );
    }

    // Normalize query for consistent comparison
    const normalizedQuery = normalizeVector(query);

    // Get all embeddings (brute force - efficient up to ~100k vectors)
    const rows = this.db.prepare(`
      SELECT hash, vector FROM embeddings
    `).all() as Array<{ hash: string; vector: Buffer }>;

    // Compute similarities
    const results: VectorSearchResult[] = [];

    for (const row of rows) {
      const embedding = bufferToEmbedding(row.vector);
      const similarity = cosineSimilarity(normalizedQuery, embedding);

      if (similarity >= minSimilarity) {
        results.push({
          hash: row.hash as ContentHash,
          similarity,
          distance: Math.sqrt(2 * (1 - similarity)), // Convert cosine to angular distance
        });
      }
    }

    // Sort by similarity (highest first) and return top k
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  /**
   * Find the k nearest neighbors to a hash.
   */
  findNearest(hash: ContentHash, k: number = 10): VectorSearchResult[] {
    const embedding = this.get(hash);
    if (!embedding) {
      throw new Error(`No embedding found for hash: ${hash}`);
    }

    // Search and filter out the query itself
    const results = this.search(embedding, k + 1);
    return results.filter((r) => r.hash !== hash).slice(0, k);
  }

  /**
   * Get statistics about the vector index.
   */
  stats(): { count: number; dimensions: number; model: string } {
    const countRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM embeddings
    `).get() as { count: number };

    return {
      count: countRow.count,
      dimensions: this.dimensions,
      model: this.model,
    };
  }

  /**
   * Clear all embeddings (for rebuild).
   */
  clear(): void {
    this.db.exec("DELETE FROM embeddings");
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
}

// === MOCK EMBEDDING PROVIDER ===

/**
 * A mock embedding provider for testing.
 * Generates deterministic pseudo-random vectors based on content hash.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;
  readonly model: string = "mock-v1";

  constructor(dimensions: number = 128) {
    this.dimensions = dimensions;
  }

  /**
   * Generate a deterministic pseudo-random embedding from text.
   * Uses a simple hash-based approach for reproducibility.
   */
  async embed(text: string): Promise<Embedding> {
    const embedding = new Float32Array(this.dimensions);

    // Simple deterministic pseudo-random based on text content
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    }

    // Generate pseudo-random values using LCG
    for (let i = 0; i < this.dimensions; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      embedding[i] = (seed / 0x7fffffff) * 2 - 1; // [-1, 1]
    }

    return normalizeVector(embedding);
  }

  async embedBatch(texts: string[]): Promise<Embedding[]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
