/**
 * OMNIMIND Knowledge Substrate - Data Systems Seed
 *
 * The initial knowledge from the Data Systems Intelligence Explosion.
 * This seeds Layer 0 with comprehensive data systems expertise.
 */

import type { IngestInput } from "../types.js";

export const DATA_SYSTEMS_SEEDS: IngestInput[] = [
  // ============================================================
  // FOUNDATIONAL CONCEPTS
  // ============================================================

  {
    domain: "data-systems/foundations/cap-theorem",
    type: "concept",
    confidence: 0.99,
    volatility: "stable",
    tags: ["distributed-systems", "theorem", "trade-off", "fundamental"],
    source: {
      type: "search",
      uri: "https://en.wikipedia.org/wiki/CAP_theorem",
      timestamp: new Date().toISOString(),
    },
    body: `# CAP Theorem

Proposed by Eric Brewer (2000), proven by Gilbert & Lynch (2002).

## Statement

A distributed data store can provide at most **two of three** guarantees simultaneously:

- **Consistency (C)**: Every read receives the most recent write or an error
- **Availability (A)**: Every request receives a non-error response (without guarantee of most recent data)
- **Partition Tolerance (P)**: The system continues to operate despite network partitions

## Practical Implication

Since network partitions are inevitable in distributed systems, the real choice is between:
- **CP systems**: Sacrifice availability during partitions (e.g., HBase, MongoDB default)
- **AP systems**: Sacrifice consistency during partitions (e.g., Cassandra, DynamoDB)

## Extension: PACELC

Daniel Abadi extended CAP to PACELC:
- If **P**artition: choose **A**vailability or **C**onsistency
- **E**lse (normal operation): choose **L**atency or **C**onsistency

This captures the latency/consistency trade-off that exists even without partitions.

## Sources
- Brewer, E. (2000). "Towards Robust Distributed Systems" (PODC keynote)
- Gilbert & Lynch (2002). "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services"
`,
  },

  {
    domain: "data-systems/foundations/acid",
    type: "concept",
    confidence: 0.99,
    volatility: "stable",
    tags: ["transactions", "database", "fundamental", "consistency"],
    body: `# ACID Properties

The fundamental guarantees for database transactions.

## Properties

- **Atomicity**: Transactions are all-or-nothing. If any part fails, the entire transaction rolls back.
- **Consistency**: Transactions bring the database from one valid state to another, maintaining all defined rules.
- **Isolation**: Concurrent transactions don't interfere with each other.
- **Durability**: Once committed, transactions survive system failures.

## Isolation Levels

From weakest to strongest:
1. **Read Uncommitted**: Can see uncommitted changes (dirty reads)
2. **Read Committed**: Only sees committed data (default in PostgreSQL, Oracle)
3. **Repeatable Read**: Same query returns same results within transaction (default in MySQL)
4. **Serializable**: Transactions execute as if serial (strongest, slowest)

## Implementation Mechanisms

- **Locking**: 2PL (Two-Phase Locking)
- **MVCC**: Multi-Version Concurrency Control (PostgreSQL, MySQL InnoDB)
- **SSI**: Serializable Snapshot Isolation
`,
  },

  {
    domain: "data-systems/foundations/base",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["distributed-systems", "nosql", "eventual-consistency"],
    body: `# BASE Properties

The alternative to ACID for distributed systems prioritizing availability.

## Properties

- **Basically Available**: System guarantees availability (possibly degraded)
- **Soft state**: State may change over time even without input
- **Eventual consistency**: System will become consistent given enough time

## Trade-off

BASE trades immediate consistency for:
- Higher availability
- Lower latency
- Better partition tolerance
- Horizontal scalability

## Use Cases

Appropriate when:
- Stale reads are acceptable (social media feeds)
- High availability is critical (e-commerce carts)
- Global distribution required (CDN caches)
- Write throughput is paramount (logging, metrics)
`,
  },

  // ============================================================
  // STORAGE ENGINES
  // ============================================================

  {
    domain: "data-systems/storage/b-tree",
    type: "concept",
    confidence: 0.98,
    volatility: "stable",
    tags: ["storage-engine", "read-optimized", "index", "fundamental"],
    body: `# B-Tree / B+Tree

The dominant index structure for read-heavy database workloads.

## Structure

- Balanced tree with high branching factor (100-1000 children per node)
- All data in leaf nodes (B+Tree), internal nodes only store keys
- Nodes typically match disk page size (4KB-16KB)

## Properties

| Metric | Value |
|--------|-------|
| Read Complexity | O(log n) |
| Write Complexity | O(log n) |
| Write Amplification | Low (2-3x) |
| Read Amplification | Low |
| Space Amplification | ~50% (page fill factor) |

## Trade-offs

**Advantages**:
- Fast point lookups
- Efficient range scans
- Predictable performance
- In-place updates

**Disadvantages**:
- Random I/O for writes
- Page splits can cause fragmentation
- Write-heavy workloads suffer

## Implementations

- PostgreSQL (default index)
- MySQL InnoDB
- SQLite
- Oracle
- SQL Server
`,
  },

  {
    domain: "data-systems/storage/lsm-tree",
    type: "concept",
    confidence: 0.98,
    volatility: "stable",
    tags: ["storage-engine", "write-optimized", "compaction"],
    body: `# LSM-Tree (Log-Structured Merge-Tree)

Storage structure optimizing write throughput via sequential I/O.

## Structure

1. **MemTable**: In-memory sorted structure (skiplist/red-black tree)
2. **SSTables**: Immutable sorted string tables on disk
3. **Levels**: SSTables organized in levels with increasing size

## Write Path

1. Write to WAL (write-ahead log) for durability
2. Insert into MemTable
3. When MemTable full, flush to L0 SSTable
4. Background compaction merges levels

## Properties

| Metric | Value |
|--------|-------|
| Write Amplification | High (10-30x from compaction) |
| Read Amplification | High (check multiple levels) |
| Space Amplification | Low |
| Write Throughput | Excellent (sequential) |
| Read Latency | Higher (multiple lookups) |

## Optimizations

- **Bloom filters**: Skip SSTables without key
- **Block cache**: Cache hot SSTable blocks
- **Leveled compaction**: Limit space amplification
- **FIFO compaction**: For time-series data

## Implementations

- LevelDB (Google)
- RocksDB (Facebook)
- Cassandra
- HBase
- ScyllaDB
`,
  },

  {
    domain: "data-systems/storage/columnar",
    type: "concept",
    confidence: 0.97,
    volatility: "stable",
    tags: ["storage-engine", "olap", "analytics", "compression"],
    body: `# Columnar Storage

Storage format optimized for analytical queries.

## Structure

Instead of storing rows together, stores columns together:
- Row store: [row1_all_cols][row2_all_cols]...
- Column store: [col1_all_rows][col2_all_rows]...

## Advantages

1. **Compression**: Similar values compress well (dictionary encoding, RLE)
2. **Vectorization**: SIMD operations on column batches
3. **Projection**: Only read needed columns
4. **Aggregation**: Sum/avg/count on single column is fast

## Compression Techniques

- **Dictionary encoding**: Replace values with integer codes
- **Run-length encoding (RLE)**: Compress repeated values
- **Bit-packing**: Use minimum bits for integers
- **Delta encoding**: Store differences

## Properties

| Operation | Performance |
|-----------|-------------|
| Full table scan | Excellent |
| Aggregations | Excellent |
| Point lookups | Poor |
| Row insertions | Poor |
| Updates | Very Poor |

## File Formats

- **Parquet**: Hadoop ecosystem standard
- **ORC**: Optimized Row Columnar (Hive)
- **Arrow**: In-memory columnar format

## Implementations

- ClickHouse
- DuckDB
- BigQuery
- Redshift
- Snowflake
`,
  },

  // ============================================================
  // DATABASE CATEGORIES
  // ============================================================

  {
    domain: "data-systems/categories/oltp",
    type: "concept",
    confidence: 0.98,
    volatility: "stable",
    tags: ["category", "transactional", "operational"],
    body: `# OLTP Databases

Online Transaction Processing - operational databases for day-to-day transactions.

## Characteristics

- High concurrency (1000s of concurrent users)
- Short transactions (milliseconds)
- Point queries and small updates
- Row-oriented storage
- Strong consistency (ACID)

## Workload Pattern

- Many small read/write operations
- Low latency requirements (<10ms)
- High availability critical
- Data normalized (3NF)

## Top Systems (2026)

| Rank | Database | Score | Notes |
|------|----------|-------|-------|
| 1 | Oracle | 1237 | Enterprise standard |
| 2 | MySQL | 868 | Web applications |
| 4 | PostgreSQL | 666 | Developer favorite |
| 12 | SQLite | 101 | Embedded |

## Selection Criteria

Choose based on:
- Scale requirements
- Consistency needs
- Ecosystem/tooling
- Operational expertise
`,
  },

  {
    domain: "data-systems/categories/olap",
    type: "concept",
    confidence: 0.97,
    volatility: "stable",
    tags: ["category", "analytical", "data-warehouse"],
    body: `# OLAP Databases

Online Analytical Processing - databases optimized for complex analytical queries.

## Characteristics

- Complex queries (joins, aggregations)
- Large data scans (GB to TB per query)
- Columnar storage
- Read-heavy workloads
- Eventual consistency acceptable

## Workload Pattern

- Few complex queries
- Higher latency acceptable (seconds to minutes)
- Batch updates common
- Data denormalized (star/snowflake schema)

## Top Systems

| System | Type | Best For |
|--------|------|----------|
| Snowflake | Cloud DW | General analytics |
| BigQuery | Cloud DW | Serverless analytics |
| ClickHouse | Column store | Real-time analytics |
| DuckDB | Embedded | Local analytics |
| Redshift | Cloud DW | AWS ecosystem |

## Modern Trends

- Lakehouse architecture (Delta Lake, Iceberg)
- Separation of storage and compute
- Serverless/elastic scaling
`,
  },

  {
    domain: "data-systems/categories/htap",
    type: "concept",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["category", "hybrid", "real-time"],
    body: `# HTAP Databases

Hybrid Transactional/Analytical Processing - single system for both workloads.

## Promise

Eliminate ETL latency by running analytics on operational data.

## Architecture Approaches

1. **TiDB**: Separate row store (TiKV) and column store (TiFlash)
2. **SingleStore**: Unified rowstore + columnstore in one engine
3. **CockroachDB**: Row-store with analytical optimizations

## Benefits

- Real-time analytics on fresh data
- Reduced data pipeline complexity
- Single source of truth
- Lower total cost

## Challenges

- Resource contention
- Query optimization complexity
- Neither workload fully optimized

## Market Outlook

HTAP market growing at 25-30% CAGR through 2030.
`,
  },

  // ============================================================
  // SPECIFIC SYSTEMS
  // ============================================================

  {
    domain: "data-systems/systems/postgresql",
    type: "artifact",
    confidence: 0.98,
    volatility: "stable",
    tags: ["database", "relational", "open-source", "extensible"],
    body: `# PostgreSQL

The world's most advanced open-source relational database.

## History

- 1986: POSTGRES project at UC Berkeley (Stonebraker)
- 1996: Renamed PostgreSQL with SQL support
- 2026: Dominant open-source RDBMS

## Architecture

- **Process per connection** model
- **MVCC** for concurrency (tuple versioning)
- **WAL** for durability
- **Buffer pool** with clock-sweep eviction
- **Cost-based query optimizer**

## Key Features

- Full ACID compliance
- Rich SQL support (CTEs, window functions)
- Extensibility (custom types, operators, indexes)
- JSON/JSONB support
- Foreign data wrappers
- Logical replication

## Extensions Ecosystem

- **PostGIS**: Geospatial
- **TimescaleDB**: Time-series
- **pgvector**: Vector similarity search
- **Citus**: Distributed PostgreSQL
- **pg_stat_statements**: Query analysis

## When to Choose

✓ Complex queries and joins
✓ Data integrity critical
✓ Extensibility needed
✓ Standard SQL compliance
✗ Extreme write throughput
✗ Global distribution (native)
`,
  },

  {
    domain: "data-systems/systems/clickhouse",
    type: "artifact",
    confidence: 0.96,
    volatility: "stable",
    tags: ["database", "olap", "columnar", "analytics"],
    body: `# ClickHouse

Column-oriented OLAP database for real-time analytics.

## History

- Developed at Yandex for Metrica (web analytics)
- Open-sourced in 2016
- ClickHouse Inc. founded 2021

## Architecture

- **Columnar storage** with compression
- **MergeTree** engine family
- **Vectorized query execution**
- **Distributed query processing**

## Key Features

- Exceptional query performance (billions of rows/second)
- Real-time data ingestion
- Approximate query processing
- SQL-like query language
- Materialized views

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Compression | 10-50x |
| Scan speed | 1B+ rows/sec |
| Insert speed | 100K+ rows/sec/core |

## When to Choose

✓ Real-time analytics dashboards
✓ Log/event analytics
✓ Time-series at scale
✓ High ingestion rates
✗ Point lookups
✗ Frequent updates/deletes
✗ Transactions
`,
  },

  {
    domain: "data-systems/systems/kafka",
    type: "artifact",
    confidence: 0.97,
    volatility: "stable",
    tags: ["streaming", "messaging", "event-sourcing"],
    body: `# Apache Kafka

Distributed event streaming platform.

## History

- Developed at LinkedIn (2010-2011)
- Open-sourced 2011
- Apache top-level project 2012
- Confluent founded 2014

## Architecture

- **Distributed commit log**
- **Topics** divided into **partitions**
- **Consumer groups** for parallel processing
- **ZooKeeper** (legacy) or **KRaft** for coordination

## Key Concepts

- **Producers**: Publish messages to topics
- **Consumers**: Subscribe to topics
- **Brokers**: Store and serve data
- **Partitions**: Unit of parallelism
- **Offsets**: Position in partition

## Guarantees

- At-least-once delivery (default)
- Exactly-once semantics (with transactions)
- Ordering within partition
- Configurable durability

## Ecosystem

- **Kafka Streams**: Stream processing library
- **Kafka Connect**: Integration framework
- **Schema Registry**: Schema management
- **KSQL**: SQL interface

## When to Choose

✓ Event sourcing backbone
✓ High-throughput messaging
✓ Decoupling microservices
✓ Log aggregation
✗ Request-reply patterns
✗ Complex routing logic
`,
  },

  // ============================================================
  // DISTRIBUTED SYSTEMS
  // ============================================================

  {
    domain: "data-systems/distributed/consensus",
    type: "concept",
    confidence: 0.97,
    volatility: "stable",
    tags: ["distributed-systems", "raft", "paxos", "replication"],
    body: `# Distributed Consensus

Algorithms for agreement in distributed systems.

## The Problem

Get N nodes to agree on a value despite:
- Node failures
- Network partitions
- Message delays

## Paxos

- Lamport's classic algorithm (1989)
- Notoriously difficult to understand
- Single-decree and Multi-Paxos variants
- Used in: Google Chubby, Spanner

## Raft

- Designed for understandability (2014)
- Equivalent safety to Paxos
- Clear leader election, log replication
- Used in: etcd, CockroachDB, TiDB

## Raft Components

1. **Leader Election**: One leader per term
2. **Log Replication**: Leader replicates to followers
3. **Safety**: Committed entries never lost

## Comparison

| Aspect | Paxos | Raft |
|--------|-------|------|
| Understandability | Hard | Easy |
| Leader | Optional | Required |
| Adoption | Older systems | Modern systems |
| Performance | Similar | Similar |
`,
  },

  {
    domain: "data-systems/distributed/sharding",
    type: "concept",
    confidence: 0.96,
    volatility: "stable",
    tags: ["distributed-systems", "partitioning", "scalability"],
    body: `# Database Sharding

Horizontal partitioning of data across multiple nodes.

## Strategies

### 1. Range Partitioning
- Divide by key ranges (e.g., A-M, N-Z)
- Good for range queries
- Risk of hotspots

### 2. Hash Partitioning
- Hash key to determine shard
- Even distribution
- No range query support

### 3. Consistent Hashing
- Hash ring with virtual nodes
- Minimal redistribution on changes
- Used by Cassandra, DynamoDB

### 4. Directory-Based
- Lookup service maps keys to shards
- Most flexible
- Single point of failure risk

## Challenges

- Cross-shard queries
- Distributed transactions
- Rebalancing overhead
- Operational complexity

## Best Practices

- Choose shard key carefully
- Avoid cross-shard operations
- Plan for growth
- Automate rebalancing
`,
  },

  // ============================================================
  // MODERN ARCHITECTURE
  // ============================================================

  {
    domain: "data-systems/architecture/lakehouse",
    type: "concept",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["architecture", "data-lake", "data-warehouse"],
    body: `# Lakehouse Architecture

Combines data lake flexibility with data warehouse reliability.

## Core Idea

- Store data in open formats on object storage (S3, GCS)
- Add transaction layer via table formats
- Query with any engine

## Table Formats

### Apache Iceberg (Netflix)
- Engine-agnostic
- Partition evolution
- Hidden partitioning

### Delta Lake (Databricks)
- Spark-native
- Time travel
- ACID transactions

### Apache Hudi (Uber)
- Incremental processing
- Change data capture
- Record-level updates

## Benefits

- Single copy of data
- Open formats (no vendor lock-in)
- Cost-effective storage
- Schema evolution
- Time travel

## Architecture Pattern

\`\`\`
Object Storage (S3/GCS/ADLS)
        ↓
Table Format (Iceberg/Delta/Hudi)
        ↓
Query Engines (Spark/Trino/Flink/DuckDB)
        ↓
BI Tools / Applications
\`\`\`
`,
  },

  {
    domain: "data-systems/architecture/data-mesh",
    type: "concept",
    confidence: 0.90,
    volatility: "evolving",
    tags: ["architecture", "organizational", "decentralized"],
    body: `# Data Mesh

Decentralized sociotechnical approach to analytical data.

## Origin

Coined by Zhamak Dehghani (2019) at ThoughtWorks.

## Four Principles

### 1. Domain-Oriented Ownership
- Data owned by business domains
- Domain teams responsible for data quality
- Decentralized architecture

### 2. Data as a Product
- Discoverable and addressable
- Self-describing (schema, semantics)
- Trustworthy and secure

### 3. Self-Serve Data Platform
- Abstract infrastructure complexity
- Enable autonomous domain teams
- Provide building blocks

### 4. Federated Computational Governance
- Global standards, local autonomy
- Automated policy enforcement
- Interoperability by design

## When to Use

✓ Large organizations with many domains
✓ Bottlenecked central data teams
✓ Mature data culture
✗ Small organizations
✗ Limited data engineering capacity
`,
  },

  // ============================================================
  // VECTOR DATABASES
  // ============================================================

  {
    domain: "data-systems/categories/vector-databases",
    type: "concept",
    confidence: 0.93,
    volatility: "evolving",
    tags: ["ai", "embeddings", "similarity-search", "llm"],
    body: `# Vector Databases

Databases optimized for similarity search on embeddings.

## Core Concept

Store and query high-dimensional vectors (embeddings) from:
- Text (LLM embeddings)
- Images (CNN features)
- Audio/video
- Structured data

## Use Cases

- **RAG**: Retrieval-Augmented Generation for LLMs
- **Semantic search**: Find similar meaning
- **Recommendation**: Similar items/users
- **Anomaly detection**: Unusual patterns

## Key Systems (2026)

| System | Type | Best For |
|--------|------|----------|
| Pinecone | Managed | Quick deployment |
| Milvus | Open-source | Billion-scale |
| Weaviate | Hybrid | RAG + keywords |
| Qdrant | Open-source | Rust performance |
| pgvector | Extension | Existing Postgres |

## Index Types

- **HNSW**: Hierarchical Navigable Small World (most common)
- **IVF**: Inverted file index
- **PQ**: Product quantization (compression)

## Selection Criteria

- Scale (millions vs billions of vectors)
- Managed vs self-hosted
- Hybrid search needs
- Existing infrastructure
`,
  },

  // ============================================================
  // HISTORICAL MILESTONES
  // ============================================================

  {
    domain: "data-systems/history/timeline",
    type: "artifact",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "timeline", "overview"],
    body: `# Data Systems Historical Timeline

## 1960s: The Hierarchical Era
- 1961: IDS (Charles Bachman) - first DBMS
- 1966: IMS (IBM) - hierarchical model
- 1969: CODASYL - network model standard

## 1970s: The Relational Revolution
- **1970**: Edgar Codd's relational model paper
- 1973: System R (IBM) - first RDBMS prototype
- 1974: INGRES (Berkeley)
- 1976: SQL language developed

## 1980s: Commercial Growth
- 1979: Oracle - first commercial RDBMS
- 1983: DB2 (IBM)
- 1986: ANSI SQL standard
- 1986: PostgreSQL project begins

## 1990s: Web Era
- 1995: MySQL released
- 1996: PostgreSQL renamed
- 1996: SQL Server (Microsoft)
- Data warehousing emerges (Teradata)

## 2000s: Distributed Systems
- 2003: GFS paper (Google)
- 2004: MapReduce paper (Google)
- 2006: Bigtable paper (Google)
- 2006: Hadoop created
- 2007: Dynamo paper (Amazon)

## 2010s: NoSQL & NewSQL
- 2009: MongoDB, Redis released
- 2011: Kafka open-sourced
- 2012: Spanner paper (Google)
- 2014: Spark gains dominance
- 2016: dbt created

## 2020s: Lakehouse & AI
- 2020: Lakehouse architecture popularized
- 2020: Delta Lake, Iceberg mature
- 2023: Vector database explosion (LLM era)
- 2026: HTAP and real-time everything
`,
  },

  {
    domain: "data-systems/history/codd-1970",
    type: "insight",
    confidence: 0.99,
    volatility: "stable",
    tags: ["history", "foundational", "relational-model"],
    body: `# Codd's 1970 Paper: The Most Important Database Paper

"A Relational Model of Data for Large Shared Data Banks" - Edgar F. Codd

## Key Innovation

**Data Independence**: Separate logical structure from physical storage.

Before Codd:
- Programs navigated physical storage structures
- Changing storage meant rewriting programs
- Data tightly coupled to access methods

After Codd:
- Users work with logical tables
- Physical storage can change freely
- Query optimizer handles access paths

## Core Concepts Introduced

1. **Relations** (tables)
2. **Tuples** (rows)
3. **Attributes** (columns)
4. **Primary keys**
5. **Foreign keys**
6. **Normalization**

## Mathematical Foundation

Based on:
- Set theory
- First-order predicate logic
- Relational algebra

## Impact

- Won Turing Award (1981)
- Foundation of all RDBMS
- SQL derived from relational model
- Still dominant paradigm 55+ years later

## Original Quote

"Future users of large data banks must be protected from having to know how the data is organized in the machine."
`,
  },

  // ============================================================
  // META: GENESIS ATOM
  // ============================================================

  {
    domain: "omnimind/substrate/genesis",
    type: "artifact",
    confidence: 1.0,
    volatility: "stable",
    tags: ["meta", "bootstrap", "layer-0"],
    body: `# OMNIMIND Knowledge Substrate: Genesis

This atom marks the birth of the knowledge substrate.

## Creation

- Date: 2026-01-09
- Session: Data Systems Intelligence Explosion
- Purpose: Layer 0 of infinite knowledge growth

## Design Principles

1. **Append-only**: Knowledge accumulates, never deletes
2. **Content-addressed**: Identity from content, not location
3. **Human-readable**: Markdown at rest, always inspectable
4. **Index-derived**: All indexes rebuild from atoms
5. **Relationship-native**: Links are first-class

## Initial Seeding

Seeded with comprehensive data systems knowledge:
- 66 years of database evolution (1960-2026)
- 100+ systems analyzed
- Foundational concepts and trade-offs
- Modern architectures (lakehouse, data mesh, vector DBs)

## Growth Model

\`\`\`
Layer 0: Atomic Knowledge Units (this)
Layer 1: Indexes and query engines
Layer 2: Inference and synthesis
Layer 3: Agent memory
Layer N: Emergent intelligence
\`\`\`

*The substrate is alive. Feed it knowledge. Watch it grow.*
`,
  },
];

/**
 * Get all data systems seed atoms.
 */
export function getDataSystemsSeeds(): IngestInput[] {
  return DATA_SYSTEMS_SEEDS;
}
