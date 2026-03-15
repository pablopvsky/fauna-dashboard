import { NextResponse } from "next/server";
import { getConnectionFromRequest } from "@/utils/fauna-client";
import { getSchemaBaseUrl, commitStagedSchema } from "@/utils/schema-api";

const NO_CONNECTION_MESSAGE = "No connection. Set and activate a connection on Home.";

export async function POST(request: Request) {
  const conn = getConnectionFromRequest(request);
  if (!conn?.endpoint?.trim() || !conn?.secret?.trim()) {
    return NextResponse.json(
      { error: NO_CONNECTION_MESSAGE },
      { status: 401 }
    );
  }
  try {
    const baseUrl = getSchemaBaseUrl(conn.endpoint);
    await commitStagedSchema(baseUrl, conn.secret);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to commit schema";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
