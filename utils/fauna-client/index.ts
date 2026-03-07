import { Client, fql } from "fauna";

export type Pagination = {
  cursor?: number;
  size?: number;
};

/** Header names for dashboard credentials (see utils/fauna-auth-store) */
const FAUNA_ENDPOINT_HEADER = "x-fauna-endpoint";
const FAUNA_SECRET_HEADER = "x-fauna-secret";

/**
 * Returns endpoint and secret from the request (active connection from Home).
 * Only reads request headers; no process.env fallback. Dashboard uses connections only.
 */
export function getConnectionFromRequest(request: Request): { endpoint: string; secret: string } | null {
  const endpoint = request.headers.get(FAUNA_ENDPOINT_HEADER)?.trim();
  const secret = request.headers.get(FAUNA_SECRET_HEADER)?.trim();
  if (secret && endpoint) {
    return { endpoint, secret };
  }
  return null;
}

/**
 * Returns a Fauna client for this request from the active connection (headers only).
 * Returns null when no connection headers are sent; API routes must then return 401.
 */
export function getClient(request: Request): Client | null {
  const conn = getConnectionFromRequest(request);
  if (!conn) return null;
  return new Client({
    secret: conn.secret,
    endpoint: new URL(conn.endpoint),
  });
}

export * from "./collections";

