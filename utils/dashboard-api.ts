/**
 * Dashboard API fetch: adds stored Fauna credentials as headers when present.
 * Use this instead of raw fetch for /api/collections and /api/query so the
 * server uses the local user's endpoint and secret.
 */

import { getAuthHeaders } from "./fauna-auth-store";

export async function dashboardFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const auth = getAuthHeaders();
  for (const [key, value] of Object.entries(auth)) {
    headers.set(key, value);
  }
  return fetch(input, { ...init, headers });
}
