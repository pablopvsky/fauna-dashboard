/**
 * Client-side Fauna credentials for the dashboard (Apollo-style).
 * Stored in localStorage so the local user's token persists.
 */

const STORAGE_KEY_ENDPOINT = "fauna_dashboard_endpoint";
const STORAGE_KEY_SECRET = "fauna_dashboard_secret";

export type FaunaCredentials = {
  endpoint: string;
  secret: string;
};

export function getStoredCredentials(): FaunaCredentials | null {
  if (typeof window === "undefined") return null;
  const endpoint = localStorage.getItem(STORAGE_KEY_ENDPOINT)?.trim();
  const secret = localStorage.getItem(STORAGE_KEY_SECRET)?.trim();
  if (!endpoint || !secret) return null;
  return { endpoint, secret };
}

export function setStoredCredentials(credentials: FaunaCredentials): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ENDPOINT, credentials.endpoint.trim());
  localStorage.setItem(STORAGE_KEY_SECRET, credentials.secret.trim());
}

export function clearStoredCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_ENDPOINT);
  localStorage.removeItem(STORAGE_KEY_SECRET);
}

/** Header names sent to API so server can use user credentials */
export const FAUNA_ENDPOINT_HEADER = "x-fauna-endpoint";
export const FAUNA_SECRET_HEADER = "x-fauna-secret";

export function getAuthHeaders(): Record<string, string> {
  const creds = getStoredCredentials();
  if (!creds) return {};
  return {
    [FAUNA_ENDPOINT_HEADER]: creds.endpoint,
    [FAUNA_SECRET_HEADER]: creds.secret,
  };
}
