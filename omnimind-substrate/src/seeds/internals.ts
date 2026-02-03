/**
 * OMNIMIND Knowledge Substrate - Database Internals Seeds
 *
 * Deep technical knowledge about how databases work internally.
 */

import type { IngestInput } from "../types.js";

export const INTERNALS_SEEDS: IngestInput[] = [
  // === Storage Engines ===
  {
    domain: "data-systems/internals/storage/page-layout",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "storage", "pages", "slotted"],
    body: `# Database Page Layout

Pages (typically 4KB-16KB) are the fundamental unit of storage.

## Slotted Page Structure

\`\`\`
┌─────────────────────────────────────────┐
│ Page Header                              │
│ - Page ID, LSN, checksum                 │
│ - Free space pointer                     │
├─────────────────────────────────────────┤
│ Slot Array (grows down) →                │
│ [slot0][slot1][slot2]...                 │
├─────────────────────────────────────────┤
│                                          │
│         Free Space                       │
│                                          │
├─────────────────────────────────────────┤
│ ← Records (grow up)                      │
│ [record2][record1][record0]              │
└─────────────────────────────────────────┘
\`\`\`

## Why Slotted?
- Records can move within page (compaction)
- External references use (page_id, slot_number)
- Variable-length records supported

## Page Types
- **Heap pages**: Unordered record storage
- **Index pages**: B-tree nodes
- **Overflow pages**: Large values (TOAST in Postgres)`,
  },

  {
    domain: "data-systems/internals/storage/buffer-pool",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "buffer-pool", "caching", "memory"],
    body: `# Buffer Pool Management

The buffer pool caches disk pages in memory.

## Core Components
- **Page table**: Hash map of page_id → frame
- **Frame array**: Fixed-size slots holding pages
- **Replacement policy**: Which page to evict

## Replacement Policies

### LRU (Least Recently Used)
Simple but vulnerable to sequential scan pollution.

### Clock (Second Chance)
Approximates LRU with lower overhead.
Each frame has a "reference bit" cleared on sweep.

### LRU-K
Track K most recent accesses per page.
Better handles mixed workloads.

### ARC (Adaptive Replacement Cache)
Self-tuning between recency and frequency.
Used by ZFS, IBM DB2.

## Dirty Page Management
- Track modified pages via dirty bit
- Background flushing (checkpoint, page cleaner)
- Write-ahead logging before flush

## Buffer Pool Sizing
Rule of thumb: As much RAM as possible minus OS needs.
Modern systems: 80% of RAM for database.`,
  },

  {
    domain: "data-systems/internals/storage/wal-internals",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "wal", "durability", "recovery"],
    body: `# Write-Ahead Logging (WAL) Internals

WAL ensures durability: log the change before applying it.

## WAL Record Structure
\`\`\`
┌──────────────────────────────────────┐
│ LSN (Log Sequence Number)            │
│ Transaction ID                       │
│ Previous LSN (for undo chain)        │
│ Record Type (insert/update/delete)   │
│ Page ID                              │
│ Before Image (for undo)              │
│ After Image (for redo)               │
│ Checksum                             │
└──────────────────────────────────────┘
\`\`\`

## The WAL Protocol
1. Write log record to WAL buffer
2. Transaction commits → flush WAL to disk
3. Page flush requires WAL already on disk (WAL rule)

## Checkpointing
Periodic snapshot to limit recovery time:
1. Write CHECKPOINT_START to log
2. Flush all dirty pages
3. Write CHECKPOINT_END with dirty page list
4. Truncate old log segments

## Recovery (ARIES Algorithm)
1. **Analysis**: Scan log to find dirty pages, active transactions
2. **Redo**: Replay all logged changes
3. **Undo**: Roll back uncommitted transactions

## Group Commit
Batch multiple transaction commits into single fsync.
Dramatically improves throughput at slight latency cost.`,
  },

  // === Indexing ===
  {
    domain: "data-systems/internals/indexing/btree-internals",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "b-tree", "indexing"],
    body: `# B+Tree Internals

The B+Tree is the dominant index structure for databases.

## Structure

\`\`\`
         ┌─────────────────┐
         │   [30 | 60]     │  Root (internal)
         └────┬───┬───┬────┘
              │   │   │
    ┌─────────┘   │   └─────────┐
    ▼             ▼             ▼
┌───────┐   ┌───────┐     ┌───────┐
│[10|20]│   │[40|50]│     │[70|80]│  Internal
└─┬──┬─┬┘   └─┬──┬─┬┘     └─┬──┬─┬┘
  │  │ │      │  │ │        │  │ │
  ▼  ▼ ▼      ▼  ▼ ▼        ▼  ▼ ▼
 ┌──┬──┬──┐  ┌──┬──┬──┐   ┌──┬──┬──┐
 │10│20│30│→│40│50│60│→  │70│80│90│  Leaves
 └──┴──┴──┘  └──┴──┴──┘   └──┴──┴──┘
\`\`\`

## Key Properties
- Internal nodes: Only keys (separators)
- Leaf nodes: Keys + values (or row pointers)
- Leaves linked for range scans
- Balanced: All leaves at same depth

## Operations Complexity
- Search: O(log n)
- Insert: O(log n) amortized
- Delete: O(log n) amortized
- Range scan: O(log n + k) where k = results

## Concurrency Control
- **Latch crabbing**: Hold parent latch until child is safe
- **B-link trees**: Right-link pointers for lock-free reads
- **Optimistic locking**: Validate version after traversal`,
  },

  {
    domain: "data-systems/internals/indexing/lsm-internals",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "lsm-tree", "indexing", "write-optimized"],
    body: `# LSM-Tree Internals

Log-Structured Merge-Trees optimize for write-heavy workloads.

## Architecture

\`\`\`
Writes → ┌──────────────┐
         │  MemTable    │  (In-memory, sorted)
         │  (skiplist)  │
         └──────┬───────┘
                │ Flush when full
                ▼
         ┌──────────────┐
         │   Level 0    │  (Overlapping SSTs)
         │  SST files   │
         └──────┬───────┘
                │ Compaction
                ▼
         ┌──────────────┐
         │   Level 1    │  (Non-overlapping)
         │ Larger SSTs  │
         └──────┬───────┘
                │
                ▼
              (...)
\`\`\`

## SSTable (Sorted String Table)
\`\`\`
┌─────────────────────────────────────┐
│ Data Blocks (sorted key-value pairs)│
├─────────────────────────────────────┤
│ Filter Block (Bloom filter)         │
├─────────────────────────────────────┤
│ Index Block (block offsets)         │
├─────────────────────────────────────┤
│ Footer (metadata, magic)            │
└─────────────────────────────────────┘
\`\`\`

## Write Amplification
Ratio of bytes written to storage vs bytes written by user.
Leveled compaction: O(log n) * size_ratio (typically 10-30x)
Tiered compaction: Lower WA but higher space amplification

## Read Path
1. Check MemTable
2. Check immutable MemTables
3. Check L0 (all files, overlapping)
4. Binary search each level (non-overlapping)
5. Bloom filters to skip files`,
  },

  {
    domain: "data-systems/internals/indexing/hash-index",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "hash-index", "indexing"],
    body: `# Hash Indexes

Hash indexes provide O(1) point lookups but no range queries.

## Static Hashing
\`\`\`
key → hash(key) → bucket_number → page(s)
\`\`\`

Problems:
- Fixed number of buckets
- Overflow chains degrade performance
- Resize requires full rebuild

## Extendible Hashing
Dynamic growth without full rebuild.

\`\`\`
Global depth: 2
Directory: [00] → Bucket A
           [01] → Bucket B
           [10] → Bucket C
           [11] → Bucket C  (shared)

Local depths: A=2, B=2, C=1
\`\`\`

On overflow:
1. If local_depth < global_depth: split bucket
2. If local_depth = global_depth: double directory

## Linear Hashing
Gradual, predictable growth.
- Split pointer moves through buckets sequentially
- No directory needed
- Used in Berkeley DB

## Use Cases
- In-memory hash tables (joins)
- Key-value stores
- Not common as primary index (no range support)`,
  },

  // === Query Processing ===
  {
    domain: "data-systems/internals/query/optimizer",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "query-optimizer", "cost-based"],
    body: `# Query Optimization

Transforming SQL into an efficient execution plan.

## Optimization Phases

### 1. Parsing & Validation
SQL → AST → Semantic checks

### 2. Logical Optimization
- Predicate pushdown
- Projection pushdown
- Join reordering
- Subquery unnesting

### 3. Physical Optimization
Choose algorithms:
- Hash join vs merge join vs nested loop
- Index scan vs sequential scan
- Sort vs hash for grouping

## Cost Model Components
\`\`\`
Cost = CPU_cost + IO_cost + Network_cost

Where:
  IO_cost = pages_read * random_io_cost + seq_pages * seq_io_cost
  CPU_cost = rows_processed * cpu_tuple_cost
\`\`\`

## Statistics
- Table cardinality (row count)
- Column statistics (distinct values, histograms)
- Index statistics (height, leaf pages)

## Join Ordering
N tables = N! possible orderings.
- Exhaustive: Small queries (< 10 tables)
- Dynamic programming: Medium queries
- Greedy/heuristic: Large queries

## Plan Caching
Cache compiled plans, but beware of parameter sniffing.`,
  },

  {
    domain: "data-systems/internals/query/join-algorithms",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "joins", "algorithms"],
    body: `# Join Algorithms

The three fundamental join implementations.

## Nested Loop Join
\`\`\`python
for row_r in R:
    for row_s in S:
        if matches(row_r, row_s):
            emit(row_r, row_s)
\`\`\`
- Cost: O(|R| × |S|)
- Best for: Small tables, indexed inner table
- Index nested loop: O(|R| × log|S|)

## Hash Join
\`\`\`python
# Build phase
hash_table = {}
for row_r in R:  # Build side (smaller)
    hash_table[row_r.key].append(row_r)

# Probe phase
for row_s in S:  # Probe side (larger)
    for row_r in hash_table[row_s.key]:
        emit(row_r, row_s)
\`\`\`
- Cost: O(|R| + |S|)
- Memory: O(|R|) for hash table
- Grace hash join for memory overflow

## Sort-Merge Join
\`\`\`python
# Sort both inputs
R_sorted = sort(R, key)
S_sorted = sort(S, key)

# Merge
for row_r, row_s in merge(R_sorted, S_sorted):
    if row_r.key == row_s.key:
        emit(row_r, row_s)
\`\`\`
- Cost: O(|R|log|R| + |S|log|S| + |R| + |S|)
- Best for: Already sorted inputs, range joins
- Can exploit index order

## Choosing Algorithm
| Condition | Best Choice |
|-----------|-------------|
| Small inner, index | Index nested loop |
| Memory fits build | Hash join |
| Inputs pre-sorted | Sort-merge |
| Inequality join | Nested loop |`,
  },

  {
    domain: "data-systems/internals/query/execution-models",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "execution", "volcano", "vectorized"],
    body: `# Query Execution Models

How query plans are actually executed.

## Volcano (Iterator) Model
Each operator implements: open(), next(), close()

\`\`\`
         Project
            │
           next()
            │
            ▼
          Filter
            │
           next()
            │
            ▼
        TableScan
\`\`\`

- One tuple at a time
- Simple, composable
- High interpretation overhead
- Used by: PostgreSQL, MySQL

## Materialization Model
Each operator produces full result before passing up.

- Better for OLAP (batch processing)
- Higher memory usage
- Easier parallelization

## Vectorized Execution
Process batches (vectors) of 1000+ values.

\`\`\`
┌────────────────────────┐
│ Vector of 1024 values  │
│ [v1, v2, ..., v1024]   │
└────────────────────────┘
         │
    SIMD operations
         │
         ▼
┌────────────────────────┐
│ Result vector          │
└────────────────────────┘
\`\`\`

Benefits:
- CPU cache efficiency
- SIMD parallelism
- Reduced interpretation overhead
- Used by: DuckDB, ClickHouse, Databricks

## Code Generation (JIT)
Compile query plan to native code.
- Eliminate virtual function calls
- Inline operations
- Used by: Spark (Tungsten), PostgreSQL (JIT)`,
  },

  // === Concurrency Control ===
  {
    domain: "data-systems/internals/concurrency/mvcc",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "mvcc", "concurrency", "isolation"],
    body: `# Multi-Version Concurrency Control (MVCC)

MVCC allows readers and writers to not block each other.

## Core Idea
Keep multiple versions of each row.
Each transaction sees a consistent snapshot.

## Version Storage Approaches

### Append-Only (PostgreSQL)
\`\`\`
┌────────┬────────┬────────┐
│ V1     │ V2     │ V3     │
│ xmin=1 │ xmin=5 │ xmin=10│
│ xmax=5 │ xmax=10│ xmax=∞ │
└────────┴────────┴────────┘
\`\`\`
All versions in main table. VACUUM cleans old versions.

### Delta Storage (MySQL/InnoDB)
\`\`\`
Main Table        Undo Log
┌────────┐       ┌────────┐
│ Latest │ ────→ │ Delta  │ ────→ [older versions]
│ Version│       │  V2→V3 │
└────────┘       └────────┘
\`\`\`
Main table has latest; undo log has deltas.

### Time-Travel (Temporal)
Keep all versions permanently for historical queries.

## Visibility Rules
Transaction T sees row R if:
1. R.xmin < T.snapshot (row created before snapshot)
2. R.xmin committed
3. R.xmax > T.snapshot OR R.xmax not committed

## Garbage Collection
- Versions not visible to any active transaction
- Background vacuum process
- Can cause bloat if neglected`,
  },

  {
    domain: "data-systems/internals/concurrency/2pl",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "2pl", "locking", "concurrency"],
    body: `# Two-Phase Locking (2PL)

Traditional pessimistic concurrency control.

## The Two Phases
1. **Growing phase**: Acquire locks, never release
2. **Shrinking phase**: Release locks, never acquire

\`\`\`
Locks held
    │    ╱╲
    │   ╱  ╲
    │  ╱    ╲
    │ ╱      ╲
    │╱        ╲
    └──────────────→ time
      Growing  Shrinking
\`\`\`

## Lock Types
- **Shared (S)**: For reads, multiple allowed
- **Exclusive (X)**: For writes, single holder

Compatibility:
\`\`\`
     │ S │ X │
─────┼───┼───┤
  S  │ ✓ │ ✗ │
  X  │ ✗ │ ✗ │
\`\`\`

## Lock Granularity
- Row-level: High concurrency, high overhead
- Page-level: Medium
- Table-level: Low concurrency, low overhead

## Intention Locks
Hierarchical locking: IS, IX, SIX
Signal intent to lock at finer granularity.

## Strict 2PL
Hold all locks until transaction commits.
Prevents cascading aborts.

## Deadlock Handling
- Detection: Wait-for graph cycles
- Prevention: Wait-die, wound-wait schemes
- Timeout: Abort after waiting too long`,
  },

  {
    domain: "data-systems/internals/concurrency/isolation-levels",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "isolation", "anomalies", "concurrency"],
    body: `# Isolation Levels

Trade-offs between consistency and performance.

## Anomalies Prevented

| Level | Dirty Read | Non-Repeatable | Phantom |
|-------|------------|----------------|---------|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Possible |
| SERIALIZABLE | Prevented | Prevented | Prevented |

## Anomaly Definitions

### Dirty Read
Read uncommitted data that may be rolled back.

### Non-Repeatable Read
Same query returns different results within transaction.

### Phantom Read
New rows appear matching previous query's predicate.

### Write Skew
Two transactions read same data, write different rows,
violating constraint that spans both rows.

## Implementation Approaches

### Read Committed (PostgreSQL)
- Take new snapshot for each statement
- Simple, default for many databases

### Snapshot Isolation
- Single snapshot for entire transaction
- Prevents most anomalies
- Write-write conflict detection

### Serializable
- 2PL with predicate locking, OR
- SSI (Serializable Snapshot Isolation)

## SSI (PostgreSQL 9.1+)
Optimistic: Run at snapshot isolation, detect conflicts.
Track rw-dependencies, detect dangerous structures.`,
  },

  // === Distributed Systems ===
  {
    domain: "data-systems/internals/distributed/consensus",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "consensus", "paxos", "raft"],
    body: `# Consensus Algorithms

Agreement in distributed systems despite failures.

## The Problem
N nodes must agree on a value.
Some nodes may fail (crash or Byzantine).

## Paxos (Lamport, 1989)
Three roles: Proposer, Acceptor, Learner

### Phase 1: Prepare
1. Proposer sends Prepare(n) to acceptors
2. Acceptor responds with highest accepted proposal

### Phase 2: Accept
1. Proposer sends Accept(n, v) with chosen value
2. Acceptor accepts if n ≥ highest seen
3. Value chosen when majority accepts

### Properties
- Safety: Only one value chosen
- Liveness: Eventually makes progress (with stable leader)

## Raft (2014) - "Understandable Paxos"
Decomposed into:
1. Leader election
2. Log replication
3. Safety

### Leader Election
- Random election timeouts
- Candidate requests votes
- Majority wins term

### Log Replication
\`\`\`
Leader: [1][2][3][4][5] → AppendEntries
                              ↓
Follower: [1][2][3] → [1][2][3][4][5]
\`\`\`

Committed when replicated to majority.

## Modern Variants
- Multi-Paxos: Stable leader optimization
- EPaxos: Leaderless, geo-distributed
- Viewstamped Replication: Similar to Raft`,
  },

  {
    domain: "data-systems/internals/distributed/partitioning",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["internals", "partitioning", "sharding", "distributed"],
    body: `# Data Partitioning (Sharding)

Distributing data across multiple nodes.

## Partitioning Strategies

### Range Partitioning
\`\`\`
Node A: [A-M]
Node B: [N-Z]
\`\`\`
- Good for range queries
- Risk of hot spots (e.g., recent dates)

### Hash Partitioning
\`\`\`
partition = hash(key) % num_partitions
\`\`\`
- Even distribution
- Loses range query locality

### Consistent Hashing
\`\`\`
        Node A
          │
    ┌─────┼─────┐
    │     │     │
  ──●─────●─────●──  Ring
    │     │     │
    │  Node B   │
  Node C     Node D
\`\`\`
- Keys mapped to ring
- Each node owns arc
- Adding/removing node only affects neighbors

## Virtual Nodes
Each physical node owns multiple positions on ring.
- Better load balancing
- Heterogeneous hardware support

## Rebalancing
- Fixed partitions: Move whole partitions
- Dynamic: Split/merge based on size
- Proportional: Partitions per node

## Secondary Indexes
- Local index: Each partition indexes its data
- Global index: Partitioned separately from data

## Cross-Partition Queries
- Scatter-gather: Query all partitions
- Routing: Know which partition to query`,
  },
];

export function getInternalsSeeds(): IngestInput[] {
  return INTERNALS_SEEDS;
}
