import { NextResponse } from "next/server";

/**
 * Returns server config for the UI. Used so that when the dashboard runs in
 * Docker alongside the faunadb container, FAUNA_DEFAULT_ENDPOINT can be set to
 * http://faunadb:8443 (container hostname) and the Auth page suggests that URL.
 */
export async function GET() {
  const defaultEndpoint =
    process.env.FAUNA_DEFAULT_ENDPOINT?.trim() || "http://localhost:8443";
  return NextResponse.json({ defaultEndpoint });
}
