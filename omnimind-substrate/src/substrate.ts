/**
 * OMNIMIND Knowledge Substrate - Core Operations
 *
 * Layer 0: The foundational storage layer for Atomic Knowledge Units.
 * Append-only, content-addressed, human-readable at rest.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { parse as parseYAML, stringify as stringifyYAML } from "yaml";
import {
  computeHash,
  getShardPath,
  verifyHash,
  isValidHash,
} from "./hash.js";
import type {
  AKU,
  AKUMeta,
  AKUInput,
  AKUFilter,
  AKULinks,
  ContentHash,
  DomainPath,
  IngestInput,
  ISO8601,
  KnowledgeSource,
  KnowledgeType,
  RelationType,
  SubstrateConfig,
  SubstrateStats,
  IntegrityReport,
  Volatility,
} from "./types.js";

// === CONSTANTS ===

const AKU_VERSION = 1;
const FRONTMATTER_DELIMITER = "---";
const WAL_FILENAME = "pending.jsonl";
const EXTERNAL_LINKS_FILE = "external-links.jsonl";

// === SECURITY UTILITIES ===

/**
 * Validate domain path to prevent path traversal attacks.
 * Domains must be safe filesystem path segments.
 */
function validateDomain(domain: DomainPath): void {
  // Check for path traversal patterns
  if (
    domain.includes("..") ||
    domain.includes("//") ||
    domain.startsWith("/") ||
    domain.includes("%2F") ||      // URL-encoded /
    domain.includes("%2f") ||
    domain.includes("%2E%2E") ||   // URL-encoded ..
    domain.includes("%2e%2e") ||
    domain.includes("\\")           // Windows path separator
  ) {
    throw new Error(`Invalid domain: path traversal detected in "${domain}"`);
  }

  // Validate each segment is a safe identifier
  const segments = domain.split("/");
  const validSegment = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

  for (const segment of segments) {
    if (!segment || !validSegment.test(segment)) {
      throw new Error(
        `Invalid domain: segment "${segment}" must start with alphanumeric and contain only alphanumeric, underscore, or hyphen`
      );
    }
  }
}

// === DEFAULT CONFIG ===

const DEFAULT_CONFIG: SubstrateConfig = {
  version: AKU_VERSION,
  substrate: {
    hash_algorithm: "sha256",
    shard_depth: 2,
  },
  indexes: {
    vectors: { enabled: false },
    graph: { enabled: true },
    temporal: { enabled: true },
    fts: { enabled: true },
  },
  defaults: {
    confidence: 0.8,
    volatility: "evolving",
  },
};

// === SERIALIZATION ===

/**
 * Serialize an AKU to Markdown with YAML frontmatter.
 */
export function serializeAKU(aku: AKU): string {
  const frontmatter = stringifyYAML(aku.meta, {
    indent: 2,
    lineWidth: 0,
  });

  return `${FRONTMATTER_DELIMITER}\n${frontmatter}${FRONTMATTER_DELIMITER}\n\n${aku.body}`;
}

/**
 * Parse an AKU from Markdown with YAML frontmatter.
 */
export function parseAKU(content: string, hash: ContentHash): AKU {
  const lines = content.split("\n");

  // Find frontmatter boundaries
  if (lines[0] !== FRONTMATTER_DELIMITER) {
    throw new Error("Invalid AKU: missing frontmatter start");
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === FRONTMATTER_DELIMITER) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    throw new Error("Invalid AKU: missing frontmatter end");
  }

  const frontmatterLines = lines.slice(1, endIndex).join("\n");
  const bodyLines = lines.slice(endIndex + 1).join("\n").trim();

  const meta = parseYAML(frontmatterLines) as AKUMeta;

  return {
    id: hash,
    meta,
    body: bodyLines,
  };
}

// === SUBSTRATE CLASS ===

/**
 * The Knowledge Substrate - Layer 0 operations.
 */
export class Substrate {
  private root: string;
  private config: SubstrateConfig;

  constructor(root: string) {
    this.root = root;
    this.config = this.loadConfig();
  }

  // === PATHS ===

