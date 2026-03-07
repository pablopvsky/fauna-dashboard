#!/usr/bin/env node
/**
 * Reads FSL schema (path from FAUNA_SCHEMA_PATH, argv, or default schema/main.fsl),
 * parses collections and Ref<> relations, and writes utils/schema-graph-data.ts.
 *
 * Usage: node scripts/build-schema-graph.mjs [path/to/schema.fsl]
 * Env:   FAUNA_SCHEMA_PATH (relative to project root) – see .env.example
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    // ignore missing .env
  }
}
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const schemaPathRaw = process.env.FAUNA_SCHEMA_PATH || process.argv[2] || "schema/main.fsl";
const schemaPath = path.isAbsolute(schemaPathRaw)
  ? path.normalize(schemaPathRaw)
  : path.resolve(root, schemaPathRaw);
const outPath = path.resolve(root, "utils/schema-graph-data.ts");

if (!fs.existsSync(schemaPath)) {
  console.error("Error: Schema file not found.");
  console.error("  Tried: " + schemaPath);
  console.error("  Set FAUNA_SCHEMA_PATH in .env (absolute or relative to project root), e.g.:");
  console.error("  FAUNA_SCHEMA_PATH=/path/to/other-repo/schema/main.fsl");
  console.error("  Or run: node scripts/build-schema-graph.mjs /path/to/schema/main.fsl");
  process.exit(1);
}

const content = fs.readFileSync(schemaPath, "utf-8");

// Extract collection names and their Ref<> relations (field -> target collection)
const collections = [];
const relations = []; // { source, target, label }

// Match "collection NAME {" then parse until matching "}" at same brace level
let i = 0;
const len = content.length;

function skipWhitespace() {
  while (i < len && /\s/.test(content[i])) i++;
}

function skipLineComment() {
  if (content.slice(i, i + 2) === "//") {
    while (i < len && content[i] !== "\n") i++;
  }
}

function skipBlockComment() {
  if (content.slice(i, i + 2) === "/*") {
    i += 2;
    while (i < len - 1 && content.slice(i, i + 2) !== "*/") i++;
    if (i < len - 1) i += 2;
  }
}

function nextToken() {
  skipWhitespace();
  while (i < len && (content.slice(i, i + 2) === "//" || content.slice(i, i + 2) === "/*")) {
    skipLineComment();
    skipBlockComment();
    skipWhitespace();
  }
  if (i >= len) return null;
  const start = i;
  if (/[a-zA-Z_][a-zA-Z0-9_]*/.test(content[i])) {
    while (i < len && /[a-zA-Z0-9_]/.test(content[i])) i++;
    return content.slice(start, i);
  }
  if (content[i] === "{") {
    i++;
    return "{";
  }
  if (content[i] === "}") {
    i++;
    return "}";
  }
  if (content[i] === ":") {
    i++;
    return ":";
  }
  if (content[i] === "?") {
    i++;
    return "?";
  }
  i++;
  return content[start];
}

// Parse collection blocks: find "collection" keyword then name then "{"
let pos = 0;
const collectionRegex = /collection\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/g;
let match;
while ((match = collectionRegex.exec(content)) !== null) {
  const name = match[1];
  const blockStart = match.index + match[0].length;
  let depth = 1;
  let angleDepth = 0;
  let blockEnd = blockStart;
  for (let j = blockStart; j < content.length && depth > 0; j++) {
    const c = content[j];
    if (c === "<") angleDepth++;
    else if (c === ">") angleDepth--;
    else if (angleDepth === 0) {
      if (c === "{") depth++;
      else if (c === "}") depth--;
    }
    if (depth === 0) {
      blockEnd = j;
      break;
    }
  }
  const block = content.slice(blockStart, blockEnd);
  collections.push(name);

  // In block, find lines like "  fieldName: Ref<target>" or "  fieldName: Array<Ref<target>>"
  // Only at top level (no nested { on the same line or we're inside a nested block)
  const refRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(?:Array<)?Ref<([a-zA-Z_][a-zA-Z0-9_]*)>/gm;
  let refMatch;
  while ((refMatch = refRegex.exec(block)) !== null) {
    const fieldName = refMatch[1];
    const targetCollection = refMatch[2];
    relations.push({ source: name, target: targetCollection, label: fieldName });
  }
}

// Build nodes with grid layout (same order as collections)
const COLS = 4;
const DX = 280;
const DY = 180;

const nodes = collections.map((id, index) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    id,
    type: "neuron",
    position: { x: col * DX, y: row * DY },
    data: { label: id },
  };
});

// Build edges with unique ids
const edgeIds = new Set();
const edges = relations.map((r) => {
  let eid = `e-${r.source}-${r.label}-${r.target}`;
  let suffix = 0;
  while (edgeIds.has(eid)) eid = `e-${r.source}-${r.label}-${r.target}-${++suffix}`;
  edgeIds.add(eid);
  return {
    id: eid,
    source: r.source,
    target: r.target,
    animated: true,
    data: { label: r.label },
  };
});

const out = `// Auto-generated by scripts/build-schema-graph.mjs – do not edit by hand.
// Run: pnpm build:schema-graph (or node scripts/build-schema-graph.mjs)
// Output: utils/schema-graph-data.ts

import type { Node, Edge } from "@xyflow/react";

export const SCHEMA_NODES: Node[] = ${JSON.stringify(nodes, null, 2)};

export const SCHEMA_EDGES: Edge[] = ${JSON.stringify(edges, null, 2)};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, "utf-8");

console.log(`Schema graph: ${collections.length} nodes, ${edges.length} edges`);
console.log(`Written: ${path.relative(root, outPath)}`);
