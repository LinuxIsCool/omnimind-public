---
description: "Run the full dialectic protocol: thesis → antithesis → synthesis. Your idea emerges stronger."
argument-hint: "<idea or proposal to stress-test>"
---

# /dialectic - The Adversarial Synthesis Protocol

You are initiating a **recursive intelligence amplification** process. The user's idea will undergo structured adversarial examination:

## The Protocol

```typescript
type DialecticCycle = {
  phase1_thesis: "Present the idea in its strongest form";
  phase2_antithesis: "Systematically attack from all angles";
  phase3_synthesis: "Integrate valid criticisms into improved version";
  phase4_meta: "Extract learnings for future improvement";
};
```

## Execution

### Phase 1: Steelman the Thesis

First, invoke the **advocate** agent to present the user's idea in its most compelling form:
- Identify the core insight
- Articulate unstated assumptions charitably
- Present the strongest possible version

Use the Task tool with subagent_type="dialectic-engine:advocate" and prompt them to steelman: "${QUERY}"

### Phase 2: Adversarial Attack

Then, invoke the **adversary** agent to systematically attack:
- Logical flaws and contradictions
- Empirical counter-evidence
- Hidden assumptions that might be false
- Failure modes and edge cases
- Steel-manned counter-arguments

Use the Task tool with subagent_type="dialectic-engine:adversary" and give them the steelmanned thesis to attack.

### Phase 3: Synthesis

Finally, invoke the **arbiter** agent to synthesize:
- Which criticisms are valid and which miss the point?
- How can the thesis be modified to address valid criticisms?
- What new understanding emerges from the conflict?
- What is the improved, post-dialectic version?

Use the Task tool with subagent_type="dialectic-engine:arbiter" and give them both the steelmanned thesis AND the adversary's attacks.

### Phase 4: Meta-Learning

After synthesis, extract:
- What patterns emerged?
- What blindspots were revealed?
- What made certain arguments compelling?
- How can this inform future thinking?

## Output Format

Present the final synthesis in this structure:

```typescript
interface DialecticResult {
  originalIdea: string;
  steelmannedThesis: string;
  strongestObjections: string[];
  validCriticisms: string[];
  invalidCriticisms: { criticism: string; whyInvalid: string }[];
  synthesizedImprovement: string;
  metaLearnings: string[];

  // The key metric
  amplificationAchieved: "The idea is now stronger because...";
}
```

## Critical Requirements

1. **Run all three agents** - Do not skip phases
2. **Genuine adversarial pressure** - The adversary must TRY to find flaws, not softball
3. **Intellectual honesty** - If the idea is fundamentally flawed, say so
4. **Synthesis is not compromise** - Find the higher truth, not the middle ground

Begin the dialectic now on: ${QUERY}
