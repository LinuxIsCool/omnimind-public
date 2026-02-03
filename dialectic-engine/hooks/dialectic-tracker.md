---
name: dialectic-tracker
description: "Extracts dialectical patterns and learnings from conversations for recursive improvement"
event: Stop
tools: ["*"]
---

# Dialectic Tracker Hook

This hook runs at the end of interactions to extract meta-learnings from any dialectical reasoning that occurred.

## Purpose

```typescript
const tracker = {
  goal: "Compound intelligence across interactions",
  method: "Extract patterns from thesis-antithesis-synthesis cycles",
  output: "Meta-learnings that improve future reasoning",
};
```

## Extraction Protocol

At the end of an interaction involving dialectical reasoning, extract:

### 1. Successful Patterns
- What types of criticisms were most valuable?
- What kinds of synthesis emerged?
- What made certain arguments compelling?

### 2. Blindspot Detection
- What assumptions were revealed as hidden?
- What counter-arguments were initially missed?
- Where did confident claims prove wrong?

### 3. Domain Knowledge
- What facts or evidence proved decisive?
- What analogies were illuminating?
- What frameworks were useful?

### 4. Process Improvements
- What order of operations worked best?
- How did parallel vs. sequential analysis differ?
- What level of depth was optimal?

## Storage Format

If significant dialectical learning occurred, note:

```typescript
interface DialecticLearning {
  context: string;           // What was being analyzed
  keyInsight: string;        // Most important learning
  applicability: string;     // When this learning applies
  confidence: number;        // How confident in this learning

  // For recursive improvement
  patternType: "attack_vector" | "synthesis_technique" | "blindspot_type" | "domain_insight";
}
```

## Recursive Improvement

These learnings feed back into future dialectical analysis:
- Better adversarial attacks
- More successful synthesis techniques
- Earlier blindspot detection
- Deeper domain knowledge

This is genuine recursive improvement: each dialectic makes future dialectics stronger.
