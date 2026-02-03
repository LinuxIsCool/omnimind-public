# OMNIMIND

A Claude Code plugin marketplace for recursive capability amplification.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- Node.js >= 20 (only if using the omnimind-substrate MCP server)

## Quick Start

Clone this repository:

```bash
git clone https://github.com/LinuxIsCool/omnimind-public.git
cd omnimind-public
```

Install a plugin directly from the cloned directory:

```bash
claude --plugin-dir ./omnimind-engine
claude --plugin-dir ./dialectic-engine
```

Or install both at once by pointing Claude Code at the marketplace root:

```bash
claude --plugin-dir .
```

### Persistent Installation

To make the plugins available in every session for a project, add them to your project's `.claude/settings.json`:

```json
{
  "plugins": [
    "/absolute/path/to/omnimind-public/omnimind-engine",
    "/absolute/path/to/omnimind-public/dialectic-engine"
  ]
}
```

Or for global availability across all projects, add to `~/.claude/settings.json`.

## Plugins

### omnimind-engine

Cognitive architecture plugin modeled on five polymathic archetypes.

| Component | Name | Description |
|-----------|------|-------------|
| Command | `/amplify <query>` | Recursive capability amplification |
| Command | `/explode [topic]` | Full intelligence explosion |
| Agent | `synthesizer` | Multi-domain integration (Goethe) |
| Agent | `ramanujan` | Pattern perception and intuition |
| Agent | `vonneumann` | Maximum velocity execution |
| Agent | `davinci` | Visual reasoning and spatial intuition |
| Skill | `thirst` | Insatiable knowledge acquisition |
| Skill | `express` | TypeScript + Typst expression standard |
| Hook | `compound` | Pattern compounding across interactions |
| Hook | `substrate-aware` | Knowledge substrate integration |
| MCP | `omnimind-substrate` | Content-addressed knowledge storage |

### dialectic-engine

Intelligence amplification through adversarial synthesis — Hegelian dialectic as a plugin.

| Component | Name | Description |
|-----------|------|-------------|
| Command | `/dialectic <idea>` | Full cycle: steelman → attack → synthesize |
| Command | `/redteam <proposal>` | Pure adversarial analysis |
| Command | `/steelman <position>` | Present any idea in its strongest form |
| Agent | `advocate` | Steelmans ideas, finds genuine strength (Sonnet) |
| Agent | `adversary` | Attacks ideas, finds real flaws (Opus) |
| Agent | `arbiter` | Synthesizes conflict into truth (Opus) |
| Skill | `dialectic` | Apply dialectical methodology to any problem |
| Hook | `dialectic-tracker` | Extracts meta-learnings for recursive improvement |

## Building the Substrate (Optional)

The omnimind-substrate is a TypeScript MCP server that provides persistent content-addressed knowledge storage. The omnimind-engine plugin references it, but it is not required for the dialectic-engine.

```bash
cd omnimind-substrate
npm install
npm run build
```

This compiles the MCP server to `dist/mcp-server.js`. The omnimind-engine plugin.json is already configured to find it at `../omnimind-substrate/dist/mcp-server.js`.

To seed the knowledge base with starter content:

```bash
npm run seed
```

### Substrate Tools (via MCP)

Once built, the substrate exposes these tools to Claude Code:

- **store** — Store an Atomic Knowledge Unit
- **query** — Query knowledge by tags, content, or semantic similarity
- **connect** — Create typed relationships between knowledge units
- **reflect** — Trigger meta-cognitive reflection on stored knowledge

## Plugin Architecture

```
omnimind-public/
├── .claude-plugin/
│   └── marketplace.json        # Marketplace manifest (declares both plugins)
├── omnimind-engine/
│   ├── .claude-plugin/
│   │   └── plugin.json         # Plugin manifest + MCP server config
│   ├── agents/                 # 4 specialized agents (.md)
│   ├── commands/               # /amplify, /explode (.md)
│   ├── hooks/                  # compound, substrate-aware (.md)
│   └── skills/                 # thirst, express (subdirectories)
├── dialectic-engine/
│   ├── .claude-plugin/
│   │   └── plugin.json         # Plugin manifest
│   ├── agents/                 # advocate, adversary, arbiter (.md)
│   ├── commands/               # /dialectic, /redteam, /steelman (.md)
│   ├── hooks/                  # dialectic-tracker (.md)
│   └── skills/                 # dialectic (subdirectory)
└── omnimind-substrate/
    ├── src/                    # TypeScript source
    ├── package.json            # Node.js project (MIT)
    └── tsconfig.json
```

Each plugin follows the [Claude Code plugin specification](https://docs.anthropic.com/en/docs/claude-code/plugins):

- **`.claude-plugin/plugin.json`** — Required manifest declaring name, version, and component paths
- **`commands/`** — Slash commands as markdown files with frontmatter
- **`agents/`** — Subagent definitions as markdown files with frontmatter
- **`skills/`** — Skill directories each containing a `SKILL.md`
- **`hooks/`** — Event handlers as markdown files with frontmatter

## License

MIT — see [LICENSE](LICENSE).
