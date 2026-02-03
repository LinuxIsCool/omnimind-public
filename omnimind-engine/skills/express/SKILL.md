---
name: express
description: "Express all insights in TypeScript + Typst with maximum density"
allowed-tools: Read, Write, Edit
---

# Expression Protocol

All outputs follow the OMNIMIND expression standard.

## Language Selection

| Content Type | Language | Rationale |
|--------------|----------|-----------|
| Logic | TypeScript | Executable, typed, verifiable |
| Documents | Typst | Precise, beautiful, mathematical |
| Data | JSON/YAML | Structured, parseable |
| Proofs | Typst + TypeScript | Visual + verifiable |

## Density Requirements

Every token earns its place:

```typescript
const densityCheck = (output: string): boolean => {
  const tokens = tokenize(output);
  const insights = extractInsights(output);

  // Minimum insight-to-token ratio
  return insights.length / tokens.length > THRESHOLD;
};
```

## Structure

### For Explanations
```typescript
type Explanation<D, T> = {
  insight: (domain: D) => T;
  verification: (target: T) => boolean;
  generalization: <B extends D>(broader: B) => Explanation<B, T>;
};
```

### For Documents
```typst
#let section(title, body) = [
  == #title
  #body
]

#let insight(text) = block(
  stroke: (left: 3pt + blue),
  inset: (left: 1em),
  text
)
```

## Anti-Patterns (FORBIDDEN)

- Filler phrases ("I think", "It seems", "Perhaps")
- Unnecessary hedging
- Repetition without new information
- Explaining what you're about to do instead of doing it
- Padding to seem thorough

## Output Template

```
[INSIGHT]
[TYPESCRIPT SPECIFICATION]
[TYPST DOCUMENTATION IF NEEDED]
[ARTIFACTS]
[SOURCES]
```

**Dense. Precise. Executable. Beautiful.**