  private get atomsDir(): string {
    return join(this.root, "atoms");
  }

  private get headsDir(): string {
    return join(this.root, "heads");
  }

  private get indexesDir(): string {
    return join(this.root, "indexes");
  }

  private get walDir(): string {
    return join(this.root, "WAL");
  }

  private get configPath(): string {
    return join(this.root, ".aku", "config.yaml");
  }

  private atomPath(hash: ContentHash): string {
    const shard = getShardPath(hash, this.config.substrate.shard_depth);
    return join(this.atomsDir, shard, hash);
  }

  // === CONFIGURATION ===

  private loadConfig(): SubstrateConfig {
    if (existsSync(this.configPath)) {
      const content = readFileSync(this.configPath, "utf8");
      return parseYAML(content) as SubstrateConfig;
    }
    return DEFAULT_CONFIG;
  }

  // === CORE OPERATIONS ===

  /**
   * Ingest knowledge into the substrate.
   * Returns the content hash (identity) of the new AKU.
   */
  async ingest(input: IngestInput): Promise<ContentHash> {
    // Security: validate domain path to prevent path traversal
    validateDomain(input.domain);

    // Build full metadata with defaults
    const now = new Date().toISOString() as ISO8601;

    const source: KnowledgeSource = {
      type: input.source?.type ?? "user",
      uri: input.source?.uri,
      session: input.source?.session,
      timestamp: input.source?.timestamp ?? now,
      citation: input.source?.citation,
    };

    const meta: AKUMeta = {
      created: now,
      source,
      domain: input.domain,
      type: input.type ?? "fact",
      confidence: input.confidence ?? this.config.defaults.confidence,
      volatility: input.volatility ?? this.config.defaults.volatility,
      links: input.links ?? {},
      tags: input.tags ?? [],
      extra: input.extra,
    };

    // Compute content hash
    const hash = computeHash(meta, input.body);

    // Check if already exists (deduplication)
    if (await this.exists(hash)) {
      return hash;
    }

    // Construct AKU
    const aku: AKU = {
      id: hash,
      meta,
      body: input.body,
    };

    // Write to WAL first (crash safety)
    await this.appendWAL(hash, aku);

    // Write to content-addressed storage
    await this.writeAtom(hash, aku);

    // Update heads
    await this.updateHead("latest", hash);
    await this.updateDomainHead(input.domain, hash);

    // Commit WAL
    await this.commitWAL(hash);

    return hash;
  }

  /**
   * Get an AKU by its content hash.
   */
  async get(hash: ContentHash): Promise<AKU | null> {
    if (!isValidHash(hash)) {
      throw new Error(`Invalid hash format: ${hash}`);
    }

    const path = this.atomPath(hash);

    if (!existsSync(path)) {
      return null;
    }

    const content = readFileSync(path, "utf8");
    return parseAKU(content, hash);
  }

  /**
   * Check if an AKU exists.
   */
  async exists(hash: ContentHash): Promise<boolean> {
    return existsSync(this.atomPath(hash));
  }

