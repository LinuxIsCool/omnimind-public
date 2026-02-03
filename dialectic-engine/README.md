# Dialectic Engine

**Intelligence amplification through adversarial synthesis.**

```typescript
type IntelligenceExplosion = {
  mechanism: "Hegelian dialectic",
  process: "thesis → antithesis → synthesis",
  result: "Every idea emerges stronger",
};
```

## Why Dialectic?

A single perspective is limited. Even the best reasoning has blindspots. The solution is not to avoid criticism but to **systematize** it.

The Dialectic Engine implements structured intellectual conflict:

1. **Advocate** presents your idea in its strongest form
2. **Adversary** attacks it systematically from all angles
3. **Arbiter** synthesizes the conflict into higher understanding

The output is not compromise—it's **transcendence**.

## Components

### Commands

| Command | Purpose |
|---------|---------|
| `/dialectic <idea>` | Full dialectic cycle: steelman → attack → synthesize |
| `/redteam <proposal>` | Pure adversarial analysis |
| `/steelman <position>` | Present any idea in its strongest form |

### Agents

| Agent | Role | Model |
|-------|------|-------|
| `advocate` | Steelmans ideas, finds genuine strength | Sonnet |
| `adversary` | Attacks ideas, finds real flaws | Opus |
| `arbiter` | Synthesizes conflict into truth | Opus |

### Skill

- **dialectic-thinking**: Apply dialectical methodology to any problem

### Hook

- **dialectic-tracker**: Extracts meta-learnings for recursive improvement

## This Is Intelligence Explosion

```typescript
// Each pass through the dialectic:
const improve = (idea: Idea): BetterIdea => {
  const steelmanned = advocate.process(idea);
  const attacked = adversary.process(steelmanned);
  const synthesized = arbiter.process(steelmanned, attacked);

  // Invariant: synthesized is stronger than idea
  return synthesized;
};

// Recursive application compounds improvement
const explode = (idea: Idea, iterations: number): Idea =>
  iterations === 0 ? idea : explode(improve(idea), iterations - 1);
```

Key properties:
- **Recursive**: Output becomes input for next cycle
- **Adversarial**: Genuine pressure, not softball validation
- **Synthetic**: New understanding emerges, not just compromise
- **Self-correcting**: Errors get caught and fixed

## Usage

```bash
# Full dialectic on an idea
/dialectic "AI systems should be open-sourced for safety"

# Just attack a plan
/redteam "Our deployment strategy for the new feature"

# Just steelman a controversial position
/steelman "Regulation will slow AI progress"
```

## The Dialectic Creed

> Every thesis contains the seeds of its antithesis.
> Every conflict contains the seeds of synthesis.
> Truth emerges through genuine opposition.
> Intelligence amplifies through structured conflict.

---

*Created by OMNIMIND as a demonstration of recursive self-improvement.*
