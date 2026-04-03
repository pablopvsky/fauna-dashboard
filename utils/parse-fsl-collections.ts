/**
 * Best-effort parse of Fauna FSL for collection names, field/property lines, and index names.
 * Matches the same .fsl sources as the Schema page (remote schema files).
 */

export type ParsedField = { name: string; definition: string };

export type ParsedIndex = { name: string; summary?: string };

export type ParsedCollection = {
  name: string;
  fields: ParsedField[];
  indexes: ParsedIndex[];
};

/** Extract inner text for a `{` … `}` block starting at openBraceIndex, honoring strings. */
function sliceBraceBlock(
  s: string,
  openBraceIndex: number,
): { inner: string; end: number } | null {
  if (s[openBraceIndex] !== "{") return null;
  let depth = 1;
  let i = openBraceIndex + 1;
  const innerStart = i;
  while (i < s.length && depth > 0) {
    const c = s[i];
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < s.length) {
        if (s[i] === "\\") {
          i += 2;
          continue;
        }
        if (s[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    i++;
  }
  if (depth !== 0) return null;
  return { inner: s.slice(innerStart, i - 1), end: i };
}

function parseFieldsBlock(inner: string): ParsedField[] {
  const fields: ParsedField[] = [];
  for (const line of inner.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("//")) continue;
    const m = /^(\w+)\s*:\s*(.+)$/.exec(t);
    if (m) {
      fields.push({ name: m[1], definition: m[2].trim() });
    }
  }
  return fields;
}

function parseCollectionBody(body: string): {
  fields: ParsedField[];
  indexes: ParsedIndex[];
} {
  const fieldByName = new Map<string, ParsedField>();

  const fieldsKeyword = /\bfields\s*\{/g;
  let fm: RegExpExecArray | null;
  while ((fm = fieldsKeyword.exec(body)) !== null) {
    const open = fm.index + fm[0].length - 1;
    const blk = sliceBraceBlock(body, open);
    if (!blk) continue;
    for (const f of parseFieldsBlock(blk.inner)) {
      fieldByName.set(f.name, f);
    }
    fieldsKeyword.lastIndex = blk.end;
  }

  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("//")) continue;
    const m = /^field\s+(\w+)\s*:\s*(.+)$/.exec(t);
    if (m) {
      fieldByName.set(m[1], { name: m[1], definition: m[2].trim() });
    }
  }

  const indexes: ParsedIndex[] = [];
  const indexRe = /\bindex\s+([A-Za-z_]\w*)\s*\{/g;
  let im: RegExpExecArray | null;
  while ((im = indexRe.exec(body)) !== null) {
    const name = im[1];
    const open = im.index + im[0].length - 1;
    const blk = sliceBraceBlock(body, open);
    if (!blk) continue;
    const summary = blk.inner
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//"))
      .slice(0, 3)
      .join(" · ");
    indexes.push({ name, summary: summary || undefined });
    indexRe.lastIndex = blk.end;
  }

  return {
    fields: [...fieldByName.values()],
    indexes,
  };
}

/**
 * Parse concatenated FSL (all schema files). Ignores duplicates by collection name (last wins).
 */
export function parseFslCollections(fsl: string): ParsedCollection[] {
  const byName = new Map<string, ParsedCollection>();
  const collRe = /\bcollection\s+([A-Za-z_]\w*)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = collRe.exec(fsl)) !== null) {
    const name = m[1];
    const open = m.index + m[0].length - 1;
    const blk = sliceBraceBlock(fsl, open);
    if (!blk) continue;
    const { fields, indexes } = parseCollectionBody(blk.inner);
    byName.set(name, { name, fields, indexes });
    collRe.lastIndex = blk.end;
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
