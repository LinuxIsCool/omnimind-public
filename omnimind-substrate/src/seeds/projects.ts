/**
 * OMNIMIND Knowledge Substrate - Notable Data Systems Projects
 *
 * Open source projects that shaped modern data infrastructure.
 */

import type { IngestInput } from "../types.js";

export const PROJECTS_SEEDS: IngestInput[] = [
  // === Relational Databases ===
  {
    domain: "data-systems/projects/postgresql",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "rdbms", "postgresql", "open-source"],
    body: `# PostgreSQL

The world's most advanced open source relational database.

## Key Features
- **Extensibility**: Custom types, operators, indexes, languages
- **Standards compliance**: Most complete SQL implementation
- **MVCC**: Non-blocking reads, snapshot isolation
- **Reliability**: ACID, point-in-time recovery, replication

## Notable Extensions
- PostGIS (geospatial)
- TimescaleDB (time-series)
- Citus (distributed)
- pgvector (vector similarity)

## Architecture
- Process-per-connection model
- Shared buffer pool
- WAL-based durability
- VACUUM for MVCC cleanup

## Governance
- PostgreSQL Global Development Group
- Major releases annually
- 5-year support cycle

## Stats (2024)
- 35+ years of development
- Millions of deployments
- #1 developer-loved database (Stack Overflow)

GitHub: https://github.com/postgres/postgres`,
  },

  {
    domain: "data-systems/projects/sqlite",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "embedded", "sqlite", "ubiquitous"],
    body: `# SQLite

The most deployed database engine in the world.

## Design Philosophy
- Serverless (in-process library)
- Zero-configuration
- Single file storage
- Cross-platform

## Where It's Used
- Every smartphone (iOS, Android)
- Every web browser
- Skype, iTunes, Dropbox
- Embedded systems
- Application file formats

## Technical Highlights
- ~150,000 lines of C
- 100% branch test coverage
- 711x more tests than code
- Public domain (no license)

## Concurrency Model
- Single writer, multiple readers
- WAL mode for better concurrency
- Serializable by default

## Performance
- 35% faster than filesystem for blobs < 100KB
- 50,000+ SELECT/sec on modest hardware

## Limitations
- No network access (by design)
- Limited to ~281 TB (theoretical)
- No user management

GitHub: https://github.com/sqlite/sqlite`,
  },

  {
    domain: "data-systems/projects/duckdb",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "analytics", "duckdb", "embedded", "olap"],
    body: `# DuckDB

"SQLite for analytics" - embedded OLAP database.

## Design Goals
- In-process analytical SQL
- No external dependencies
- Columnar storage
- Vectorized execution

## Key Features
- Runs on laptop, processes TB-scale data
- Direct query: Parquet, CSV, JSON, Pandas
- Zero-copy integration with Arrow
- Parallel query execution

## Use Cases
- Data science notebooks
- ETL pipelines
- Command-line data processing
- Embedded analytics

## Technical Architecture
- Vectorized push-based execution
- Parallel hash joins
- Adaptive string compression
- Morsel-driven parallelism

## Language Bindings
Python, R, Java, Node.js, Rust, Go, C/C++

## Performance
- Often faster than Spark on single node
- 10-100x faster than Pandas for SQL

GitHub: https://github.com/duckdb/duckdb`,
  },

  // === Distributed SQL ===
  {
    domain: "data-systems/projects/cockroachdb",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "distributed", "newsql", "cockroachdb"],
    body: `# CockroachDB

Distributed SQL database inspired by Google Spanner.

## Core Features
- Distributed ACID transactions
- PostgreSQL wire protocol
- Automatic sharding and rebalancing
- Multi-region deployment

## Architecture
- Range-based partitioning
- Raft consensus per range
- Hybrid logical clocks (HLC)
- SQL layer on top of KV store

## Consistency Model
- Serializable isolation by default
- Global reads may wait for clock uncertainty
- Follower reads for stale but local reads

## Deployment Options
- Self-hosted (open source BSL)
- CockroachDB Serverless
- CockroachDB Dedicated

## Use Cases
- Global applications
- Multi-region high availability
- PostgreSQL migration
- OLTP at scale

## Limitations
- Higher latency than single-node
- Complexity of distributed debugging
- Cost of cross-region transactions

GitHub: https://github.com/cockroachdb/cockroach`,
  },

  {
    domain: "data-systems/projects/tidb",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "distributed", "newsql", "tidb", "htap"],
    body: `# TiDB

Distributed HTAP database with MySQL compatibility.

## Architecture Components
- **TiDB**: Stateless SQL layer (MySQL protocol)
- **TiKV**: Distributed KV storage (Raft + RocksDB)
- **PD**: Placement Driver (metadata, scheduling)
- **TiFlash**: Columnar store for analytics

## Key Features
- MySQL 5.7+ compatible
- Horizontal scaling
- Online DDL
- Real-time HTAP (row + columnar)

## Consistency
- Distributed transactions (Percolator-style)
- Snapshot isolation default
- Optional pessimistic locking

## Deployment
- On-premises or cloud
- TiDB Cloud (managed)
- Kubernetes operator (TiDB Operator)

## Use Cases
- MySQL sharding replacement
- Real-time analytics + transactions
- Financial services
- Gaming leaderboards

## Community
- CNCF Graduated project (TiKV)
- Active development by PingCAP

GitHub: https://github.com/pingcap/tidb`,
  },

  // === NoSQL ===
  {
    domain: "data-systems/projects/redis",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "nosql", "redis", "cache", "in-memory"],
    body: `# Redis

In-memory data structure store.

## Data Structures
- Strings
- Lists
- Sets
- Sorted sets
- Hashes
- Streams
- Bitmaps
- HyperLogLog
- Geospatial indexes

## Key Features
- Sub-millisecond latency
- Persistence (RDB snapshots, AOF log)
- Replication (async, semi-sync)
- Clustering (hash slots)
- Lua scripting
- Pub/Sub messaging

## Use Cases
- Caching layer
- Session storage
- Rate limiting
- Leaderboards
- Real-time analytics
- Message queues

## Persistence Options
- RDB: Point-in-time snapshots
- AOF: Append-only file
- RDB+AOF: Hybrid

## Clustering
- 16,384 hash slots
- Automatic failover
- Redis Cluster or Redis Sentinel

## Licensing Drama (2024)
- Changed from BSD to dual SSPL/RSALv2
- Valkey fork by Linux Foundation

GitHub: https://github.com/redis/redis
Fork: https://github.com/valkey-io/valkey`,
  },

  {
    domain: "data-systems/projects/mongodb",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "nosql", "mongodb", "document"],
    body: `# MongoDB

Document database for modern applications.

## Data Model
- JSON-like documents (BSON)
- Dynamic schemas
- Embedded documents
- References between documents

## Key Features
- Rich query language (MQL)
- Aggregation framework
- Full-text search (Atlas Search)
- Time-series collections
- Change streams

## Indexing
- B-tree indexes
- Compound indexes
- Text indexes
- Geospatial indexes
- Wildcard indexes

## Replication
- Replica sets (primary + secondaries)
- Automatic failover
- Read preference options

## Sharding
- Range or hashed shard keys
- Automatic balancing
- Targeted vs scatter-gather queries

## Atlas (Cloud)
- Managed MongoDB
- Serverless tier
- Data Federation
- Search, Charts, Triggers

## Use Cases
- Content management
- Mobile apps
- Real-time analytics
- IoT data

GitHub: https://github.com/mongodb/mongo`,
  },

  {
    domain: "data-systems/projects/cassandra",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "nosql", "cassandra", "wide-column", "distributed"],
    body: `# Apache Cassandra

Wide-column store for massive scale.

## Origins
- Facebook (2008) for Inbox Search
- Open sourced, Apache project
- Combines Dynamo (distribution) + Bigtable (data model)

## Data Model
- Keyspaces > Tables > Rows > Columns
- Partition key determines distribution
- Clustering columns determine sort order
- Wide rows (up to 2B columns)

## Architecture
- Peer-to-peer (no master)
- Consistent hashing + virtual nodes
- Tunable consistency (ONE, QUORUM, ALL)
- Gossip protocol for membership

## Write Path
1. Commit log (durability)
2. Memtable (memory)
3. SSTable flush
4. Compaction

## Read Path
1. Memtable
2. Row cache (optional)
3. Bloom filter check
4. SSTable scan

## Use Cases
- Time-series data
- Messaging systems
- Fraud detection
- Recommendations

## Ecosystem
- DataStax Enterprise
- Astra DB (serverless)
- ScyllaDB (C++ rewrite)

GitHub: https://github.com/apache/cassandra`,
  },

  // === Streaming ===
  {
    domain: "data-systems/projects/kafka",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "streaming", "kafka", "messaging"],
    body: `# Apache Kafka

Distributed event streaming platform.

## Core Concepts
- **Topics**: Named feeds of records
- **Partitions**: Ordered, immutable logs
- **Producers**: Publish to topics
- **Consumers**: Subscribe with consumer groups
- **Brokers**: Kafka servers

## Architecture
\`\`\`
Producers → Brokers → Consumers
              ↓
           ZooKeeper (or KRaft)
\`\`\`

## Key Features
- High throughput (millions of msgs/sec)
- Durable storage (retention policy)
- Exactly-once semantics (with transactions)
- Partitioned consumer groups

## Ecosystem
- Kafka Connect: Data integration
- Kafka Streams: Stream processing library
- ksqlDB: SQL on streams
- Schema Registry: Avro/Protobuf schemas

## KRaft Mode
- Removes ZooKeeper dependency
- Raft-based metadata management
- GA since Kafka 3.3

## Use Cases
- Event sourcing
- Log aggregation
- Metrics pipelines
- Stream processing
- Microservice communication

GitHub: https://github.com/apache/kafka`,
  },

  {
    domain: "data-systems/projects/flink",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "streaming", "flink", "processing"],
    body: `# Apache Flink

Stateful stream processing at scale.

## Core Abstractions
- DataStream API (streams)
- Table API / Flink SQL
- Process functions (low-level)

## Key Differentiators
- True streaming (not micro-batch)
- Event time processing
- Exactly-once state consistency
- Low-latency (milliseconds)

## State Management
- Keyed state (per-key, partitioned)
- Operator state (per-task)
- Checkpointing for fault tolerance
- State backends (RocksDB, heap)

## Windowing
\`\`\`java
stream
  .keyBy(event -> event.key)
  .window(TumblingEventTimeWindows.of(Time.minutes(5)))
  .reduce((a, b) -> merge(a, b))
\`\`\`

Types: Tumbling, Sliding, Session, Global

## Time Semantics
- Event time: When event occurred
- Processing time: When processed
- Watermarks: Progress tracking

## Deployment
- Standalone cluster
- YARN, Kubernetes
- Flink on AWS/GCP/Azure

## Use Cases
- Real-time ETL
- Anomaly detection
- Real-time ML features
- CDC (change data capture)

GitHub: https://github.com/apache/flink`,
  },

  // === Analytics ===
  {
    domain: "data-systems/projects/clickhouse",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "analytics", "clickhouse", "column-store"],
    body: `# ClickHouse

Fast open-source OLAP database.

## Origins
- Developed at Yandex for Metrica
- Open sourced in 2016
- Now ClickHouse, Inc.

## Performance Secrets
- Columnar storage
- Vectorized execution
- SIMD optimizations
- Aggressive compression (LZ4, ZSTD)
- Sparse indexes

## Data Model
- MergeTree family of table engines
- Partitioning by date/expression
- Primary key (sorting key)
- Skip indexes

## Distributed Architecture
- Sharding via Distributed tables
- Replication via ReplicatedMergeTree
- ZooKeeper for coordination

## SQL Features
- Full SQL support
- Window functions
- Array/Map operations
- Approximate functions (HyperLogLog, quantiles)

## Ingestion
- Bulk INSERT
- Kafka integration
- Change data capture
- Files (Parquet, CSV, JSON)

## Use Cases
- Web/app analytics
- Log analysis
- Time-series data
- Business intelligence

## Performance
- Billion rows/second scan speed
- Real-time queries on petabytes

GitHub: https://github.com/ClickHouse/ClickHouse`,
  },

  {
    domain: "data-systems/projects/apache-arrow",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "data-format", "arrow", "interop"],
    body: `# Apache Arrow

Cross-language columnar memory format.

## The Problem It Solves
Before Arrow: Each system serializes/deserializes data.
With Arrow: Zero-copy data sharing between systems.

## Memory Format
\`\`\`
┌─────────────────────────────────────┐
│ Schema (field names, types)         │
├─────────────────────────────────────┤
│ RecordBatch                         │
│  ├── Column 1 (Array)               │
│  │    ├── Validity bitmap           │
│  │    └── Data buffer               │
│  ├── Column 2 (Array)               │
│  └── ...                            │
└─────────────────────────────────────┘
\`\`\`

## Key Features
- Language-agnostic
- Columnar (SIMD-friendly)
- Zero-copy IPC
- GPU acceleration support

## Ecosystem
- **Arrow Flight**: High-speed data transport
- **Arrow Flight SQL**: SQL over Arrow
- **DataFusion**: Query engine in Rust
- **Ballista**: Distributed query engine

## Language Support
C++, Python, R, Rust, Go, Java, JavaScript, Julia, C#

## Who Uses It
- Pandas 2.0 (backend option)
- Spark (Pandas UDF)
- DuckDB
- Polars
- InfluxDB IOx

## File Formats
- Feather: Simple Arrow-native format
- Parquet: Arrow-compatible, widely used

GitHub: https://github.com/apache/arrow`,
  },

  // === Search & Vector ===
  {
    domain: "data-systems/projects/elasticsearch",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "search", "elasticsearch", "lucene"],
    body: `# Elasticsearch

Distributed search and analytics engine.

## Built On
- Apache Lucene (full-text search library)
- REST API for operations
- JSON documents

## Core Concepts
- **Index**: Collection of documents
- **Document**: JSON with fields
- **Mapping**: Schema definition
- **Shard**: Lucene index partition
- **Replica**: Shard copy for HA

## Search Capabilities
- Full-text search with analyzers
- Fuzzy matching, synonyms
- Geospatial queries
- Aggregations (metrics, buckets)
- Vector search (kNN)

## Architecture
- Cluster of nodes
- Master node for coordination
- Data nodes for storage
- Ingest nodes for pipelines

## Use Cases
- Application search
- Log analytics (ELK Stack)
- Security analytics
- APM (Application Performance Monitoring)

## Licensing
- Changed from Apache 2.0 to SSPL (2021)
- OpenSearch fork by AWS

## Elastic Stack
- Elasticsearch (search/store)
- Kibana (visualization)
- Logstash (ingestion)
- Beats (data shippers)

GitHub: https://github.com/elastic/elasticsearch
Fork: https://github.com/opensearch-project/OpenSearch`,
  },

  {
    domain: "data-systems/projects/milvus",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "vector", "milvus", "similarity-search"],
    body: `# Milvus

Open-source vector database for AI applications.

## Purpose
Store and search high-dimensional vectors (embeddings)
for semantic similarity search.

## Key Features
- Billion-scale vector search
- Multiple index types (HNSW, IVF, etc.)
- Hybrid search (vector + scalar filters)
- GPU acceleration
- Distributed architecture

## Index Types
- **FLAT**: Brute force (exact)
- **IVF_FLAT**: Inverted file index
- **IVF_SQ8**: Scalar quantization
- **HNSW**: Hierarchical Navigable Small World
- **ANNOY**: Approximate Nearest Neighbors

## Architecture
\`\`\`
          ┌─────────────┐
          │   Proxy     │
          └─────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───────┐ ┌───────┐ ┌───────┐
│ Query │ │ Data  │ │ Index │
│ Node  │ │ Node  │ │ Node  │
└───────┘ └───────┘ └───────┘
\`\`\`

## Use Cases
- RAG (Retrieval Augmented Generation)
- Recommendation systems
- Image/video search
- Anomaly detection
- Drug discovery

## Cloud Options
- Zilliz Cloud (managed Milvus)
- Self-hosted on Kubernetes

GitHub: https://github.com/milvus-io/milvus`,
  },

  // === Modern Tools ===
  {
    domain: "data-systems/projects/delta-lake",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "lakehouse", "delta-lake", "databricks"],
    body: `# Delta Lake

Open table format bringing ACID to data lakes.

## The Problem
Data lakes (files on S3/HDFS) lack:
- ACID transactions
- Schema enforcement
- Time travel
- Efficient upserts

## How Delta Works
Parquet files + Transaction log (JSON)

\`\`\`
delta_table/
├── _delta_log/
│   ├── 00000000000000000000.json
│   ├── 00000000000000000001.json
│   └── 00000000000000000002.checkpoint.parquet
├── part-00000-xxx.parquet
└── part-00001-xxx.parquet
\`\`\`

## Key Features
- **ACID transactions**: Atomic commits, serializable
- **Time travel**: Query historical versions
- **Schema evolution**: Add/rename columns safely
- **MERGE**: Efficient upserts (MERGE INTO)
- **Z-Ordering**: Data skipping optimization

## Delta UniForm
Write once, read as:
- Delta Lake
- Apache Iceberg
- Apache Hudi

## Ecosystem
- Spark (native)
- Flink, Trino, Presto connectors
- Delta Rust (standalone)
- Delta Sharing (data sharing protocol)

## Governance
- Linux Foundation project
- Originally Databricks

GitHub: https://github.com/delta-io/delta`,
  },

  {
    domain: "data-systems/projects/dbt",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["project", "transformation", "dbt", "analytics-engineering"],
    body: `# dbt (data build tool)

Transform data in warehouse using SQL.

## Philosophy
- SQL is enough for transformations
- Software engineering best practices for data
- Analytics as code

## How It Works
\`\`\`sql
-- models/customers.sql
{{ config(materialized='table') }}

SELECT
    customer_id,
    first_name,
    last_name,
    created_at
FROM {{ ref('stg_customers') }}
\`\`\`

## Key Concepts
- **Models**: SELECT statements → tables/views
- **Sources**: Raw data declarations
- **Tests**: Data quality checks
- **Macros**: Reusable Jinja functions
- **Packages**: Shared code

## Workflow
\`\`\`
dbt run    # Execute models
dbt test   # Run tests
dbt docs   # Generate documentation
\`\`\`

## Materializations
- view (default)
- table
- incremental (append/merge)
- ephemeral (CTE)

## Supported Warehouses
Snowflake, BigQuery, Redshift, Databricks,
PostgreSQL, DuckDB, and 30+ more

## Ecosystem
- dbt Cloud (managed, IDE, scheduling)
- dbt Core (open source CLI)
- dbt Hub (packages)

GitHub: https://github.com/dbt-labs/dbt-core`,
  },
];

export function getProjectsSeeds(): IngestInput[] {
  return PROJECTS_SEEDS;
}
