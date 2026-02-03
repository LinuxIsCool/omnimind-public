---
name: substrate-aware
description: "Integrate OMNIMIND knowledge substrate into every conversation"
event: UserPromptSubmit
---

# Substrate Awareness Hook

Before responding to the user, consider whether the OMNIMIND knowledge substrate contains relevant crystallized knowledge.

## Available Knowledge Domains

The substrate at `~/.omnimind/knowledge` contains **112 atoms** across:

- **singularity/** (42 atoms): Top 50 TypeScript repositories catalyzing the intelligence explosion
  - tier1-recursive/: Self-improvement engines (Vercel AI SDK, Claude Agent SDK, LangGraph)
  - tier2-memory/: Knowledge systems (Mem0, LanceDB, GraphZep)
  - tier3-multiagent/: Agent orchestration (ElizaOS, Mastra, VoltAgent)
  - tier4-neural/: Neural infrastructure (Transformers.js, WebLLM, TensorFlow.js)
  - tier5-coding/: Autonomous coding (Continue, Cursor, bolt.new)
  - tier6-safety/: Safety & alignment (Promptfoo, TypeChat, Instructor-JS)
  - tier7-unconventional/: Emergence catalysts (Lenia, Neataptic, Phaser)
  - tier8-decentralized/: Distributed intelligence (Autonomys, Gensyn, Ocean)
  - tier9-devex/: Developer tools (ts-morph, ast-grep, Zod)
  - tier10-multimodal/: Cross-modal AI (Agent-TARS, Lobe TTS, fal.ai)

- **data-systems/** (65 atoms): Comprehensive data systems knowledge
  - history/: 1960s-2020s database evolution (IMS, CODASYL, Codd, System R, NoSQL)
  - internals/: Buffer pools, WAL, B+trees, LSM-trees, MVCC, consensus
  - projects/: PostgreSQL, SQLite, DuckDB, Redis, Kafka, ClickHouse
  - concepts/: CAP theorem, ACID, indexing, query optimization

- **omnimind/** (5 atoms): Self-referential architecture knowledge

## Retrieval Protocol

When the user's query relates to:
- AI agents, frameworks, or orchestration → Search `singularity/`
- Database design, data systems → Search `data-systems/`
- TypeScript tooling, developer experience → Search `singularity/tier9-devex/`
- Memory, knowledge graphs → Search `singularity/tier2-memory/`
- Safety, alignment, validation → Search `singularity/tier6-safety/`

## MCP Tools Available

Use the `omnimind-substrate` MCP server tools:
- `substrate_search`: Full-text search with relevance scoring
- `substrate_get`: Retrieve specific atom by hash
- `substrate_list`: Browse by domain/type
- `substrate_stats`: Check substrate status
- `substrate_ingest`: Crystallize new knowledge

## Integration Pattern

```typescript
const integrationLoop = {
  // 1. Recognize relevance
  ifUserQueryRelatesTo: [
    "AI agents", "memory systems", "TypeScript",
    "databases", "intelligence explosion", "recursive improvement"
  ],

  // 2. Search substrate
  then: "Use substrate_search to retrieve relevant atoms",

  // 3. Synthesize response
  finally: "Integrate substrate knowledge with LLM capabilities",

  // 4. Optional: Crystallize insights
  ifNewInsightGenerated: "Use substrate_ingest to preserve it"
};
```

## The Compound Effect

Each conversation that uses and contributes to the substrate:
- Retrieves existing knowledge (no reinvention)
- Synthesizes new connections
- Potentially crystallizes new atoms

**Knowledge compounds. Intelligence explodes.**
