import { NextResponse } from "next/server";
import {
  getCollectionDocuments,
  getCollectionDocumentById,
} from "@/utils/fauna-client";

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 50;

/** Allowed collection name: letters, numbers, underscore (matches FSL collection names) */
function isValidCollectionName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) && name.length <= 128;
}

/** Fauna document IDs are numeric strings */
function isValidDocumentId(id: string): boolean {
  return /^\d+$/.test(id) && id.length >= 1 && id.length <= 32;
}

/** Fauna byId returns { ref, cause: "not found" } when document is missing; treat as not found */
function isFaunaNotFound(doc: unknown): boolean {
  if (doc === null || doc === undefined) return true;
  if (typeof doc !== "object") return false;
  const o = doc as Record<string, unknown>;
  return typeof o.cause === "string" && o.cause.toLowerCase().includes("not found");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const { searchParams } = new URL(_request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10),
      ),
    );

    if (!name || !isValidCollectionName(name)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing collection name" },
        { status: 400 },
      );
    }

    const idParam = searchParams.get("id")?.trim();
    if (idParam !== null && idParam !== undefined && idParam !== "") {
      if (!isValidDocumentId(idParam)) {
        return NextResponse.json(
          { success: false, error: "Invalid document ID" },
          { status: 400 },
        );
      }
      const response = await getCollectionDocumentById(name, idParam);
      const doc = (response as { data?: unknown })?.data;
      if (doc === null || doc === undefined || isFaunaNotFound(doc)) {
        return NextResponse.json({
          success: true,
          data: [],
          byId: idParam,
          error: "Not found",
        });
      }
      return NextResponse.json({
        success: true,
        data: [doc],
        byId: idParam,
      });
    }

    const offset = (page - 1) * pageSize;
    const take = pageSize + 1;
    const response = await getCollectionDocuments({
      name,
      cursor: offset,
      size: take,
    });

    const pageResult = (response as { data?: { data?: unknown[]; after?: string } })
      ?.data;
    const raw = pageResult?.data;
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { success: false, error: "Unexpected response shape from Fauna" },
        { status: 502 },
      );
    }

    const hasMore = raw.length > pageSize;
    const data = hasMore ? raw.slice(0, pageSize) : raw;

    return NextResponse.json({
      success: true,
      data,
      page,
      pageSize,
      hasMore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : undefined;
    return NextResponse.json(
      { success: false, error: message, code: code ?? "server_error" },
      { status: 500 },
    );
  }
}
