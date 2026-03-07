/**
 * Client-side Fauna connections for the dashboard (DBeaver-style).
 * Stored in localStorage; one connection is "active" and used for API calls.
 */

const STORAGE_KEY = "fauna_dashboard_connections";
const LEGACY_KEY_ENDPOINT = "fauna_dashboard_endpoint";
const LEGACY_KEY_SECRET = "fauna_dashboard_secret";

export type FaunaConnection = {
  id: string;
  name: string;
  endpoint: string;
  secret: string;
};

export type FaunaCredentials = {
  endpoint: string;
  secret: string;
};

export type ConnectionsData = {
  connections: FaunaConnection[];
  activeId: string | null;
};

function readData(): ConnectionsData {
  if (typeof window === "undefined") {
    return { connections: [], activeId: null };
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyEndpoint = localStorage.getItem(LEGACY_KEY_ENDPOINT)?.trim();
      const legacySecret = localStorage.getItem(LEGACY_KEY_SECRET)?.trim();
      if (legacyEndpoint && legacySecret) {
        const conn: FaunaConnection = {
          id: generateId(),
          name: "Default",
          endpoint: legacyEndpoint,
          secret: legacySecret,
        };
        const data: ConnectionsData = { connections: [conn], activeId: conn.id };
        writeData(data);
        localStorage.removeItem(LEGACY_KEY_ENDPOINT);
        localStorage.removeItem(LEGACY_KEY_SECRET);
        return data;
      }
      return { connections: [], activeId: null };
    }
    const parsed = JSON.parse(raw) as ConnectionsData;
    if (!Array.isArray(parsed.connections)) return { connections: [], activeId: null };
    return {
      connections: parsed.connections,
      activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
    };
  } catch {
    return { connections: [], activeId: null };
  }
}

function writeData(data: ConnectionsData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Returns the active connection's credentials, or null. Used by API client. */
export function getStoredCredentials(): FaunaCredentials | null {
  const { connections, activeId } = readData();
  if (!activeId) return null;
  const conn = connections.find((c) => c.id === activeId);
  if (!conn?.endpoint?.trim() || !conn?.secret?.trim()) return null;
  return { endpoint: conn.endpoint.trim(), secret: conn.secret.trim() };
}

/** All connections and the active id. */
export function getConnections(): ConnectionsData {
  return readData();
}

/** Add a connection. Optionally set as active. */
export function addConnection(conn: Omit<FaunaConnection, "id">, setActive = true): FaunaConnection {
  const data = readData();
  const id = generateId();
  const newConn: FaunaConnection = { ...conn, id };
  data.connections.push(newConn);
  if (setActive) data.activeId = id;
  writeData(data);
  return newConn;
}

/** Update a connection by id. */
export function updateConnection(id: string, patch: Partial<Omit<FaunaConnection, "id">>): void {
  const data = readData();
  const i = data.connections.findIndex((c) => c.id === id);
  if (i === -1) return;
  data.connections[i] = { ...data.connections[i], ...patch };
  writeData(data);
}

/** Remove a connection. Clears active if it was this one. */
export function deleteConnection(id: string): void {
  const data = readData();
  data.connections = data.connections.filter((c) => c.id !== id);
  if (data.activeId === id) data.activeId = data.connections[0]?.id ?? null;
  writeData(data);
}

/** Set which connection is active (used for API calls). */
export function setActiveConnectionId(id: string | null): void {
  const data = readData();
  data.activeId = id;
  writeData(data);
}

/** Event name to dispatch when connections or active id change (e.g. so sidebar updates). */
export const CONNECTION_CHANGED_EVENT = "fauna-connection-changed";

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
