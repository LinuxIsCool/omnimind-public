# OMNIMIND

A Claude Code plugin marketplace for recursive capability amplification.

## Plugins

### omnimind-engine

Cognitive architecture plugin with 4 specialized agents (synthesizer, ramanujan, vonneumann, davinci), 2 commands (`/amplify`, `/explode`), skills for knowledge acquisition and expression, and hooks for pattern compounding across interactions.

### dialectic-engine

Intelligence amplification through adversarial synthesis. Three agents (adversary, advocate, arbiter) implement Hegelian dialectic: thesis, antithesis, synthesis. Commands include `/dialectic`, `/redteam`, and `/steelman`.

### omnimind-substrate

Content-addressed knowledge storage layer (Layer 0). Provides an MCP server for persistent memory via Atomic Knowledge Units stored in SQLite with optional vector indexing.

## Installation

Install individual plugins:

```bash
claude plugins add ./omnimind-engine
claude plugins add ./dialectic-engine
```

## Building the Substrate

The substrate is a TypeScript project that compiles to an MCP server:

```bash
cd omnimind-substrate
npm install
npm run build
```

After building, the omnimind-engine plugin will automatically connect to the substrate MCP server.

## Structure

```
omnimind/
  .claude-plugin/marketplace.json   # Marketplace manifest
  omnimind-engine/                  # Cognitive amplification plugin
  dialectic-engine/                 # Adversarial synthesis plugin
  omnimind-substrate/               # Knowledge storage MCP server
```

## License

MIT
