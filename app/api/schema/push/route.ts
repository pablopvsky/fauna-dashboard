import { NextResponse } from "next/server";
import { getConnectionFromRequest } from "@/utils/fauna-client";
import { getSchemaBaseUrl, updateSchemaFiles } from "@/utils/schema-api";

const NO_CONNECTION_MESSAGE = "No connection. Set and activate a connection on Home.";

type PushBody = {
  files?: Record<string, string>;
  active?: boolean;
};

export async function POST(request: Request) {
  const conn = getConnectionFromRequest(request);
  if (!conn?.endpoint?.trim() || !conn?.secret?.trim()) {
    return NextResponse.json(
      { error: NO_CONNECTION_MESSAGE },
      { status: 401 }
    );
  }
  let body: PushBody;
  try {
    body = (await request.json()) as PushBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const files = body.files && typeof body.files === "object" ? body.files : undefined;
  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json(
      { error: "Body must include 'files' (object of filename -> content)" },
      { status: 400 }
    );
  }
  for (const [filename, content] of Object.entries(files)) {
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: `File "${filename}" must have string content` },
        { status: 400 }
      );
    }
  }
  try {
    const baseUrl = getSchemaBaseUrl(conn.endpoint);
    await updateSchemaFiles(baseUrl, conn.secret, files, {
      staged: !body.active,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to push schema";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
