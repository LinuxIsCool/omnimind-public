/**
 * OMNIMIND Knowledge Substrate - Data Systems History Seeds
 *
 * Key milestones in database and data systems evolution (1960-2026).
 */

import type { IngestInput } from "../types.js";

export const HISTORY_SEEDS: IngestInput[] = [
  // === 1960s: The Foundations ===
  {
    domain: "data-systems/history/1960s/ims",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "hierarchical", "ibm", "1960s"],
    body: `# IMS (Information Management System) - 1966

IBM's IMS was the first database management system, developed for the Apollo program.

## Key Innovations
- **Hierarchical data model**: Parent-child relationships in tree structures
- **DL/I (Data Language/I)**: Procedural query language
- **Segment-based storage**: Physical data organization

## Historical Significance
- Proved databases could manage complex real-world data
- Still runs critical banking and insurance systems today
- Influenced all subsequent database designs

## Legacy
IMS processes an estimated 50 billion transactions per day globally (as of 2020s).
The hierarchical model directly influenced XML and document databases.`,
  },

  {
    domain: "data-systems/history/1960s/codasyl",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "network-model", "codasyl", "1960s"],
    body: `# CODASYL Network Model - 1969

The Conference on Data Systems Languages (CODASYL) standardized the network database model.

## Key Concepts
- **Sets**: Named relationships between record types
- **Owner-member relationships**: Many-to-many via explicit links
- **Currency indicators**: Track current position in navigation

## Advantages Over Hierarchical
- Multiple parent records allowed
- More flexible relationship modeling
- Better for complex business data

## Notable Implementations
- IDMS (Integrated Database Management System)
- IDS (Integrated Data Store) by Charles Bachman

Charles Bachman won the 1973 Turing Award for his work on network databases.`,
  },

  // === 1970s: The Relational Revolution ===
  {
    domain: "data-systems/history/1970s/codd-relational",
    type: "insight",
    confidence: 0.98,
    volatility: "stable",
    tags: ["history", "relational", "codd", "theory", "1970s"],
    body: `# Codd's Relational Model - 1970

Edgar F. Codd's paper "A Relational Model of Data for Large Shared Data Banks" revolutionized databases.

## The 12 Rules (Codd's 1985 refinement)
1. Information Rule: All info in tables
2. Guaranteed Access: Every datum accessible by table+key+column
3. Null Values: Systematic null handling
4. Dynamic Catalog: Metadata as relations
5. Comprehensive Data Sublanguage
6. View Updating
7. High-Level Insert/Update/Delete
8. Physical Data Independence
9. Logical Data Independence
10. Integrity Independence
11. Distribution Independence
12. Non-subversion Rule

## Why It Mattered
- **Declarative queries**: Specify WHAT, not HOW
- **Mathematical foundation**: Relational algebra and calculus
- **Data independence**: Logical schema separate from physical

Codd received the 1981 Turing Award. His model remains the foundation of modern databases.`,
  },

  {
    domain: "data-systems/history/1970s/system-r",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "sql", "ibm", "system-r", "1970s"],
    body: `# System R - 1974-1979

IBM's System R was the first implementation of Codd's relational model.

## Key Contributions
- **SQL (SEQUEL)**: Structured Query Language, still dominant today
- **Query optimizer**: Cost-based optimization with statistics
- **Transaction processing**: ACID properties formalized
- **B-tree indexes**: Standard index structure

## The Team
- Don Chamberlin & Ray Boyce: SQL designers
- Jim Gray: Transaction processing (later Turing Award)
- Pat Selinger: Query optimization

## Commercial Impact
System R directly led to:
- IBM DB2 (1983)
- Oracle (reverse-engineered from papers)
- SQL/DS

The research papers were published openly, enabling the entire RDBMS industry.`,
  },

  {
    domain: "data-systems/history/1970s/ingres",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "berkeley", "ingres", "quel", "1970s"],
    body: `# INGRES - 1974

UC Berkeley's INGRES (Interactive Graphics and Retrieval System) pioneered academic database research.

## Innovations
- **QUEL**: Query language based on relational calculus
- **Decomposition strategy**: Query processing via reduction
- **Access methods**: ISAM, B-tree implementations

## Academic Lineage
Michael Stonebraker led INGRES, later creating:
- Postgres (1986) → PostgreSQL
- Illustra → Informix
- Vertica (column-store)
- VoltDB (NewSQL)

## Commercial Path
INGRES → CA-INGRES → Actian

Stonebraker received the 2014 Turing Award for his database contributions.`,
  },

  // === 1980s: Commercialization ===
  {
    domain: "data-systems/history/1980s/oracle",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "oracle", "commercial", "1980s"],
    body: `# Oracle Database - 1979-1980s

Larry Ellison's Oracle Corporation commercialized the relational database.

## Timeline
- 1977: SDL (Software Development Labs) founded
- 1979: Oracle V2 (V1 was never released)
- 1983: Oracle V3 - rewritten in C for portability
- 1984: Read consistency via snapshots
- 1988: Oracle V6 - row-level locking, PL/SQL

## Business Model Innovation
- First to ship on multiple platforms
- Aggressive sales tactics
- Targeted government contracts (CIA was early customer)

## Technical Contributions
- Multi-Version Concurrency Control (MVCC)
- Redo logs for crash recovery
- Shared-nothing clustering (RAC)

Oracle became the dominant enterprise database by the 1990s.`,
  },

  {
    domain: "data-systems/history/1980s/postgres-origin",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "postgres", "berkeley", "stonebraker", "1980s"],
    body: `# POSTGRES Project - 1986

Stonebraker's post-INGRES project introduced object-relational concepts.

## Key Innovations
- **User-defined types**: Extensible type system
- **Rules system**: Active database triggers
- **Time-travel queries**: Historical data access
- **POSTQUEL**: Extended query language

## Design Philosophy
"No overwrite" storage model - append-only for history.

## Evolution
- 1986-1994: Berkeley POSTGRES
- 1994: Postgres95 (SQL added by Andrew Yu & Jolly Chen)
- 1996: PostgreSQL (community takes over)

The name POSTGRES = "POST inGRES" (after INGRES).`,
  },

  // === 1990s: The Web Era ===
  {
    domain: "data-systems/history/1990s/mysql-origin",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "mysql", "web", "lamp", "1990s"],
    body: `# MySQL - 1995

MySQL democratized databases for web applications.

## Origins
- Created by Michael Widenius (Monty) and David Axmark
- Originally for internal use at TcX
- Named after Monty's daughter "My"

## Design Decisions
- Simple, fast, reliable over feature-complete
- Pluggable storage engines (MyISAM, InnoDB)
- Easy to install and administer

## The LAMP Stack
Linux + Apache + MySQL + PHP/Perl/Python became the web standard.

## Corporate Journey
- MySQL AB → Sun Microsystems (2008, $1B)
- Sun → Oracle (2010)
- MariaDB fork by Widenius (2009)

MySQL powers Wikipedia, Facebook (early), and countless web applications.`,
  },

  {
    domain: "data-systems/history/1990s/olap-revolution",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "olap", "data-warehouse", "codd", "1990s"],
    body: `# OLAP and Data Warehousing - 1990s

The separation of analytical and transactional workloads.

## Codd's OLAP Rules (1993)
Codd defined 12 rules for Online Analytical Processing:
- Multidimensional conceptual view
- Transparency to user
- Accessibility (single interface)
- Consistent reporting performance
- Client-server architecture
- Generic dimensionality
- Dynamic sparse matrix handling
- Multi-user support
- Unrestricted cross-dimensional operations
- Intuitive data manipulation
- Flexible reporting
- Unlimited dimensions and aggregation levels

## Key Technologies
- **Star schema**: Fact tables + dimension tables
- **MOLAP**: Pre-computed cubes (Essbase)
- **ROLAP**: SQL on star schemas
- **Snowflake schema**: Normalized dimensions

## Commercial Systems
- Teradata (massively parallel)
- Essbase (Hyperion/Oracle)
- Microsoft Analysis Services

Separated OLTP (transactions) from OLAP (analysis) workloads.`,
  },

  // === 2000s: The NoSQL Movement ===
  {
    domain: "data-systems/history/2000s/google-papers",
    type: "insight",
    confidence: 0.98,
    volatility: "stable",
    tags: ["history", "google", "distributed", "bigtable", "mapreduce", "2000s"],
    body: `# Google's Seminal Papers - 2003-2006

Three papers that launched the big data revolution.

## Google File System (2003)
- Commodity hardware, software fault tolerance
- Large sequential reads/writes optimized
- Single master, multiple chunk servers
- 64MB chunks with 3x replication

## MapReduce (2004)
- Simple programming model: map() + reduce()
- Automatic parallelization and fault tolerance
- Launched Hadoop ecosystem

## Bigtable (2006)
- Sparse, distributed, sorted map
- (row, column, timestamp) → value
- Column families for locality
- Inspired HBase, Cassandra, many others

## Why Papers, Not Products?
Google published research rather than selling products.
This sparked an entire industry of open-source alternatives.

The "3 papers that changed everything" in distributed systems.`,
  },

  {
    domain: "data-systems/history/2000s/dynamo",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "amazon", "dynamo", "eventual-consistency", "2000s"],
    body: `# Amazon Dynamo - 2007

"Dynamo: Amazon's Highly Available Key-value Store" defined modern NoSQL.

## Key Innovations
- **Eventual consistency**: Sacrifice C for A in CAP
- **Consistent hashing**: Virtual nodes for distribution
- **Vector clocks**: Conflict detection
- **Sloppy quorum**: Hinted handoff for availability
- **Anti-entropy**: Merkle trees for repair

## Design Principles
1. Always writable (shopping cart must work)
2. Decentralized (no single point of failure)
3. Symmetric (all nodes equal)
4. Incremental scalability

## Influence
Directly inspired:
- Apache Cassandra (Dynamo + Bigtable)
- Riak
- Voldemort (LinkedIn)

DynamoDB (AWS) shares name but different architecture.`,
  },

  {
    domain: "data-systems/history/2000s/nosql-movement",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "nosql", "scale", "2000s"],
    body: `# The NoSQL Movement - 2009

"NoSQL" emerged as a category at a San Francisco meetup.

## The Name
Johan Oskarsson organized a meetup about "open-source, distributed, non-relational databases."
Eric Evans suggested #NoSQL as a Twitter hashtag.
Later reinterpreted as "Not Only SQL."

## Categories
1. **Key-Value**: Redis, Memcached, Riak
2. **Document**: MongoDB, CouchDB
3. **Column-Family**: Cassandra, HBase
4. **Graph**: Neo4j, JanusGraph

## Motivations
- Web scale (millions of users)
- Schema flexibility (agile development)
- Horizontal scaling (commodity hardware)
- Developer productivity (JSON-native)

## The Pendulum
By 2010s, "NewSQL" emerged wanting scale + ACID.
By 2020s, many NoSQL databases added transactions.

NoSQL didn't replace SQL; it expanded the toolkit.`,
  },

  // === 2010s: Modern Distributed Systems ===
  {
    domain: "data-systems/history/2010s/spanner",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "google", "spanner", "truetime", "newsql", "2010s"],
    body: `# Google Spanner - 2012

"Spanner: Google's Globally Distributed Database" achieved the impossible.

## The TrueTime Innovation
- GPS + atomic clocks in datacenters
- API: TT.now() returns [earliest, latest] interval
- Enables global external consistency

## How It Works
1. Assign timestamps within TrueTime interval
2. Wait out the uncertainty ("commit wait")
3. Guaranteed that T1 < T2 if T1 committed before T2 started

## Capabilities
- Globally distributed ACID transactions
- SQL query support
- Automatic sharding and rebalancing
- Synchronous replication

## Commercial Impact
- Google Cloud Spanner (2017)
- CockroachDB (open source inspired by)
- YugabyteDB
- TiDB

Proved you can have distributed + consistent + relational.`,
  },

  {
    domain: "data-systems/history/2010s/kafka",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "kafka", "streaming", "linkedin", "2010s"],
    body: `# Apache Kafka - 2011

LinkedIn's Kafka redefined data infrastructure as streaming.

## Original Problem
- Activity data (page views, searches) overwhelming batch ETL
- Need real-time data pipelines

## Core Abstraction
**Log**: Append-only, ordered sequence of records
- Producers append to end
- Consumers read from any offset
- Retention by time or size

## Key Design Decisions
- Topics partitioned for parallelism
- Consumer groups for scaling consumption
- Zero-copy for performance
- Persistent by default (not just cache)

## Kafka's Evolution
1. Message queue replacement (2011)
2. Stream processing (Kafka Streams, 2016)
3. Event sourcing platform
4. "Central nervous system" for enterprises

## Ecosystem
- Confluent (commercial)
- ksqlDB (SQL on streams)
- Kafka Connect (integrations)

Changed mindset from "databases" to "logs" as primitive.`,
  },

  {
    domain: "data-systems/history/2010s/snowflake",
    type: "concept",
    confidence: 0.95,
    volatility: "stable",
    tags: ["history", "snowflake", "cloud", "data-warehouse", "2010s"],
    body: `# Snowflake - 2012-2014

Snowflake pioneered cloud-native data warehousing.

## Key Innovations
1. **Separation of compute and storage**
   - Scale independently
   - Pay only for what you use
   - Multiple compute clusters on same data

2. **Multi-cluster shared data**
   - Virtual warehouses for workload isolation
   - Automatic scaling

3. **Zero-copy cloning**
   - Instant dev/test environments
   - Space-efficient branching

## Technical Architecture
- Storage: S3/Azure Blob/GCS (columnar, compressed)
- Compute: Stateless virtual warehouses
- Services: Metadata, query optimization, transactions

## Business Model
- Usage-based pricing (credits)
- Cross-cloud data sharing
- Data marketplace

Snowflake's 2020 IPO was largest software IPO in history.`,
  },

  // === 2020s: The Modern Era ===
  {
    domain: "data-systems/history/2020s/trends",
    type: "insight",
    confidence: 0.90,
    volatility: "evolving",
    tags: ["history", "trends", "modern", "2020s"],
    body: `# Data Systems Trends - 2020s

Current directions in data system evolution.

## Architectural Patterns
1. **Lakehouse**: Data lake + warehouse (Delta Lake, Iceberg)
2. **Real-time analytics**: Streaming + OLAP convergence
3. **Data mesh**: Decentralized data ownership
4. **Embedded databases**: SQLite renaissance, DuckDB

## Technology Trends
- **Rust rewrite**: Performance + safety (DataFusion, Polars)
- **Arrow ecosystem**: Columnar interchange format
- **WASM databases**: SQLite in browser
- **AI/ML integration**: Vector search, embeddings

## Cloud Evolution
- Serverless databases (Aurora Serverless, PlanetScale)
- Multi-cloud / hybrid (Snowflake, Databricks)
- Edge computing (Cloudflare D1, Turso)

## Developer Experience
- Type-safe query builders (Prisma, Drizzle)
- Local-first (CRDTs, sync engines)
- Git-like workflows (branching, time-travel)

The boundaries between OLTP, OLAP, and streaming continue to blur.`,
  },
];

export function getHistorySeeds(): IngestInput[] {
  return HISTORY_SEEDS;
}
