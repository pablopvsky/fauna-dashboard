/**
 * Schema API: base URL derivation and helpers for Fauna Core HTTP Schema endpoints.
 * @see https://docs.faunadb.org/fauna/current/learn/schema/manage-schema/
 */

/**
 * Returns the base URL for Fauna Schema HTTP API (no trailing slash).
 * - Cloud (graphql.fauna.com / db.fauna.com): use https://db.fauna.com
 * - Self-hosted / local: use same origin as endpoint + /schema/1
 */
export function getSchemaBaseUrl(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    // Fauna Cloud query endpoint is often graphql.fauna.com; schema lives on db.fauna.com
    if (host.includes("graphql.fauna.com") || host === "db.fauna.com") {
      return "https://db.fauna.com/schema/1";
    }
    if (host.includes("fauna.com")) {
      return "https://db.fauna.com/schema/1";
    }
    return `${url.origin}/schema/1`;
  } catch {
    return trimmed + "/schema/1";
  }
}

export type StagedSchemaStatus = "pending" | "ready" | "failed" | null;

/**
 * GET staged schema status.
 * Fauna: GET /schema/1/staged/status
 * Returns null when there is no staged schema.
 */
export async function getStagedSchemaStatus(
  baseUrl: string,
  secret: string
): Promise<{ status: StagedSchemaStatus; raw?: unknown }> {
  const res = await fetch(`${baseUrl}/staged/status`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (res.status === 404 || res.status === 204) {
    return { status: null };
  }
  if (!res.ok) {
    const text = await res.text();
    let raw: unknown;
    try {
      raw = text ? JSON.parse(text) : undefined;
    } catch {
      raw = text;
    }
    throw new Error(text || res.statusText);
  }
  const data = (await res.json()) as { status?: string };
  const status = data.status as StagedSchemaStatus | undefined;
  return {
    status: status === "pending" || status === "ready" || status === "failed" ? status : null,
    raw: data,
  };
}

/**
 * GET schema file names (list of .fsl filenames).
 */
export async function getSchemaFileNames(
  baseUrl: string,
  secret: string,
  options?: { staged?: boolean }
): Promise<string[]> {
  const url = new URL(baseUrl + "/files");
  if (options?.staged === true) url.searchParams.set("staged", "true");
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const data = (await res.json()) as { files?: (string | { filename?: string })[] };
  const raw = Array.isArray(data.files) ? data.files : [];
  return raw.map((f) => (typeof f === "string" ? f : f?.filename ?? "")).filter(Boolean);
}

/**
 * GET a single schema file content by name.
 * Fauna Core API: GET /schema/1/files/{filename} (path param, not query).
 * Response is JSON: { version, content }.
 * @see https://docs.faunadb.org/fauna/current/reference/http/reference/core-api/#tag/Schema/operation/get-schema-file
 */
export async function getSchemaFile(
  baseUrl: string,
  secret: string,
  filename: string,
  options?: { staged?: boolean }
): Promise<string> {
  const pathSegment = encodeURIComponent(filename);
  const url = new URL(`${baseUrl}/files/${pathSegment}`);
  if (options?.staged === true) url.searchParams.set("staged", "true");
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { content?: string; body?: string; data?: string };
    if (typeof data.content === "string") return data.content;
    if (typeof data.body === "string") return data.body;
    if (typeof data.data === "string") return data.data;
  } catch {
    // not JSON, return as plain text
  }
  return text;
}

/**
 * POST update schema files (push). staged=true by default.
 */
export async function updateSchemaFiles(
  baseUrl: string,
  secret: string,
  files: Record<string, string>,
  options?: { staged?: boolean }
): Promise<{ ok: boolean; raw?: unknown }> {
  const staged = options?.staged !== false;
  const url = `${baseUrl}/update?staged=${staged}`;
  const form = new FormData();
  for (const [name, content] of Object.entries(files)) {
    form.append(name, new Blob([content], { type: "text/plain" }), name);
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  let raw: unknown;
  const text = await res.text();
  try {
    raw = text ? JSON.parse(text) : undefined;
  } catch {
    raw = text;
  }
  return { ok: true, raw };
}

/**
 * POST commit staged schema. Fauna: POST /schema/1/staged/commit
 */
export async function commitStagedSchema(
  baseUrl: string,
  secret: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${baseUrl}/staged/commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return { ok: true };
}

/**
 * POST abandon staged schema. Fauna: POST /schema/1/staged/abandon
 */
export async function abandonStagedSchema(
  baseUrl: string,
  secret: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${baseUrl}/staged/abandon`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return { ok: true };
}
