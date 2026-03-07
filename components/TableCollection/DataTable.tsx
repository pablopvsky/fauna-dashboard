"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ResponsiveTableCard,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, Inbox, SearchX } from "lucide-react";
import { DocumentColumn, ActionsColumn } from "./Columns";
import { cn } from "@/utils/class-names";

export interface TableRowProps {
  doc: unknown;
}

export interface TableCollectionProps {
  collectionName: string;
  pageSize?: number;
  className?: string;
}

interface ApiResponse {
  success: boolean;
  data?: unknown[];
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  byId?: string;
  error?: string;
}

const DEFAULT_PAGE_SIZE = 50;

function getDocId(doc: unknown): string | null {
  if (doc === null || typeof doc !== "object") return null;
  const o = doc as Record<string, unknown>;
  if (typeof o.id === "string") return o.id;
  return null;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function DataTable({
  collectionName,
  pageSize = DEFAULT_PAGE_SIZE,
  className,
}: TableCollectionProps) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<unknown[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchById, setSearchById] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const loadPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      setSearchById(null);
      try {
        const url = `/api/collections/${encodeURIComponent(collectionName)}?page=${p}&pageSize=${pageSize}`;
        const res = await fetch(url);
        const body: ApiResponse = await res.json();
        if (!body.success || !Array.isArray(body.data)) {
          setError(body.error ?? "Failed to load collection");
          setRows([]);
          setHasMore(false);
          return;
        }
        setRows(body.data);
        setHasMore(Boolean(body.hasMore));
        setPage(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
        setRows([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [collectionName, pageSize],
  );

  const loadById = useCallback(
    async (id: string) => {
      const trimmed = id.trim();
      if (!trimmed) return;
      setLoading(true);
      setError(null);
      try {
        const url = `/api/collections/${encodeURIComponent(collectionName)}?id=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url);
        const body: ApiResponse = await res.json();
        if (!body.success) {
          setError(body.error ?? "Search failed");
          setRows([]);
          setSearchById(trimmed);
          setHasMore(false);
          return;
        }
        setRows(Array.isArray(body.data) ? body.data : []);
        setSearchById(trimmed);
        setHasMore(false);
        if (body.error && body.byId) {
          setError("Not found");
        } else {
          setError(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
        setRows([]);
        setSearchById(trimmed);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      loadById(searchInput);
    },
    [searchInput, loadById],
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchById(null);
    setError(null);
    loadPage(1);
  }, [loadPage]);

  const onToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const headers = [
    { id: "document", header: "Document" },
    { id: "actions", header: "Actions" },
  ];

  const tableRows = rows.map((doc) => {
    const id = getDocId(doc) ?? `row-${Math.random().toString(36).slice(2)}`;
    return {
      id,
      doc,
      cells: [
        {
          id: `${id}-doc`,
          content: (
            <DocumentColumn
              doc={doc}
              expandedId={expandedId}
              onToggleExpand={onToggleExpand}
            />
          ),
        },
        {
          id: `${id}-actions`,
          content: <ActionsColumn />,
        },
      ],
    };
  });

  const cardRows = tableRows.map((r) => ({
    id: r.id,
    cells: r.cells,
  }));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-gray-12">
          Collection: {collectionName}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-1"
          >
            <label htmlFor="search-by-id" className="sr-only">
              Search by document ID
            </label>
            <Input
              id="search-by-id"
              type="text"
              placeholder="Search by ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}

            />
            <Button type="submit" disabled={loading}>
              Search
            </Button>
          </form>
          {searchById !== null && (
            <Button
              variant="pill"
              size="sm"
              onClick={handleClearSearch}
              disabled={loading}
            >
              Clear search
            </Button>
          )}
         
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-6 bg-red-2 px-2 py-1.5 text-sm text-red-11">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="relative w-full overflow-x-auto border border-gray-6 rounded-md hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Document</TableHead>
              <TableHead className="w-[120px] shrink-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12 text-gray-11">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-12 text-gray-11"
                >
                  <div className="flex flex-col items-center gap-2">
                    {error ? (
                      <>
                        <AlertCircle className="icon text-red-10 shrink-0" aria-hidden />
                        <span className="text-red-11">{error}</span>
                      </>
                    ) : searchById ? (
                      <>
                        <SearchX className="icon text-gray-9 shrink-0" aria-hidden />
                        <span>No document found for ID: {searchById}</span>
                      </>
                    ) : (
                      <>
                        <Inbox className="icon text-gray-9 shrink-0" aria-hidden />
                        <span>No documents in this collection.</span>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tableRows.flatMap((r) => {
                const docId = getDocId(r.doc);
                const isExpanded =
                  docId !== null && expandedId === docId;
                return [
                  <TableRow key={r.id}>
                    <TableCell className="align-top max-w-0">
                      <DocumentColumn
                        doc={r.doc}
                        expandedId={expandedId}
                        onToggleExpand={onToggleExpand}
                      />
                    </TableCell>
                    <TableCell className="shrink-0 align-top">
                      <ActionsColumn />
                    </TableCell>
                  </TableRow>,
                  isExpanded ? (
                    <TableRow key={`${r.id}-expanded`}>
                      <TableCell
                        colSpan={2}
                        className="bg-gray-2 border-t-0 pt-1"
                      >
                        <pre className="font-mono text-xs text-gray-contrast bg-gray-12 whitespace-pre-wrap break-all overflow-x-auto max-h-96 overflow-y-auto p-2 rounded border border-gray-6">
                          {safeStringify(r.doc)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ) : null,
                ].filter(Boolean);
              })
            )}
          </TableBody>
        </Table>
        
      </div>

      {/* Mobile cards */}
      <ResponsiveTableCard
        headers={headers}
        rows={cardRows}
        isLoading={loading && rows.length === 0}
        emptyState={
          !loading && rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-8 px-4">
              {error ? (
                <>
                  <AlertCircle className="icon text-red-10 shrink-0" aria-hidden />
                  <p className="text-red-11 font-medium">{error}</p>
                </>
              ) : searchById ? (
                <>
                  <SearchX className="icon text-gray-9 shrink-0" aria-hidden />
                  <p className="text-gray-11">
                    No document found for ID: {searchById}
                  </p>
                </>
              ) : (
                <>
                  <Inbox className="icon text-gray-9 shrink-0" aria-hidden />
                  <p className="text-gray-11">No documents in this collection.</p>
                </>
              )}
            </div>
          ) : undefined
        }
      />
       {searchById === null && (
            <div className="flex flex-row items-center justify-center gap-2">
              <Button
                variant="pill"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => loadPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-11">Page {page}</span>
              <Button
                variant="pill"
                size="sm"
                disabled={!hasMore || loading}
                onClick={() => loadPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
    </div>
  );
}
