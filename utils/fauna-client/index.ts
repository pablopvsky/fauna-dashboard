import { Client, fql } from "fauna";

export type Pagination = {
  cursor?: number;
  size?: number;
};

const DEFAULT_ENDPOINT = process.env.FAUNA_ENDPOINT ?? "http://localhost:8443";

export const severClient = new Client({
  secret: process.env.FAUNA_SECRET,
  endpoint: new URL(DEFAULT_ENDPOINT),
});

/** Header names for dashboard user credentials (see utils/fauna-auth-store) */
const FAUNA_ENDPOINT_HEADER = "x-fauna-endpoint";
const FAUNA_SECRET_HEADER = "x-fauna-secret";

/**
 * Returns a Fauna client for this request: uses X-Fauna-Secret and X-Fauna-Endpoint
 * headers when present (dashboard user token), otherwise the default server client.
 */
export function getClient(request: Request): Client {
  const endpoint = request.headers.get(FAUNA_ENDPOINT_HEADER)?.trim();
  const secret = request.headers.get(FAUNA_SECRET_HEADER)?.trim();
  if (secret && endpoint) {
    return new Client({
      secret,
      endpoint: new URL(endpoint),
    });
  }
  return severClient;
}

export * from "./collections";

