/**
 * OMNIMIND Knowledge Substrate - Core Types
 *
 * Layer 0: The fundamental type system for Atomic Knowledge Units.
 * Designed for decades of evolution without breaking changes.
 */

// === IDENTITY ===

/**
 * Content hash - SHA-256 hex string (64 characters)
 * The immutable identity of an AKU, derived from its canonical content.
 */
export type ContentHash = string;

/**
 * Domain path - hierarchical namespace for knowledge organization
 * Example: "data-systems/storage/lsm-tree"
 */
export type DomainPath = string;

/**
 * ISO 8601 timestamp string
 */
export type ISO8601 = string;

// === KNOWLEDGE TYPES ===

/**
 * The fundamental ontology of knowledge types.
 * Small, stable set - extend via tags, not new types.
 */
export type KnowledgeType =
  | "fact"         // Atomic true statement
  | "concept"      // Abstract idea with definition
  | "relationship" // Connection between concepts
  | "procedure"    // How to do something
  | "insight"      // Pattern or meta-observation
  | "question"     // Open inquiry
  | "artifact"     // Code, diagram, or structured output
  ;

/**
 * Volatility indicates how likely knowledge is to change.
 */
export type Volatility = "stable" | "evolving" | "ephemeral";

/**
 * Relationship types for linking AKUs.
 */
export type RelationType =
  | "relates_to"    // General association
  | "derived_from"  // Source/origin
  | "supersedes"    // Newer version
  | "contradicts"   // Conflicting information
  | "part_of"       // Hierarchical containment
  | "instance_of"   // Type relationship
  | "causes"        // Causal relationship
  | "requires"      // Dependency
  ;

// === SOURCE PROVENANCE ===

/**
 * Where knowledge came from - full provenance tracking.
 */
export interface KnowledgeSource {
  /** How the knowledge was acquired */
  type: "training" | "search" | "conversation" | "inference" | "user" | "import";

  /** URI of the source (URL, file path, etc.) */
  uri?: string;

  /** Session ID if from a conversation */
  session?: string;

  /** When the source was accessed */
  timestamp: ISO8601;

  /** Optional citation/reference */
  citation?: string;
}

// === AKU STRUCTURE ===

/**
 * Links to other AKUs - the edges in the knowledge graph.
 */
export interface AKULinks {
  relates_to?: ContentHash[];
  derived_from?: ContentHash[];
  supersedes?: ContentHash[];
  contradicts?: ContentHash[];
  part_of?: ContentHash[];
  instance_of?: ContentHash[];
  causes?: ContentHash[];
  requires?: ContentHash[];
}

/**
 * AKU Metadata - stored in YAML frontmatter.
 */
export interface AKUMeta {
  // Temporal
  created: ISO8601;
  source: KnowledgeSource;

  // Classification
  domain: DomainPath;
  type: KnowledgeType;

  // Quality
  confidence: number;        // 0.0 - 1.0
  volatility: Volatility;

  // Relationships
  links: AKULinks;

  // Extensible
  tags: string[];
  extra?: Record<string, unknown>;
}

/**
 * The Atomic Knowledge Unit - the fundamental atom of knowledge.
 */
export interface AKU {
  /** Content hash - computed, not stored in file */
  id: ContentHash;

  /** Metadata - stored in YAML frontmatter */
  meta: AKUMeta;

  /** Content - Markdown body */
  body: string;
}

/**
 * Input for creating a new AKU (id is computed).
 */
export interface AKUInput {
  meta: Omit<AKUMeta, 'created'> & { created?: ISO8601 };
  body: string;
}

/**
 * Partial input for ingesting knowledge with defaults.
 */
export interface IngestInput {
  body: string;
  domain: DomainPath;
  type?: KnowledgeType;
  source?: Partial<KnowledgeSource>;
  confidence?: number;
  volatility?: Volatility;
  links?: AKULinks;
  tags?: string[];
  extra?: Record<string, unknown>;
}

// === SUBSTRATE CONFIGURATION ===

/**
 * Index configuration.
 */
export interface IndexConfig {
  vectors: {
    enabled: boolean;
    model?: string;
    dimensions?: number;
  };
  graph: {
    enabled: boolean;
  };
  temporal: {
    enabled: boolean;
  };
  fts: {
    enabled: boolean;
  };
}

/**
 * Substrate configuration.
 */
export interface SubstrateConfig {
  version: number;
  substrate: {
    hash_algorithm: "sha256";
    shard_depth: number;
  };
  indexes: IndexConfig;
  defaults: {
    confidence: number;
    volatility: Volatility;
  };
}

// === QUERY TYPES ===

/**
 * Filter for listing AKUs.
 */
export interface AKUFilter {
  domain?: DomainPath;
  domainPrefix?: DomainPath;
  type?: KnowledgeType;
  tags?: string[];
  since?: ISO8601;
  until?: ISO8601;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

/**
 * Search result with relevance score.
 */
export interface SearchResult {
  hash: ContentHash;
  score: number;
}

/**
 * Graph traversal result.
 */
export interface GraphNode {
  hash: ContentHash;
  depth: number;
  relation?: RelationType;
}

// === SUBSTRATE STATS ===

/**
 * Statistics about the substrate.
 */
export interface SubstrateStats {
  totalAtoms: number;
  byType: Record<KnowledgeType, number>;
  byDomain: Record<string, number>;
  totalLinks: number;
  oldestAtom?: ISO8601;
  newestAtom?: ISO8601;
  diskUsage: number;
}

/**
 * Integrity check result.
 */
export interface IntegrityReport {
  valid: boolean;
  totalChecked: number;
  corrupted: ContentHash[];
  orphanedLinks: Array<{ from: ContentHash; to: ContentHash }>;
  missingAtoms: ContentHash[];
}

// === VECTOR SEARCH TYPES ===

/**
 * A vector embedding - fixed-length array of floats.
 */
export type Embedding = Float32Array;

/**
 * Result from vector similarity search.
 */
export interface VectorSearchResult {
  hash: ContentHash;
  similarity: number;  // Cosine similarity: -1 to 1 (higher = more similar)
  distance: number;    // Euclidean distance (lower = more similar)
}

/**
 * Configuration for embedding generation.
 */
export interface EmbeddingConfig {
  /** The embedding model identifier */
  model: string;
  /** Dimensionality of the embedding vectors */
  dimensions: number;
  /** API endpoint for embedding generation (if using external service) */
  endpoint?: string;
  /** API key for embedding service (if using external service) */
  apiKey?: string;
}

/**
 * Interface for embedding providers - allows plugging in different backends.
 */
export interface EmbeddingProvider {
  /** Generate embedding for a single text */
  embed(text: string): Promise<Embedding>;
  /** Generate embeddings for multiple texts (batch) */
  embedBatch(texts: string[]): Promise<Embedding[]>;
  /** The dimensionality of embeddings this provider produces */
  readonly dimensions: number;
  /** The model identifier */
  readonly model: string;
}
