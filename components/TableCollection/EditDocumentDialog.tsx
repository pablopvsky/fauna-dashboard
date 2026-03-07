"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/class-names";

export interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName: string;
  doc: unknown;
  docId: string;
  onSaved: () => void;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseJson(str: string): { ok: true; data: unknown } | { ok: false; error: string } {
  const trimmed = str.trim();
  if (!trimmed) return { ok: false, error: "Empty content" };
  try {
    const data = JSON.parse(trimmed);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof SyntaxError ? e.message : "Invalid JSON",
    };
  }
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  collectionName,
  doc,
  docId,
  onSaved,
}: EditDocumentDialogProps) {
  const [jsonText, setJsonText] = useState(() => safeStringify(doc));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setJsonText(safeStringify(doc));
      setValidationError(null);
      setSaveError(null);
    }
  }, [open, doc]);

  const handleSave = useCallback(async () => {
    const parsed = parseJson(jsonText);
    if (!parsed.ok) {
      setValidationError(parsed.error);
      return;
    }
    setValidationError(null);
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          update: {
            collection: collectionName,
            id: docId,
            data: parsed.data,
          },
        }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string; constraint_failures?: unknown[] };
      if (!body.success) {
        const msg = body.error ?? "Update failed";
        const details =
          Array.isArray(body.constraint_failures) && body.constraint_failures.length > 0
            ? ` ${JSON.stringify(body.constraint_failures)}`
            : "";
        setSaveError(msg + details);
        return;
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  }, [jsonText, collectionName, docId, onSaved, onOpenChange]);

  const handleValidate = useCallback(() => {
    const parsed = parseJson(jsonText);
    if (parsed.ok) {
      setValidationError(null);
    } else {
      setValidationError(parsed.error);
    }
  }, [jsonText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[85vh] w-[90vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="h5">Edit document</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <label htmlFor="edit-doc-json" className="text-sm text-gray-11">
            JSON (must be valid to save)
          </label>
          <textarea
            id="edit-doc-json"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setValidationError(null);
              setSaveError(null);
            }}
            className={cn(
              "flex-1 min-h-[200px] w-full font-mono text-xs p-2 rounded border bg-gray-2 text-gray-12",
              "border-gray-6 focus:outline-none focus:ring-2 focus:ring-accent-8 focus:border-transparent",
              (validationError || saveError) && "border-red-7"
            )}
            spellCheck={false}
          />
          {validationError && (
            <p className="text-sm text-red-11" role="alert">
              {validationError}
            </p>
          )}
          {saveError && (
            <p className="text-sm text-red-11" role="alert">
              {saveError}
            </p>
          )}
        </div>
        <DialogFooter className="flex-shrink-0 gap-1 mt-2 flex">
        
          <Button variant="pill" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            isDisabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
