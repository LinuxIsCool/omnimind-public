/**
 * OMNIMIND Knowledge Substrate - Meta Ideas Seed
 *
 * 50 novel ideas generated through recursive self-analysis.
 * The substrate analyzing itself, feeding discoveries back.
 */

import type { IngestInput } from "../types.js";

export const META_IDEAS_SEEDS: IngestInput[] = [
  {
    domain: "omnimind/meta/fifty-ideas",
    type: "artifact",
    confidence: 0.95,
    volatility: "evolving",
    tags: ["meta", "ideas", "roadmap", "recursive"],
    body: `# 50 Novel Ideas for OMNIMIND Knowledge Substrate

Generated through recursive meta-cognition: the substrate analyzing itself.

## Categories

1. **Technical Improvements** (1-10): Bug fixes, performance, security
2. **Testing Strategies** (11-20): Validation, chaos testing, property tests
3. **Creative Applications** (21-30): AI memory, thought archaeology, worldbuilding
4. **Integration Possibilities** (31-38): Claude hooks, Obsidian, Git, MCP
5. **Performance & Monitoring** (39-43): Metrics, caching, observability
6. **Future Directions** (44-48): Inference, federation, economics
7. **Biases & Critiques** (49-50): Recency bias, reification risk

## Priority Matrix

| Priority | Ideas | Rationale |
|----------|-------|-----------|
| P0 Critical | 1, 2, 4, 5 | Correctness bugs |
| P1 High | 3, 7, 34 | Performance & AI integration |
| P2 Medium | 31, 38, 44 | Ecosystem expansion |
| P3 Future | 46, 47, 48 | Long-term vision |

## The Recursive Insight

This atom is itself a product of the intelligence explosion. The substrate analyzed itself through parallel agents, synthesized insights, and now stores those insights as new atoms - which can be queried to inform future development.

*The snake eats its tail. Knowledge compounds.*
`,
  },

  {
    domain: "omnimind/meta/technical-debt",
    type: "insight",
    confidence: 0.98,
    volatility: "evolving",
    tags: ["meta", "technical-debt", "bugs"],
    body: `# Critical Technical Debt in Layer 0

Discovered through systematic code review.

## Critical Issues

### 1. WAL is Non-Functional
- \`appendWAL\` and \`commitWAL\` just append lines
- No recovery on startup
- No truncation - grows forever
- No \`fsync()\` - not durable

### 2. Race Condition in Ingest
- TOCTOU between \`exists()\` check and \`writeAtom()\`
- Concurrent ingests of same content can both proceed
- Could corrupt indexes

### 3. link() Does Nothing
- Method exists, documented, but body is empty
- Graph links are core feature - broken

### 4. Path Traversal Vulnerability
- Domain paths used directly in \`join()\`
- \`../../../etc/passwd\` could escape substrate

## Recommended Fix Order

1. Security (path validation) - immediate
2. link() implementation - core feature
3. WAL proper implementation - durability
4. Concurrency - before multi-user
`,
  },

  {
    domain: "omnimind/meta/integration-vision",
    type: "concept",
    confidence: 0.90,
    volatility: "evolving",
    tags: ["meta", "integration", "ecosystem"],
    body: `# Integration Vision: The Knowledge Mesh

How the substrate becomes central nervous system for AI.

## Claude Code Integration

\`\`\`yaml
# .claude/hooks/PostToolUse.yaml
match:
  tool: Read
action:
  type: prompt
  prompt: |
    If this file contains knowledge worth preserving,
    create an AKU with domain derived from file path.
\`\`\`

## The Full Stack

\`\`\`
Human Knowledge
       ↕
OMNIMIND Substrate ←→ MCP Server
       ↕
Claude Instances (many)
       ↕
Obsidian / Git / Browser
       ↕
World Knowledge (Web)
\`\`\`

## Key Principle

The substrate is the **accumulation layer**.
- Claude instances are ephemeral (context windows)
- Substrate is persistent (disk)
- Integration makes ephemeral → persistent automatic

## Success Metric

Every substantive Claude session adds atoms.
No valuable insight is lost to context eviction.
`,
  },

  {
    domain: "omnimind/meta/creative-applications",
    type: "concept",
    confidence: 0.85,
    volatility: "evolving",
    tags: ["meta", "creative", "applications"],
    body: `# Beyond Storage: Creative Applications

The substrate enables patterns impossible with traditional databases.

## Thought Archaeology

Because atoms are:
- Timestamped
- Immutable
- Content-addressed

You can query your own intellectual evolution:
- "What did I believe before I learned X?"
- "Which ideas have I rediscovered?" (same hash, different timestamps)
- "Which concepts integrated vs remained isolated?"

## Convergent Discovery

Two users who independently discover the same insight create atoms with the **same hash**. The content-addressing reveals intellectual convergence without coordination.

This enables:
- Discovery of unknown intellectual kinship
- Automatic deduplication across federated substrates
- Proof of independent discovery (timestamps)

## The Serendipity Engine

Query: "atoms in domain A that link to domain B"

This surfaces unexpected bridges in your knowledge that keyword search cannot find. Structure reveals connection.

## Living Worlds

Fiction as substrate:
- Canon = privileged subgraph
- Fan contributions link to canon
- Contradictions are explicit (\`contradicts\` relation)
- Convergent fan creations auto-merge
`,
  },
];

export function getMetaIdeasSeeds(): IngestInput[] {
  return META_IDEAS_SEEDS;
}
