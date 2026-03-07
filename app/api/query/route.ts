import { NextResponse } from "next/server";
import { fql } from "fauna";
import { severClient } from "@/utils/fauna-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Missing or empty query", code: "invalid_request" },
        { status: 400 }
      );
    }

    const faunaQuery = fql([query]);
    const response = await severClient.query(faunaQuery);
    const isSuccess = response && typeof response === "object" && "data" in response;

    if (isSuccess) {
      const successResponse = response as { data: unknown; compute_ops?: number; read_ops?: number; write_ops?: number; query_time_ms?: number };
      return NextResponse.json({
        success: true,
        data: successResponse.data,
        stats: {
          compute_ops: successResponse.compute_ops,
          read_ops: successResponse.read_ops,
          write_ops: successResponse.write_ops,
          query_time_ms: successResponse.query_time_ms,
        },
      });
    }

    const failureResponse = response as { error?: { message?: string; code?: string } };
    return NextResponse.json(
      {
        success: false,
        error: failureResponse.error?.message ?? "Query failed",
        code: failureResponse.error?.code,
      },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : undefined;
    return NextResponse.json(
      { success: false, error: message, code: code ?? "server_error" },
      { status: 500 }
    );
  }
}
