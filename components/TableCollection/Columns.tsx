"use client";

import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import type { TableRowProps } from "./DataTable";

export const DOCUMENT_COLUMN_ID = "document";
export const ACTIONS_COLUMN_ID = "actions";

export interface DocumentColumnProps extends TableRowProps {
  truncateLength?: number;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

export interface ActionsColumnProps {
  collectionName: string;
  doc: unknown;
  docId: string | null;
  onEdit: (docId: string) => void;
  onDelete: (docId: string) => void;
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
    <div className="min-w-0 max-w-full overflow-hidden">
      <button
        type="button"
        onClick={() => docId && onToggleExpand(docId)}
        className="block w-full min-w-0 text-left font-mono text-xs text-gray-12 hover:text-accent-11 truncate cursor-pointer"
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {truncated}
      </button>
    </div>
  );
}

export function ActionsColumn({
  docId,
  onEdit,
  onDelete,
}: ActionsColumnProps) {
  if (docId === null) return null;
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => onEdit(docId)}
        className="flex items-center gap-1 text-gray-11 hover:text-accent-11 text-xs transition-colors"
        title="Edit document"
      >

        Edit
      </button>
      <span className="text-gray-8" aria-hidden>
        |
      </span>
      <button
        type="button"
        onClick={() => onDelete(docId)}
        className="flex items-center gap-1 text-gray-11 hover:text-red-11 text-xs transition-colors"
        title="Delete document"
      >

        Delete
      </button>
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
