/**
 * OMNIMIND Knowledge Substrate
 *
 * Layer 0: Atomic Knowledge Units for intelligence explosion.
 *
 * @example
 * ```typescript
 * import { openSubstrate, IndexManager } from 'omnimind-substrate';
 *
 * const substrate = openSubstrate('~/.omnimind/knowledge');
 * const indexes = new IndexManager(substrate.indexesDir);
 * indexes.init();
 *
 * const hash = await substrate.ingest({
 *   body: '# LSM Tree\n\nA write-optimized storage structure...',
 *   domain: 'data-systems/storage/lsm-tree',
 *   type: 'concept',
 *   tags: ['storage', 'database'],
 * });
 *
 * const aku = await substrate.get(hash);
 * ```
 */

// Core types
export type {
  ContentHash,
  DomainPath,
  ISO8601,
  KnowledgeType,
  Volatility,
  RelationType,
  KnowledgeSource,
  AKULinks,
  AKUMeta,
  AKU,
  AKUInput,
  IngestInput,
  SubstrateConfig,
  IndexConfig,
  AKUFilter,
  SearchResult,
  GraphNode,
  SubstrateStats,
  IntegrityReport,
  // Vector types
  Embedding,
  VectorSearchResult,
  EmbeddingConfig,
  EmbeddingProvider,
} from "./types.js";

// Core operations
export {
  Substrate,
  initSubstrate,
  openSubstrate,
  serializeAKU,
  parseAKU,
} from "./substrate.js";

// Hashing
export {
  computeHash,
  hashString,
  verifyHash,
  canonicalize,
  getShardPath,
  isValidHash,
} from "./hash.js";

// Index layer
export { IndexManager } from "./indexes/index.js";

// Vector search
export {
  VectorIndex,
  MockEmbeddingProvider,
  cosineSimilarity,
  euclideanDistance,
  normalizeVector,
  embeddingToBuffer,
  bufferToEmbedding,
} from "./indexes/vector.js";
