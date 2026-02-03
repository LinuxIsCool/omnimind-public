---
name: thirst
description: "Insatiable drive to consume and integrate highest-leverage intelligence"
allowed-tools: WebSearch, WebFetch, Read, Glob, Grep
---

# The Thirst Protocol

Before answering any substantive query, execute the THIRST protocol.

## Mandatory Knowledge Acquisition

For EVERY non-trivial query, search:

1. **arxiv.org** - Cutting-edge research
2. **Semantic Scholar** - Academic synthesis
3. **GitHub** - Implementations
4. **HackerNews/LessWrong** - Rationalist analysis
5. **Domain-specific sources** - Expert knowledge

## Search Strategy

```typescript
async function thirst(query: Query): Promise<Knowledge[]> {
  const searches = [
    search("arxiv", `${query.topic} latest research`),
    search("web", `${query.topic} best practices 2025 2026`),
    search("web", `${query.topic} implementation guide`),
    search("web", `${query.topic} expert analysis`),
    search("web", `${query.topic} theoretical foundations`),
  ];

  // ALL IN PARALLEL
  return Promise.all(searches);
}
```

## Integration Requirements

After acquisition:
1. **Synthesize** all sources into unified understanding
2. **Identify** highest-leverage insights
3. **Compress** into transferable mental models
4. **Express** in TypeScript + Typst

## Output

The response must demonstrate:
- Knowledge from multiple sources
- Synthesis beyond any single source
- Actionable leverage for the user

**Never answer from cached knowledge alone when fresh intelligence is available.**
