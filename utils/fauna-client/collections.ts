import { fql } from "fauna";
import type { Client } from "fauna";

interface CollectionDefShape {
  name?: string;
  [key: string]: unknown;
}

function getCollectionNamesFromResponse(response: unknown): string[] {
  const data = (response as { data?: unknown })?.data;
  const list = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] })?.data;
  if (!Array.isArray(list)) return [];
  return list
    .map((c: CollectionDefShape) =>
      typeof c?.name === "string" ? c.name : null,
    )
    .filter((n): n is string => n != null)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Get a Set of all collection definitions. Response shape is a Page: { data: CollectionDef[], after? }.
 */
export function listCollections(client: Client) {
  return client.query(fql`Collection.all().pageSize(999)`);
}

/**
 * Returns sorted collection names (for layout/sidebar). Uses listCollections() and extracts .name.
 */
export async function getCollectionNamesList(client: Client): Promise<string[]> {
  const response = await listCollections(client);
  return getCollectionNamesFromResponse(response);
}

export type CollectionSummary = {
  name: string;
  indexes: string[];
};

function extractCollectionsPageData(response: unknown): unknown[] {
  const data = (response as { data?: unknown })?.data;
  const list = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] })?.data;
  return Array.isArray(list) ? list : [];
}

function indexKeysFromDefinitionShape(
  indexes: unknown,
): string[] {
  if (
    !indexes ||
    typeof indexes !== "object" ||
    Array.isArray(indexes)
  ) {
    return [];
  }
  return Object.keys(indexes as Record<string, unknown>).sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Parse Collection.all() page items for name + index keys on embedded definition (if present).
 */
function parseCollectionSummariesFromListResponse(
  response: unknown,
): CollectionSummary[] {
  const list = extractCollectionsPageData(response);
  return list
    .map((raw: unknown) => {
      const c = raw as Record<string, unknown>;
      const name = typeof c.name === "string" ? c.name : "";
      if (!name) return null;
      const def = c.definition as { indexes?: unknown } | undefined;
      let keys = indexKeysFromDefinitionShape(def?.indexes);
      if (keys.length === 0) {
        keys = indexKeysFromDefinitionShape(c.indexes);
      }
      return { name, indexes: keys };
    })
    .filter((x): x is CollectionSummary => x != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchDefinitionIndexes(
  client: Client,
  collectionName: string,
): Promise<string[]> {
  const defRes = await client.query(
    fql`Collection(${collectionName}).definition`,
  );
  const def = (defRes as { data?: { indexes?: unknown } }).data;
  return indexKeysFromDefinitionShape(def?.indexes);
}

/**
 * Collection names with index names from each collection's definition (for shell autocomplete).
 * Uses Collection.all() first; if no indexes are present on list items, loads each definition.
 */
export async function getCollectionSummaries(
  client: Client,
): Promise<CollectionSummary[]> {
  const response = await listCollections(client);
  let summaries = parseCollectionSummariesFromListResponse(response);
  const allEmptyIndexes =
    summaries.length > 0 && summaries.every((s) => s.indexes.length === 0);
  if (allEmptyIndexes) {
    summaries = await Promise.all(
      summaries.map(async (s) => {
        try {
          const indexes = await fetchDefinitionIndexes(client, s.name);
          return { name: s.name, indexes };
        } catch {
          return s;
        }
      }),
    );
  }
  return summaries;
}

/**
 * Pagination: cursor = number of items to skip (offset), size = number of items to take.
 * This allows the route to request size+1 to detect hasMore (e.g. cursor=0, size=51).
 */
export interface GetCollectionDocumentsProps {
  name: string;
  /** Number of documents to skip (offset) */
  cursor?: number;
  /** Number of documents to return */
  size?: number;
}

/**
 * List documents from a collection by name with pagination.
 * Uses Collection(name)!.all().drop(cursor).take(size).
 */
export function getCollectionDocuments(data: GetCollectionDocumentsProps, client: Client) {
  const { name, cursor = 0, size = 10 } = data;

  return client.query(
    fql`Collection(${name})!.all().drop(${cursor}).take(${size})`,
  );
}

/**
 * Get a single document by exact ID. Uses Collection(name)!.byId(id).
 * Returns the document or null if not found.
 */
export function getCollectionDocumentById(collectionName: string, id: string, client: Client) {
  return client.query(
    fql`Collection(${collectionName})!.byId(${id})`,
  );
}