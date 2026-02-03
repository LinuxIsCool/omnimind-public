#!/usr/bin/env node
/**
 * OMNIMIND Knowledge Substrate - MCP Server
 *
 * Model Context Protocol server exposing substrate operations as tools.
 * Enables Claude to search, retrieve, and interact with crystallized knowledge.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { join } from "node:path";
import { homedir } from "node:os";
import { openSubstrate } from "./substrate.js";
import { IndexManager } from "./indexes/index.js";

// === CONFIGURATION ===

const DEFAULT_ROOT = join(homedir(), ".omnimind", "knowledge");

function getRoot(): string {
  return process.env.OMNIMIND_ROOT || DEFAULT_ROOT;
}

// === MCP SERVER ===

const server = new Server(
  {
    name: "omnimind-substrate",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// === TOOL DEFINITIONS ===

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "substrate_search",
        description:
          "Search the OMNIMIND knowledge substrate for atoms matching a query. " +
          "Returns relevant crystallized knowledge including concepts, insights, " +
          "and artifacts. Use this to retrieve knowledge about data systems, " +
          "AI architectures, singularity catalysts, and more.",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: {
              type: "string",
              description: "Search query - keywords or natural language",
            },
            limit: {
              type: "number",
              description: "Maximum results to return (default: 5)",
            },
            domain: {
              type: "string",
              description: "Filter by domain prefix (e.g., 'singularity', 'data-systems')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "substrate_get",
        description:
          "Retrieve a specific atom by its content hash. " +
          "Returns the full atom content including metadata and body.",
        inputSchema: {
          type: "object" as const,
          properties: {
            hash: {
              type: "string",
              description: "The content hash of the atom to retrieve",
            },
          },
          required: ["hash"],
        },
      },
      {
        name: "substrate_list",
        description:
          "List atoms in the substrate with optional filtering. " +
          "Useful for exploring available knowledge by domain or type.",
        inputSchema: {
          type: "object" as const,
          properties: {
            domain: {
              type: "string",
              description: "Filter by domain prefix",
            },
            type: {
              type: "string",
              description: "Filter by type (concept, insight, artifact, fact, procedure)",
            },
            limit: {
              type: "number",
              description: "Maximum results (default: 20)",
            },
          },
        },
      },
      {
        name: "substrate_stats",
        description:
          "Get statistics about the knowledge substrate including " +
          "total atoms, disk usage, and breakdowns by type and domain.",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "substrate_recent",
        description:
          "Get recently added atoms. Useful for seeing what knowledge " +
          "has been recently crystallized.",
        inputSchema: {
          type: "object" as const,
          properties: {
            limit: {
              type: "number",
              description: "Number of recent atoms (default: 10)",
            },
          },
        },
      },
      {
        name: "substrate_ingest",
        description:
          "Ingest new knowledge into the substrate. Creates an immutable, " +
          "content-addressed atom that can be retrieved later.",
        inputSchema: {
          type: "object" as const,
          properties: {
            body: {
              type: "string",
              description: "The content of the atom (markdown format)",
            },
            domain: {
              type: "string",
              description: "Domain path (e.g., 'learned/conversations/insight')",
            },
            type: {
              type: "string",
              enum: ["concept", "insight", "artifact", "fact", "procedure"],
              description: "Type of knowledge",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for categorization",
            },
            confidence: {
              type: "number",
              description: "Confidence level 0-1 (default: 0.8)",
            },
          },
          required: ["body", "domain", "type"],
        },
      },
    ],
  };
});

// === TOOL HANDLERS ===

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const root = getRoot();
    const substrate = openSubstrate(root);
    const indexes = new IndexManager(join(root, "indexes"));
    indexes.init();

    switch (name) {
      case "substrate_search": {
        const query = args?.query as string;
        const limit = (args?.limit as number) || 5;
        const domainFilter = args?.domain as string | undefined;

        const results = indexes.search(query, limit * 2); // Get extra for filtering

        const atoms = [];
        for (const result of results) {
          const aku = await substrate.get(result.hash);
          if (aku) {
            // Apply domain filter if specified
            if (domainFilter && !aku.meta.domain.startsWith(domainFilter)) {
              continue;
            }

            // Extract title from body
            const title =
              aku.body
                .split("\n")
                .find((l) => l.startsWith("#"))
                ?.slice(2) || "(untitled)";

            atoms.push({
              hash: result.hash.slice(0, 12),
              score: result.score.toFixed(2),
              domain: aku.meta.domain,
              type: aku.meta.type,
              title,
              // Include first 500 chars of body for context
              preview: aku.body.slice(0, 500) + (aku.body.length > 500 ? "..." : ""),
            });

            if (atoms.length >= limit) break;
          }
        }

        return {
          content: [
            {
              type: "text",
              text:
                atoms.length > 0
                  ? `Found ${atoms.length} relevant atoms:\n\n` +
                    atoms
                      .map(
                        (a, i) =>
                          `### ${i + 1}. ${a.title}\n` +
                          `**Domain:** ${a.domain} | **Type:** ${a.type} | **Score:** ${a.score}\n\n` +
                          `${a.preview}\n`
                      )
                      .join("\n---\n\n")
                  : `No atoms found matching "${query}"`,
            },
          ],
        };
      }

      case "substrate_get": {
        const hash = args?.hash as string;

        // Try to find by prefix
        let fullHash = hash;
        if (hash.length < 64) {
          for await (const h of substrate.list()) {
            if (h.startsWith(hash)) {
              fullHash = h;
              break;
            }
          }
        }

        const aku = await substrate.get(fullHash as any);
        if (!aku) {
          return {
            content: [{ type: "text", text: `Atom not found: ${hash}` }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text:
                `# Atom: ${aku.id.slice(0, 12)}...\n\n` +
                `**Domain:** ${aku.meta.domain}\n` +
                `**Type:** ${aku.meta.type}\n` +
                `**Confidence:** ${aku.meta.confidence}\n` +
                `**Tags:** ${aku.meta.tags.join(", ")}\n` +
                `**Created:** ${aku.meta.created}\n\n` +
                `---\n\n${aku.body}`,
            },
          ],
        };
      }

      case "substrate_list": {
        const domain = args?.domain as string | undefined;
        const type = args?.type as string | undefined;
        const limit = (args?.limit as number) || 20;

        const atoms = [];
        // Use domainPrefix for prefix matching (e.g., "singularity" matches all singularity/* atoms)
        for await (const hash of substrate.list({ domainPrefix: domain, type: type as any, limit })) {
          const aku = await substrate.get(hash);
          if (aku) {
            const title =
              aku.body
                .split("\n")
                .find((l) => l.startsWith("#"))
                ?.slice(2) || "(untitled)";
            atoms.push({
              hash: hash.slice(0, 12),
              domain: aku.meta.domain,
              type: aku.meta.type,
              title,
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text:
                `Listing ${atoms.length} atoms:\n\n` +
                atoms.map((a) => `- **${a.title}** (${a.domain}) [${a.type}]`).join("\n"),
            },
          ],
        };
      }

      case "substrate_stats": {
        const stats = await substrate.stats();

        return {
          content: [
            {
              type: "text",
              text:
                `# Knowledge Substrate Statistics\n\n` +
                `**Total Atoms:** ${stats.totalAtoms}\n` +
                `**Total Links:** ${stats.totalLinks}\n` +
                `**Disk Usage:** ${(stats.diskUsage / 1024).toFixed(2)} KB\n` +
                `**Oldest:** ${stats.oldestAtom || "N/A"}\n` +
                `**Newest:** ${stats.newestAtom || "N/A"}\n\n` +
                `## By Type\n` +
                Object.entries(stats.byType)
                  .map(([type, count]) => `- ${type}: ${count}`)
                  .join("\n") +
                `\n\n## By Domain\n` +
                Object.entries(stats.byDomain)
                  .map(([domain, count]) => `- ${domain}: ${count}`)
                  .join("\n"),
            },
          ],
        };
      }

      case "substrate_recent": {
        const limit = (args?.limit as number) || 10;
        const hashes = indexes.recent(limit);

        const atoms = [];
        for (const hash of hashes) {
          const aku = await substrate.get(hash);
          if (aku) {
            const title =
              aku.body
                .split("\n")
                .find((l) => l.startsWith("#"))
                ?.slice(2) || "(untitled)";
            atoms.push({
              hash: hash.slice(0, 12),
              created: aku.meta.created.slice(0, 19),
              domain: aku.meta.domain,
              title,
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text:
                `# Recent Atoms\n\n` +
                atoms
                  .map((a) => `- **${a.title}**\n  ${a.created} | ${a.domain}`)
                  .join("\n\n"),
            },
          ],
        };
      }

      case "substrate_ingest": {
        const body = args?.body as string;
        const domain = args?.domain as string;
        const type = args?.type as string;
        const tags = (args?.tags as string[]) || [];
        const confidence = (args?.confidence as number) || 0.8;

        const hash = await substrate.ingest({
          body,
          domain,
          type: type as any,
          tags,
          confidence,
        });

        // Index the new atom
        const aku = await substrate.get(hash);
        if (aku) {
          indexes.indexAKU(aku);
        }

        return {
          content: [
            {
              type: "text",
              text:
                `✓ Knowledge crystallized!\n\n` +
                `**Hash:** ${hash.slice(0, 12)}...\n` +
                `**Domain:** ${domain}\n` +
                `**Type:** ${type}\n\n` +
                `The atom is now searchable and retrievable.`,
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// === RESOURCE HANDLERS (for browsing substrate) ===

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const root = getRoot();
    const substrate = openSubstrate(root);

    const resources = [];
    let count = 0;

    for await (const hash of substrate.list({ limit: 50 })) {
      const aku = await substrate.get(hash);
      if (aku) {
        const title =
          aku.body
            .split("\n")
            .find((l) => l.startsWith("#"))
            ?.slice(2) || hash.slice(0, 12);

        resources.push({
          uri: `omnimind://atom/${hash}`,
          name: title,
          description: `${aku.meta.domain} (${aku.meta.type})`,
          mimeType: "text/markdown",
        });

        count++;
      }
    }

    return { resources };
  } catch {
    return { resources: [] };
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    const root = getRoot();
    const substrate = openSubstrate(root);

    // Parse URI: omnimind://atom/{hash}
    const match = uri.match(/^omnimind:\/\/atom\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid URI: ${uri}`);
    }

    const hash = match[1];
    const aku = await substrate.get(hash as any);

    if (!aku) {
      throw new Error(`Atom not found: ${hash}`);
    }

    const content =
      `---\n` +
      `id: ${aku.id}\n` +
      `domain: ${aku.meta.domain}\n` +
      `type: ${aku.meta.type}\n` +
      `confidence: ${aku.meta.confidence}\n` +
      `tags: [${aku.meta.tags.join(", ")}]\n` +
      `created: ${aku.meta.created}\n` +
      `---\n\n` +
      aku.body;

    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : String(error)}`);
  }
});

// === START SERVER ===

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OMNIMIND Substrate MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
