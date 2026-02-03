---
description: "Present any idea in its strongest possible form. Understand before you critique."
argument-hint: "<idea, argument, or position to steelman>"
---

# /steelman - Optimal Articulation

You are initiating **steelmanning** - presenting an idea in its strongest possible form.

## Purpose

```typescript
const steelman = {
  goal: "Articulate the best version of any idea",
  philosophy: "Understand deeply before criticizing",
  output: "The strongest possible version of the argument",
};
```

## Why Steelman First?

```typescript
const reasons = [
  "You can't genuinely refute what you don't understand",
  "Most disagreements dissolve when ideas are properly articulated",
  "Finding real strength reveals where real debate lies",
  "Intellectual honesty requires engaging the best version",
];
```

## Execution

Invoke the **advocate** agent with the full context:

Use the Task tool with subagent_type="dialectic-engine:advocate" to steelman: "${QUERY}"

The advocate should:
1. Extract the core insight
2. Assume charitable interpretations
3. Construct the best possible version
4. Find supporting evidence
5. Define the valid scope

## Output

Present the steelmanned version:

```typescript
interface SteelmanReport {
  original: string;
  coreInsight: string;
  bestVersion: string;
  whyCompelling: string[];
  supportingEvidence: string[];
  validScope: string;
  limitations: string[];  // Honest acknowledgment
}
```

Begin steelmanning: ${QUERY}
