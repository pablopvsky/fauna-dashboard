import { NextResponse } from "next/server";
import { fql } from "fauna";
import type { Client } from "fauna";
import { getClient, getConnectionFromRequest } from "@/utils/fauna-client";

/** Collection name: letters, numbers, underscore (matches FSL collection names) */
function isValidCollectionName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) && name.length <= 128;
}

/** Fauna document IDs are numeric strings */
function isValidDocumentId(id: string): boolean {
  return /^\d+$/.test(id) && id.length >= 1 && id.length <= 32;
}

/** Fauna does not allow updating metadata fields (id, coll, ts). Strip them from the payload. */
function stripMetadataFields(data: unknown): unknown {
  if (data === null || typeof data !== "object") return data;
  const obj = data as Record<string, unknown>;
  const out = { ...obj };
  delete out.id;
  delete out.coll;
  delete out.ts;
  return out;
}

async function runUpdate(client: Client, collection: string, id: string, data: unknown) {
  if (!isValidCollectionName(collection) || !isValidDocumentId(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid collection name or document id", code: "invalid_request" },
      { status: 400 }
    );
  }
  const payload = stripMetadataFields(data);
  const response = await client.query(
    fql`Collection(${collection})!.byId(${id})!.update(${payload})`
  );
  const res = response as { data?: unknown; error?: { message?: string; code?: string } };
  if (res.error) {
    return NextResponse.json(
      { success: false, error: res.error.message ?? "Update failed", code: res.error.code },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true, data: res.data });
}

async function runDelete(client: Client, collection: string, id: string) {
  if (!isValidCollectionName(collection) || !isValidDocumentId(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid collection name or document id", code: "invalid_request" },
      { status: 400 }
    );
  }
  const response = await client.query(
    fql`Collection(${collection})!.byId(${id})!.delete()`
  );
  const res = response as { data?: unknown; error?: { message?: string; code?: string } };
  if (res.error) {
    return NextResponse.json(
      { success: false, error: res.error.message ?? "Delete failed", code: res.error.code },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true, data: res.data });
}

/** Proxy a raw FQL query string to Fauna HTTP API (for shell). */
async function runQuery(
  endpoint: string,
  secret: string,
  queryString: string
): Promise<Response> {
  const url = endpoint.replace(/\/$/, "") + "/query/1";
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: queryString }),
  });
}

const NO_CONNECTION_MESSAGE = "No connection. Set and activate a connection on Home.";

export async function POST(request: Request) {
  try {
    const client = getClient(request);
    const conn = getConnectionFromRequest(request);
    const body = (await request.json()) as Record<string, unknown>;

    const updatePayload = body?.update as { collection?: string; id?: string; data?: unknown } | undefined;
    if (updatePayload && typeof updatePayload.collection === "string" && typeof updatePayload.id === "string") {
      if (!client) {
        return NextResponse.json(
          { success: false, error: NO_CONNECTION_MESSAGE, code: "invalid_request" },
          { status: 401 }
        );
      }
      return runUpdate(
        client,
        updatePayload.collection,
        updatePayload.id,
        updatePayload.data
      );
    }

    const deletePayload = body?.delete as { collection?: string; id?: string } | undefined;
    if (deletePayload && typeof deletePayload.collection === "string" && typeof deletePayload.id === "string") {
      if (!client) {
        return NextResponse.json(
          { success: false, error: NO_CONNECTION_MESSAGE, code: "invalid_request" },
          { status: 401 }
        );
      }
      return runDelete(client, deletePayload.collection, deletePayload.id);
    }

    const queryString = typeof body?.query === "string" ? body.query.trim() : "";
    if (queryString) {
      if (!conn) {
        return NextResponse.json(
          { success: false, error: NO_CONNECTION_MESSAGE, code: "invalid_request" },
          { status: 401 }
        );
      }
      const res = await runQuery(conn.endpoint, conn.secret, queryString);
      const text = await res.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        return NextResponse.json(
          { success: false, error: `Fauna returned non-JSON (${res.status}). ${text.slice(0, 200)}`, code: "invalid_response" },
          { status: 502 }
        );
      }
      const status = res.ok ? 200 : (res.status >= 400 ? res.status : 400);
      return NextResponse.json(data, { status });
    }

    return NextResponse.json(
      { success: false, error: "Missing or invalid body: use { query: \"...\" } or { update: ... } or { delete: ... }", code: "invalid_request" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const errObj = err && typeof err === "object" ? (err as Record<string, unknown>) : {};
    const code = "code" in errObj ? String(errObj.code) : undefined;
    const httpStatus = "httpStatus" in errObj ? Number(errObj.httpStatus) : undefined;
    const constraintFailures = "constraint_failures" in errObj ? errObj.constraint_failures : undefined;
    const status = httpStatus === 400 || code === "constraint_failure" ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: code ?? "server_error",
        ...(Array.isArray(constraintFailures) && constraintFailures.length > 0 && { constraint_failures: constraintFailures }),
      },
      { status }
    );
  }
}
