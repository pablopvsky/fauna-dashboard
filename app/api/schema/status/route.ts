import { NextResponse } from "next/server";
import { getConnectionFromRequest } from "@/utils/fauna-client";
import { getSchemaBaseUrl, getStagedSchemaStatus } from "@/utils/schema-api";

const NO_CONNECTION_MESSAGE = "No connection. Set and activate a connection on Home.";

export async function GET(request: Request) {
  const conn = getConnectionFromRequest(request);
  if (!conn?.endpoint?.trim() || !conn?.secret?.trim()) {
    return NextResponse.json(
      { error: NO_CONNECTION_MESSAGE },
      { status: 401 }
    );
  }
  try {
    const baseUrl = getSchemaBaseUrl(conn.endpoint);
    const { status, raw } = await getStagedSchemaStatus(baseUrl, conn.secret);
    return NextResponse.json({ status, raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get schema status";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
