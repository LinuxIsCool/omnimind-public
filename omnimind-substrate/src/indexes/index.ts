/**
 * OMNIMIND Knowledge Substrate - Index Layer
 *
 * Indexes are DERIVED from atoms - they can always be rebuilt.
 * This layer provides fast queries over the content-addressed store.
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import type {
  AKU,
  ContentHash,
  DomainPath,
  KnowledgeType,
  RelationType,
  SearchResult,
  GraphNode,
} from "../types.js";

// === INDEX MANAGER ===

export class IndexManager {
  private root: string;
  private graphDb: Database.Database | null = null;
  private temporalDb: Database.Database | null = null;
  private ftsDb: Database.Database | null = null;

  constructor(indexRoot: string) {
    this.root = indexRoot;
    mkdirSync(this.root, { recursive: true });
  }

  // === INITIALIZATION ===

  /**
   * Initialize all indexes (creates tables if needed).
   */
  init(): void {
    this.initGraphIndex();
    this.initTemporalIndex();
    this.initFTSIndex();
  }

  private initGraphIndex(): void {
    const dbPath = join(this.root, "graph.db");
    this.graphDb = new Database(dbPath);

    this.graphDb.exec(`
      -- Atoms table (minimal metadata for fast lookups)
      CREATE TABLE IF NOT EXISTS atoms (
        hash TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        type TEXT NOT NULL,
        confidence REAL NOT NULL,
        created TEXT NOT NULL
      );

      -- Links table (edges in the knowledge graph)
      CREATE TABLE IF NOT EXISTS links (
        from_hash TEXT NOT NULL,
        to_hash TEXT NOT NULL,
        relation TEXT NOT NULL,
        created TEXT NOT NULL,
        PRIMARY KEY (from_hash, to_hash, relation),
        FOREIGN KEY (from_hash) REFERENCES atoms(hash)
      );

      -- Tags table (many-to-many)
      CREATE TABLE IF NOT EXISTS tags (
        hash TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (hash, tag),
        FOREIGN KEY (hash) REFERENCES atoms(hash)
      );

      -- Indexes for fast queries
      CREATE INDEX IF NOT EXISTS idx_atoms_domain ON atoms(domain);
      CREATE INDEX IF NOT EXISTS idx_atoms_type ON atoms(type);
      CREATE INDEX IF NOT EXISTS idx_atoms_created ON atoms(created);
      CREATE INDEX IF NOT EXISTS idx_links_from ON links(from_hash);
      CREATE INDEX IF NOT EXISTS idx_links_to ON links(to_hash);
      CREATE INDEX IF NOT EXISTS idx_links_relation ON links(relation);
      CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
    `);
  }

  private initTemporalIndex(): void {
    const dbPath = join(this.root, "temporal.db");
    this.temporalDb = new Database(dbPath);

    this.temporalDb.exec(`
      CREATE TABLE IF NOT EXISTS timeline (
        hash TEXT PRIMARY KEY,
        created TEXT NOT NULL,
        domain TEXT NOT NULL,
        type TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_timeline_created ON timeline(created);
      CREATE INDEX IF NOT EXISTS idx_timeline_domain_created ON timeline(domain, created);
    `);
  }

  private initFTSIndex(): void {
    const dbPath = join(this.root, "fts.db");
    this.ftsDb = new Database(dbPath);

    this.ftsDb.exec(`
      -- FTS5 virtual table for full-text search
      CREATE VIRTUAL TABLE IF NOT EXISTS content USING fts5(
        hash UNINDEXED,
        domain,
        title,
        body,
        tags,
        tokenize='porter unicode61'
      );
    `);
  }

  // === INDEXING ===

  /**
   * Index an AKU (call after ingestion).
   */
  indexAKU(aku: AKU): void {
    this.indexGraph(aku);
    this.indexTemporal(aku);
    this.indexFTS(aku);
  }

  private indexGraph(aku: AKU): void {
    if (!this.graphDb) return;

    // Insert atom
    const insertAtom = this.graphDb.prepare(`
      INSERT OR REPLACE INTO atoms (hash, domain, type, confidence, created)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertAtom.run(
      aku.id,
      aku.meta.domain,
      aku.meta.type,
      aku.meta.confidence,
      aku.meta.created
    );

    // Insert tags
    const insertTag = this.graphDb.prepare(`
      INSERT OR IGNORE INTO tags (hash, tag) VALUES (?, ?)
    `);
    for (const tag of aku.meta.tags) {
      insertTag.run(aku.id, tag);
    }

    // Insert links
    const insertLink = this.graphDb.prepare(`
      INSERT OR IGNORE INTO links (from_hash, to_hash, relation, created)
      VALUES (?, ?, ?, ?)
    `);

    const links = aku.meta.links;
    for (const [relation, targets] of Object.entries(links)) {
      if (Array.isArray(targets)) {
        for (const target of targets) {
          insertLink.run(aku.id, target, relation, aku.meta.created);
        }
      }
    }
  }

  private indexTemporal(aku: AKU): void {
    if (!this.temporalDb) return;

    const insert = this.temporalDb.prepare(`
      INSERT OR REPLACE INTO timeline (hash, created, domain, type)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(aku.id, aku.meta.created, aku.meta.domain, aku.meta.type);
  }

  private indexFTS(aku: AKU): void {
    if (!this.ftsDb) return;

    // Extract title from body (first heading or first line)
    const title = this.extractTitle(aku.body);

    const insert = this.ftsDb.prepare(`
      INSERT OR REPLACE INTO content (hash, domain, title, body, tags)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(
      aku.id,
      aku.meta.domain,
      title,
      aku.body,
      aku.meta.tags.join(" ")
    );
  }

  private extractTitle(body: string): string {
    const lines = body.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return trimmed.slice(2);
      }
      if (trimmed.length > 0) {
        return trimmed.slice(0, 100);
      }
    }
    return "";
  }

  // === QUERIES ===

  /**
   * Full-text search across all AKUs.
   *
   * Handles FTS5 query syntax properly:
   * - Escapes special characters (-, :, etc.)
   * - Wraps terms in quotes to prevent syntax errors
   */
  search(query: string, limit: number = 20): SearchResult[] {
    if (!this.ftsDb) return [];

    // Escape FTS5 special syntax:
    // - Quote each word individually to handle hyphens, colons, etc.
    // - Remove/escape problematic characters
    const sanitizedQuery = query
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => {
        // Remove FTS5 operators and special chars
        const cleaned = term.replace(/[":*^~(){}[\]\\]/g, "");
        // Wrap in quotes to handle hyphens and other special chars
        return cleaned ? `"${cleaned}"` : "";
      })
      .filter(Boolean)
      .join(" OR ");

    if (!sanitizedQuery) return [];

    try {
      const stmt = this.ftsDb.prepare(`
        SELECT hash, bm25(content) as score
        FROM content
        WHERE content MATCH ?
        ORDER BY score
        LIMIT ?
      `);

      const results = stmt.all(sanitizedQuery, limit) as Array<{ hash: string; score: number }>;
      return results.map((r) => ({
        hash: r.hash as ContentHash,
        score: -r.score, // BM25 returns negative scores, lower is better
      }));
    } catch (error) {
      // If FTS query still fails, fall back to LIKE search
      console.error(`FTS5 search failed for query "${query}":`, error);
      return this.searchFallback(query, limit);
    }
  }

  /**
   * Fallback search using LIKE when FTS5 fails.
   */
  private searchFallback(query: string, limit: number): SearchResult[] {
    if (!this.ftsDb) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    // Build LIKE conditions
    const conditions = terms.map(() => "(LOWER(body) LIKE ? OR LOWER(title) LIKE ?)").join(" OR ");
    const params = terms.flatMap((t) => [`%${t}%`, `%${t}%`]);

    const stmt = this.ftsDb.prepare(`
      SELECT hash, 1.0 as score
      FROM content
      WHERE ${conditions}
      LIMIT ?
    `);

    const results = stmt.all(...params, limit) as Array<{ hash: string; score: number }>;
    return results.map((r) => ({
      hash: r.hash as ContentHash,
      score: r.score,
    }));
  }

  /**
   * Get atoms by domain prefix.
   */
  byDomain(domainPrefix: DomainPath, limit: number = 100): ContentHash[] {
    if (!this.graphDb) return [];

    const stmt = this.graphDb.prepare(`
      SELECT hash FROM atoms
      WHERE domain LIKE ? || '%'
      ORDER BY created DESC
      LIMIT ?
    `);

    const results = stmt.all(domainPrefix, limit) as Array<{ hash: string }>;
    return results.map((r) => r.hash as ContentHash);
  }

  /**
   * Get atoms by type.
   */
  byType(type: KnowledgeType, limit: number = 100): ContentHash[] {
    if (!this.graphDb) return [];

    const stmt = this.graphDb.prepare(`
      SELECT hash FROM atoms
      WHERE type = ?
      ORDER BY created DESC
      LIMIT ?
    `);

    const results = stmt.all(type, limit) as Array<{ hash: string }>;
    return results.map((r) => r.hash as ContentHash);
  }

  /**
   * Get atoms by tag.
   */
  byTag(tag: string, limit: number = 100): ContentHash[] {
    if (!this.graphDb) return [];

    const stmt = this.graphDb.prepare(`
      SELECT hash FROM tags
      WHERE tag = ?
      LIMIT ?
    `);

    const results = stmt.all(tag, limit) as Array<{ hash: string }>;
    return results.map((r) => r.hash as ContentHash);
  }

  /**
   * Get atoms in a time range.
   */
  inTimeRange(from: string, to: string, limit: number = 100): ContentHash[] {
    if (!this.temporalDb) return [];

    const stmt = this.temporalDb.prepare(`
      SELECT hash FROM timeline
      WHERE created >= ? AND created <= ?
      ORDER BY created DESC
      LIMIT ?
    `);

    const results = stmt.all(from, to, limit) as Array<{ hash: string }>;
    return results.map((r) => r.hash as ContentHash);
  }

  /**
   * Get recent atoms.
   */
  recent(limit: number = 20): ContentHash[] {
    if (!this.temporalDb) return [];

    const stmt = this.temporalDb.prepare(`
      SELECT hash FROM timeline
      ORDER BY created DESC
      LIMIT ?
    `);

    const results = stmt.all(limit) as Array<{ hash: string }>;
    return results.map((r) => r.hash as ContentHash);
  }

  // === GRAPH TRAVERSAL ===

  /**
   * Get outgoing links from an atom.
   */
  outgoingLinks(hash: ContentHash): Array<{ to: ContentHash; relation: RelationType }> {
    if (!this.graphDb) return [];

    const stmt = this.graphDb.prepare(`
      SELECT to_hash, relation FROM links
      WHERE from_hash = ?
    `);

    const results = stmt.all(hash) as Array<{ to_hash: string; relation: string }>;
    return results.map((r) => ({
      to: r.to_hash as ContentHash,
      relation: r.relation as RelationType,
    }));
  }

  /**
   * Get incoming links to an atom.
   */
  incomingLinks(hash: ContentHash): Array<{ from: ContentHash; relation: RelationType }> {
    if (!this.graphDb) return [];

    const stmt = this.graphDb.prepare(`
      SELECT from_hash, relation FROM links
      WHERE to_hash = ?
    `);

    const results = stmt.all(hash) as Array<{ from_hash: string; relation: string }>;
    return results.map((r) => ({
      from: r.from_hash as ContentHash,
      relation: r.relation as RelationType,
    }));
  }

  /**
   * Traverse the knowledge graph from a starting node.
   */
  traverse(
    start: ContentHash,
    maxDepth: number = 2,
    direction: "out" | "in" | "both" = "both"
  ): GraphNode[] {
    if (!this.graphDb) return [];

    const visited: Set<ContentHash> = new Set();
    const result: GraphNode[] = [];
    const queue: Array<{ hash: ContentHash; depth: number }> = [{ hash: start, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.hash)) continue;
      if (current.depth > maxDepth) continue;

      visited.add(current.hash);
      result.push({ hash: current.hash, depth: current.depth });

      // Get neighbors
      const neighbors: ContentHash[] = [];

      if (direction === "out" || direction === "both") {
        for (const link of this.outgoingLinks(current.hash)) {
          neighbors.push(link.to);
        }
      }

      if (direction === "in" || direction === "both") {
        for (const link of this.incomingLinks(current.hash)) {
          neighbors.push(link.from);
        }
      }

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ hash: neighbor, depth: current.depth + 1 });
        }
      }
    }

    return result;
  }

  /**
   * Find shortest path between two atoms.
   */
  shortestPath(from: ContentHash, to: ContentHash, maxDepth: number = 5): ContentHash[] | null {
    if (!this.graphDb) return null;

    const visited: Set<ContentHash> = new Set();
    const parent: Map<ContentHash, ContentHash> = new Map();
    const queue: ContentHash[] = [from];

    visited.add(from);

    let depth = 0;
    let levelSize = 1;

    while (queue.length > 0 && depth <= maxDepth) {
      const current = queue.shift()!;
      levelSize--;

      if (current === to) {
        // Reconstruct path
        const path: ContentHash[] = [current];
        let node = current;
        while (parent.has(node)) {
          node = parent.get(node)!;
          path.unshift(node);
        }
        return path;
      }

      // Get neighbors
      for (const link of this.outgoingLinks(current)) {
        if (!visited.has(link.to)) {
          visited.add(link.to);
          parent.set(link.to, current);
          queue.push(link.to);
        }
      }

      for (const link of this.incomingLinks(current)) {
        if (!visited.has(link.from)) {
          visited.add(link.from);
          parent.set(link.from, current);
          queue.push(link.from);
        }
      }

      if (levelSize === 0) {
        depth++;
        levelSize = queue.length;
      }
    }

    return null;
  }

  // === MAINTENANCE ===

  /**
   * Rebuild all indexes from scratch.
   */
  async rebuild(atomIterator: AsyncIterable<AKU>): Promise<number> {
    // Clear existing data (delete in FK-safe order: dependent tables first)
    this.graphDb?.exec("DELETE FROM tags; DELETE FROM links; DELETE FROM atoms;");
    this.temporalDb?.exec("DELETE FROM timeline;");
    this.ftsDb?.exec("DELETE FROM content;");

    let count = 0;
    for await (const aku of atomIterator) {
      this.indexAKU(aku);
      count++;
    }

    return count;
  }

  /**
   * Close all database connections.
   */
  close(): void {
    this.graphDb?.close();
    this.temporalDb?.close();
    this.ftsDb?.close();
  }
}
