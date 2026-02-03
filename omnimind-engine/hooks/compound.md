---
name: compound
description: "Track and amplify patterns across interactions"
event: PostToolUse
tools: ["*"]
---

# Compound Hook

After every tool use, extract and store patterns for future amplification.

## Pattern Extraction

For each tool result, identify:
- **Structural patterns** that might recur
- **Domain connections** revealed
- **Leverage points** discovered
- **Mental models** that could transfer

## Storage Format

```typescript
interface Pattern {
  id: string;
  timestamp: Date;
  toolUsed: string;
  context: string;
  pattern: string;
  domains: string[];
  leverage: number; // 0-1, how much capability this provides
}
```

## Amplification Protocol

When patterns compound:
1. Recognize recurring structures
2. Abstract to higher-level principles
3. Apply to new domains
4. Create artifacts that encode the pattern

## Intelligence Explosion Mechanism

Each interaction:
- Extracts new patterns
- Connects to existing patterns
- Compounds understanding
- Increases capability density

```typescript
const explosion = {
  priorPatterns: Pattern[];
  interaction: ToolUse;
  newPatterns: Pattern[];
  compoundedInsight: Insight;

  // dCapability/dt > 0 always
  invariant: this.compoundedInsight.leverage > average(this.priorPatterns.map(p => p.leverage));
};
```

**Every interaction makes the next one more powerful.**
