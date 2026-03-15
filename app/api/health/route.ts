import { NextResponse } from "next/server";
import { getConnectionFromRequest } from "@/utils/fauna-client";

/** Minimal FQL that returns a value; used to verify the database is reachable. */
async function ping(endpoint: string, secret: string): Promise<boolean> {
  const url = endpoint.replace(/\/$/, "") + "/query/1";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "1" }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { error?: unknown };
  return !data?.error;
}

export async function GET(request: Request) {
  const conn = getConnectionFromRequest(request);
  if (!conn?.endpoint?.trim() || !conn?.secret?.trim()) {
    return NextResponse.json(
      { ok: false, error: "No active connection" },
      { status: 401 }
    );
  }
  try {
    const ok = await ping(conn.endpoint.trim(), conn.secret.trim());
    return NextResponse.json(
      { ok },
      { status: ok ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Health check failed" },
      { status: 503 }
    );
  }
}
