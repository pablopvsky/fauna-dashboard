import { fql } from "fauna";

import { severClient } from ".";

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
export function listCollections() {
  return severClient.query(fql`Collection.all()`);
}

/**
 * Returns sorted collection names (for layout/sidebar). Uses listCollections() and extracts .name.
 */
export async function getCollectionNamesList(): Promise<string[]> {
  const response = await listCollections();
  return getCollectionNamesFromResponse(response);
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
export function getCollectionDocuments(data: GetCollectionDocumentsProps) {
  const { name, cursor = 0, size = 10 } = data;

  return severClient.query(
    fql`Collection(${name})!.all().drop(${cursor}).take(${size})`,
  );
}

/**
 * Get a single document by exact ID. Uses Collection(name)!.byId(id).
 * Returns the document or null if not found.
 */
export function getCollectionDocumentById(collectionName: string, id: string) {
  return severClient.query(
    fql`Collection(${collectionName})!.byId(${id})`,
  );
}