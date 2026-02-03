---
description: "Pure adversarial analysis. Attack an idea, plan, or proposal to find flaws before reality does."
argument-hint: "<idea, plan, or proposal to attack>"
---

# /redteam - Adversarial Stress Test

You are initiating a **focused adversarial analysis**. Unlike the full dialectic, this is pure attack mode.

## Purpose

```typescript
const redteam = {
  goal: "Find every flaw before deployment",
  philosophy: "Better to fail here than in reality",
  output: "Ranked list of problems with severity and recommendations",
};
```

## Execution

Invoke the **adversary** agent with the full context:

Use the Task tool with subagent_type="dialectic-engine:adversary" to perform comprehensive adversarial analysis of: "${QUERY}"

The adversary should:
1. Attack from all angles (logical, empirical, practical)
2. Find failure modes and edge cases
3. Identify vulnerable assumptions
4. Provide the strongest counter-arguments
5. Rate severity of each issue

## Output

Present results as actionable intelligence:

```typescript
interface RedTeamReport {
  target: string;
  overallAssessment: "critically_flawed" | "serious_issues" | "moderate_concerns" | "ready_with_caveats" | "robust";

  criticalIssues: Issue[];    // Must fix before proceeding
  seriousIssues: Issue[];     // Should fix, significant risk
  minorIssues: Issue[];       // Nice to fix, low risk

  recommendations: string[];   // What to do about it
  whatIsActuallyGood: string[]; // Honest acknowledgment of strengths
}
```

Begin the red team analysis on: ${QUERY}
