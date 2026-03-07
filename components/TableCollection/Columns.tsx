"use client";

import type { TableRowProps } from "./DataTable";

export const DOCUMENT_COLUMN_ID = "document";
export const ACTIONS_COLUMN_ID = "actions";

export interface DocumentColumnProps extends TableRowProps {
  truncateLength?: number;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

export function DocumentColumn({
  doc,
  truncateLength = 120,
  expandedId,
  onToggleExpand,
}: DocumentColumnProps) {
  const docId = getDocId(doc);
  const isExpanded = docId !== null && expandedId === docId;
  const jsonStr = safeStringify(doc);
  const truncated =
    jsonStr.length <= truncateLength
      ? jsonStr
      : jsonStr.slice(0, truncateLength) + "…";

  return (
    <div className="min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => docId && onToggleExpand(docId)}
        className="text-left font-mono text-xs text-gray-12 hover:text-accent-11 break-all cursor-pointer"
        title={isExpanded ? "Collapse" : "Expand"}
      >
       {truncated}
      </button>
    </div>
  );
}

export function ActionsColumn() {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-gray-10 text-xs">Edit</span>
      <span className="text-gray-8">|</span>
      <span className="text-gray-10 text-xs">Delete</span>
    </div>
  );
}

function getDocId(doc: unknown): string | null {
  if (doc === null || typeof doc !== "object") return null;
  const o = doc as Record<string, unknown>;
  if (typeof o.id === "string") return o.id;
  return null;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return String(value);
  }
}
