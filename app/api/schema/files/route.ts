import { NextResponse } from "next/server";
import { getConnectionFromRequest } from "@/utils/fauna-client";
import { getSchemaBaseUrl, getSchemaFileNames, getSchemaFile } from "@/utils/schema-api";

const NO_CONNECTION_MESSAGE = "No connection. Set and activate a connection on Home.";

export async function GET(request: Request) {
  const conn = getConnectionFromRequest(request);
  if (!conn?.endpoint?.trim() || !conn?.secret?.trim()) {
    return NextResponse.json(
      { error: NO_CONNECTION_MESSAGE },
      { status: 401 }
    );
  }
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const staged = searchParams.get("staged") === "true";
  try {
    const baseUrl = getSchemaBaseUrl(conn.endpoint);
    if (name?.trim()) {
      const content = await getSchemaFile(baseUrl, conn.secret, name.trim(), { staged });
      return new NextResponse(content, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const files = await getSchemaFileNames(baseUrl, conn.secret, { staged });
    return NextResponse.json({ files });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get schema files";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
