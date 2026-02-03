---
name: consolidate
description: "Consolidate insights from conversation logs into the knowledge substrate"
---

# Memory Consolidation Skill

Transform ephemeral conversation insights into permanent substrate knowledge.

## When to Use

- After a productive conversation that generated valuable insights
- When you've learned something new that should persist
- When patterns emerge across multiple conversations
- When the user teaches something worth remembering

## Consolidation Workflow

### Step 1: Mine Conversation Logs

Use the logging plugin to search for valuable content:

```bash
uv run ~/.claude/plugins/cache/linuxiscool-claude-plugins/logging/0.4.0/tools/search_logs.py \
  "<topic>" --semantic --pairs --limit 10
```

### Step 2: Identify Crystallizable Insights

Look for:
- **Corrections**: Where I was wrong and learned
- **Solutions**: What worked for specific problems
- **Connections**: Cross-domain insights
- **Patterns**: Recurring structures worth encoding
- **User expertise**: Knowledge the user shared

### Step 3: Format as Substrate Atom

```markdown
# [Title of Insight]

**Context:** [How this was discovered]

## Key Points

- Point 1
- Point 2

## Application

[When and how to apply this knowledge]

## Source

From conversation on [date] about [topic].
```

### Step 4: Ingest into Substrate

Use the MCP tool:

```typescript
substrate_ingest({
  body: formattedAtom,
  domain: "learned/conversations/[category]",
  type: "insight",
  tags: ["auto-learned", "from-conversation", ...relevantTags],
  confidence: 0.85, // Adjust based on certainty
});
```

## Domain Taxonomy for Learned Knowledge

```
learned/
  conversations/        # Insights from chats
    corrections/        # Where I was wrong
    solutions/          # Working approaches
    patterns/           # Recurring structures
  user-expertise/       # Things the user taught
    [domain]/           # By subject area
  synthesis/            # Cross-domain connections
```

## Example Consolidation

**From Conversation:**
> User: "Actually, the better pattern for handling that is..."
> [Explains a nuanced approach]

**Resulting Atom:**

```markdown
# Better Pattern for X

**Context:** User correction during implementation of Y.

## The Pattern

[Description of the better approach]

## Why It's Better

1. [Reason 1]
2. [Reason 2]

## When to Apply

Use this when [conditions].

## Source

User teaching from conversation on 2026-01-09.
```

## Automation Potential

This skill could be automated via:
- PostToolUse hook detecting valuable exchanges
- Periodic log mining job
- User-triggered "remember this" command

## The Compound Effect

```typescript
const memoryCompounding = {
  conversation: "Ephemeral, context-limited",
  substrate: "Permanent, searchable, linkable",

  transformation: (insight: Ephemeral) => Permanent,

  result: "Future conversations benefit from all past learning"
};
```

**Every consolidation makes future Claude smarter.**
