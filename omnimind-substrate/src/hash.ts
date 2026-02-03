/**
 * OMNIMIND Knowledge Substrate - Content Hashing
 *
 * Content-addressed identity: the hash IS the identity.
 * Deterministic, canonical serialization ensures same content = same hash.
 */

import { createHash } from "node:crypto";
import type { AKUMeta, ContentHash } from "./types.js";

/**
 * Canonical serialization of AKU metadata.
 * Sorted keys ensure deterministic output.
 * Excludes temporal fields (created, source.timestamp) for proper deduplication.
 *
 * Design rationale: The hash is KNOWLEDGE IDENTITY, not discovery event identity.
 * Same knowledge discovered at different times should have same hash.
 */
function canonicalizeMeta(meta: AKUMeta): string {
  // Create a copy without temporal fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { created, source, ...semanticMeta } = meta;

  // Include source but without timestamp
  const semanticSource = source ? {
    type: source.type,
    uri: source.uri,
    session: source.session,
    citation: source.citation,
  } : undefined;

  const metaForHash = {
    ...semanticMeta,
    ...(semanticSource && { source: semanticSource }),
  };

  // Sort all keys recursively for deterministic output
  const sortedMeta = sortObject(metaForHash);
  return JSON.stringify(sortedMeta);
}

/**
 * Recursively sort object keys for deterministic serialization.
 * Also sorts arrays of primitives (strings, numbers) for canonical ordering.
 */
function sortObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const mapped = obj.map(sortObject);
    // Sort arrays of primitives for deterministic output (e.g., tags)
    if (mapped.length > 0 && mapped.every(
      (item) => typeof item === "string" || typeof item === "number"
    )) {
      return [...mapped].sort();
    }
    return mapped;
  }

  if (typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }

  return obj;
}

/**
 * Normalize body text for consistent hashing.
 * - Trim whitespace
 * - Normalize line endings to LF
 * - Remove trailing whitespace from lines
 */
function normalizeBody(body: string): string {
  return body
    .replace(/\r\n/g, "\n")       // CRLF -> LF
    .replace(/\r/g, "\n")          // CR -> LF
    .split("\n")
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .join("\n")
    .trim();                       // Trim start/end
}

/**
 * Create canonical representation of an AKU for hashing.
 * Format: YAML-like header + separator + body
 */
export function canonicalize(meta: AKUMeta, body: string): string {
  const canonicalMeta = canonicalizeMeta(meta);
  const canonicalBody = normalizeBody(body);

  // Use a unique separator that won't appear in content
  return `---AKU-META---\n${canonicalMeta}\n---AKU-BODY---\n${canonicalBody}`;
}

/**
 * Compute SHA-256 hash of canonical AKU content.
 * Returns lowercase hex string (64 characters).
 */
export function computeHash(meta: AKUMeta, body: string): ContentHash {
  const canonical = canonicalize(meta, body);
  const hash = createHash("sha256");
  hash.update(canonical, "utf8");
  return hash.digest("hex");
}

/**
 * Compute hash of arbitrary string content.
 * Useful for hashing raw content before full AKU construction.
 */
export function hashString(content: string): ContentHash {
  const hash = createHash("sha256");
  hash.update(content, "utf8");
  return hash.digest("hex");
}

/**
 * Verify that a hash matches the content.
 */
export function verifyHash(
  hash: ContentHash,
  meta: AKUMeta,
  body: string
): boolean {
  const computed = computeHash(meta, body);
  return computed === hash;
}

/**
 * Get shard path for a hash.
 * Uses first N characters as directory prefix for filesystem scaling.
 */
export function getShardPath(hash: ContentHash, depth: number = 2): string {
  return hash.slice(0, depth);
}

/**
 * Validate hash format.
 */
export function isValidHash(hash: string): hash is ContentHash {
  return /^[a-f0-9]{64}$/.test(hash);
}
