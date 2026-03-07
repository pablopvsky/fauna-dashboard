import { NextResponse } from "next/server";
import { fql } from "fauna";
import { severClient } from "@/utils/fauna-client";

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

async function runUpdate(collection: string, id: string, data: unknown) {
  if (!isValidCollectionName(collection) || !isValidDocumentId(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid collection name or document id", code: "invalid_request" },
      { status: 400 }
    );
  }
  const payload = stripMetadataFields(data);
  const response = await severClient.query(
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

async function runDelete(collection: string, id: string) {
  if (!isValidCollectionName(collection) || !isValidDocumentId(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid collection name or document id", code: "invalid_request" },
      { status: 400 }
    );
  }
  const response = await severClient.query(
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const updatePayload = body?.update as { collection?: string; id?: string; data?: unknown } | undefined;
    if (updatePayload && typeof updatePayload.collection === "string" && typeof updatePayload.id === "string") {
      return runUpdate(
        updatePayload.collection,
        updatePayload.id,
        updatePayload.data
      );
    }

    const deletePayload = body?.delete as { collection?: string; id?: string } | undefined;
    if (deletePayload && typeof deletePayload.collection === "string" && typeof deletePayload.id === "string") {
      return runDelete(deletePayload.collection, deletePayload.id);
    }

    return NextResponse.json(
      { success: false, error: "Missing or invalid body: use { update: { collection, id, data } } or { delete: { collection, id } }", code: "invalid_request" },
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