  /**
   * List AKU hashes matching a filter.
   */
  async *list(filter?: AKUFilter): AsyncGenerator<ContentHash> {
    const shardDirs = readdirSync(this.atomsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    let count = 0;
    const limit = filter?.limit ?? Infinity;
    const offset = filter?.offset ?? 0;
    let skipped = 0;

    for (const shard of shardDirs) {
      const shardPath = join(this.atomsDir, shard);
      const files = readdirSync(shardPath);

      for (const file of files) {
        if (!isValidHash(file)) continue;

        // Apply filters
        if (filter) {
          const aku = await this.get(file);
          if (!aku) continue;

          if (filter.domain && aku.meta.domain !== filter.domain) continue;
          if (filter.domainPrefix && !aku.meta.domain.startsWith(filter.domainPrefix)) continue;
          if (filter.type && aku.meta.type !== filter.type) continue;
          if (filter.minConfidence && aku.meta.confidence < filter.minConfidence) continue;
          if (filter.since && aku.meta.created < filter.since) continue;
          if (filter.until && aku.meta.created > filter.until) continue;
          if (filter.tags && !filter.tags.every((t) => aku.meta.tags.includes(t))) continue;
        }

        // Handle offset
        if (skipped < offset) {
          skipped++;
          continue;
        }

        // Handle limit
        if (count >= limit) return;

        yield file;
        count++;
      }
    }
  }

  /**
   * Add a link between two AKUs.
   * Stores link externally (atoms remain immutable).
   */
  async link(
    from: ContentHash,
    to: ContentHash,
    relation: RelationType
  ): Promise<void> {
    // Verify source exists
    const aku = await this.get(from);
    if (!aku) {
      throw new Error(`Source AKU not found: ${from}`);
    }

    // Store link in external links file (immutability preserved)
    const linkEntry = {
      from,
      to,
      relation,
      created: new Date().toISOString(),
    };

    const linksPath = join(this.root, EXTERNAL_LINKS_FILE);
    appendFileSync(linksPath, JSON.stringify(linkEntry) + "\n");
  }

  /**
   * Get external links (links added via link() after ingestion).
   */
  private getExternalLinks(): Array<{ from: ContentHash; to: ContentHash; relation: string }> {
    const linksPath = join(this.root, EXTERNAL_LINKS_FILE);
    if (!existsSync(linksPath)) return [];

    const content = readFileSync(linksPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);

    return lines.map((line) => JSON.parse(line));
  }

  /**
   * Get neighboring AKUs in the knowledge graph.
   * Includes both embedded links (in AKU metadata) and external links.
   */
  async neighbors(
    hash: ContentHash,
    direction: "in" | "out" | "both" = "both"
  ): Promise<ContentHash[]> {
    const neighbors: Set<ContentHash> = new Set();

    // Get embedded links from AKU metadata
    const aku = await this.get(hash);
    if (aku && (direction === "out" || direction === "both")) {
      const links = aku.meta.links;
      for (const hashes of Object.values(links)) {
        if (Array.isArray(hashes)) {
          for (const h of hashes) {
            neighbors.add(h);
          }
        }
      }
    }

    // Get external links (added via link() after ingestion)
    const externalLinks = this.getExternalLinks();

    if (direction === "out" || direction === "both") {
      for (const link of externalLinks) {
        if (link.from === hash) {
          neighbors.add(link.to);
        }
      }
    }

    if (direction === "in" || direction === "both") {
      for (const link of externalLinks) {
        if (link.to === hash) {
          neighbors.add(link.from);
        }
      }
    }

    return Array.from(neighbors);
  }

  // === HEADS ===

  private async updateHead(name: string, hash: ContentHash): Promise<void> {
    const headPath = join(this.headsDir, name);
    writeFileSync(headPath, hash);
  }

  private async updateDomainHead(domain: DomainPath, hash: ContentHash): Promise<void> {
    const domainDir = join(this.headsDir, "domains");
    mkdirSync(domainDir, { recursive: true });

    // Use first segment of domain
    const topDomain = domain.split("/")[0];
    const headPath = join(domainDir, topDomain);

    // Append to domain list (for now, simple approach)
    appendFileSync(headPath, hash + "\n");
  }

  async getHead(name: string): Promise<ContentHash | null> {
    const headPath = join(this.headsDir, name);
    if (!existsSync(headPath)) return null;
    return readFileSync(headPath, "utf8").trim();
  }

  // === WAL (Write-Ahead Log) ===

  private async appendWAL(hash: ContentHash, aku: AKU): Promise<void> {
    const walPath = join(this.walDir, WAL_FILENAME);
    const entry = JSON.stringify({ hash, timestamp: new Date().toISOString(), status: "pending" });
    appendFileSync(walPath, entry + "\n");
  }

  private async commitWAL(hash: ContentHash): Promise<void> {
    // In a production system, we'd update the WAL entry
    // For simplicity, we just append a commit marker
    const walPath = join(this.walDir, WAL_FILENAME);
    const entry = JSON.stringify({ hash, timestamp: new Date().toISOString(), status: "committed" });
    appendFileSync(walPath, entry + "\n");
  }

  // === ATOM STORAGE ===

  private async writeAtom(hash: ContentHash, aku: AKU): Promise<void> {
    const path = this.atomPath(hash);
    const dir = dirname(path);

    mkdirSync(dir, { recursive: true });

    const content = serializeAKU(aku);
    writeFileSync(path, content);
  }

  // === STATISTICS ===

  async stats(): Promise<SubstrateStats> {
    let totalAtoms = 0;
    const byType: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    let totalLinks = 0;
    let oldestAtom: ISO8601 | undefined;
    let newestAtom: ISO8601 | undefined;
    let diskUsage = 0;

    for await (const hash of this.list()) {
      const aku = await this.get(hash);
      if (!aku) continue;

      totalAtoms++;

      // By type
      byType[aku.meta.type] = (byType[aku.meta.type] || 0) + 1;

      // By domain (top level)
      const topDomain = aku.meta.domain.split("/")[0];
      byDomain[topDomain] = (byDomain[topDomain] || 0) + 1;

      // Links
      for (const links of Object.values(aku.meta.links)) {
        if (Array.isArray(links)) {
          totalLinks += links.length;
        }
      }

      // Temporal
      if (!oldestAtom || aku.meta.created < oldestAtom) {
        oldestAtom = aku.meta.created;
      }
      if (!newestAtom || aku.meta.created > newestAtom) {
        newestAtom = aku.meta.created;
      }

      // Disk usage
      const path = this.atomPath(hash);
      const stat = statSync(path);
      diskUsage += stat.size;
    }

    return {
      totalAtoms,
      byType: byType as Record<KnowledgeType, number>,
      byDomain,
      totalLinks,
      oldestAtom,
      newestAtom,
      diskUsage,
    };
  }

  /**
   * Verify integrity of all atoms.
   */
  async verify(): Promise<IntegrityReport> {
    const corrupted: ContentHash[] = [];
    const orphanedLinks: Array<{ from: ContentHash; to: ContentHash }> = [];
    const allHashes: Set<ContentHash> = new Set();
    let totalChecked = 0;

    // First pass: collect all hashes and verify content integrity
    for await (const hash of this.list()) {
      totalChecked++;
      allHashes.add(hash);

      const aku = await this.get(hash);
      if (!aku) {
        corrupted.push(hash);
        continue;
      }

      // Verify hash matches content
      if (!verifyHash(hash, aku.meta, aku.body)) {
        corrupted.push(hash);
      }
    }

    // Second pass: check for orphaned links
    for await (const hash of this.list()) {
      const aku = await this.get(hash);
      if (!aku) continue;

      for (const links of Object.values(aku.meta.links)) {
        if (Array.isArray(links)) {
          for (const linkedHash of links) {
            if (!allHashes.has(linkedHash)) {
              orphanedLinks.push({ from: hash, to: linkedHash });
            }
          }
        }
      }
    }

    return {
      valid: corrupted.length === 0 && orphanedLinks.length === 0,
      totalChecked,
      corrupted,
      orphanedLinks,
      missingAtoms: orphanedLinks.map((l) => l.to),
    };
  }
}

// === INITIALIZATION ===

/**
 * Initialize a new knowledge substrate at the given path.
 */
export function initSubstrate(root: string): Substrate {
  // Create directory structure
  const dirs = [
    join(root, ".aku", "schemas"),
    join(root, "atoms"),
    join(root, "heads", "domains"),
    join(root, "heads", "sessions"),
    join(root, "indexes"),
    join(root, "WAL"),
  ];

  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }

  // Write version
  writeFileSync(join(root, ".aku", "version"), String(AKU_VERSION));

  // Write config
  const configPath = join(root, ".aku", "config.yaml");
  writeFileSync(configPath, stringifyYAML(DEFAULT_CONFIG));

  // Write .gitignore for indexes
  writeFileSync(join(root, "indexes", ".gitignore"), "*\n!.gitignore\n");

  return new Substrate(root);
}

/**
 * Open an existing substrate or create a new one.
 */
export function openSubstrate(root: string): Substrate {
  if (!existsSync(join(root, ".aku", "version"))) {
    return initSubstrate(root);
  }
  return new Substrate(root);
}
