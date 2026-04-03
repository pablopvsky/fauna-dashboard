"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  fetchRemoteSchema,
  SCHEMA_REMOTE_SWR_KEY,
  type RemoteSchemaData,
} from "@/utils/remote-schema-fetch";
import { cn } from "@/utils/class-names";
import "@uiw/react-textarea-code-editor/dist.css";
import "@/styles/shell-editor-pink.css";
import "@/styles/shell-editor-dark.css";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false },
);

export function SchemaPanel() {
  const {
    data: remoteData,
    error: remoteError,
    mutate,
    isValidating,
  } = useSWR<RemoteSchemaData>(SCHEMA_REMOTE_SWR_KEY, fetchRemoteSchema, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  const remoteFiles = remoteData?.files ?? [];
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const selectedFile =
    remoteFiles.find((f) => f.name === selectedName) ?? remoteFiles[0] ?? null;
  const remoteContent = selectedFile?.content ?? "";

  useEffect(() => {
    if (remoteFiles.length === 0) {
      setSelectedName(null);
      return;
    }
    setSelectedName((prev) => {
      if (prev && remoteFiles.some((f) => f.name === prev)) return prev;
      return remoteFiles[0]?.name ?? null;
    });
  }, [remoteFiles]);

  const handleRefresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <div className="flex h-full flex-col bg-gray-1 gap-0.5 p-0.5 min-h-0">
      {remoteError && (
        <div
          className="shrink-0 px-2 py-1 text-sm text-danger-contrast"
          role="alert"
        >
          {remoteError instanceof Error
            ? remoteError.message
            : "Failed to load schema."}
        </div>
      )}

      <div
        className="flex min-h-0 flex-1 gap-0 border-t border-gray-6"
        style={{ minHeight: "24rem" }}
      >
        {/* Schema: file list */}
        <div className="flex w-[min(40%,20rem)] min-w-0 shrink-0 flex-col border-r border-gray-6 min-h-0">
          <div className="flex shrink-0 border-b border-gray-6 px-2 py-1.5">
            <span className="text-sm font-medium text-gray-12">Schema</span>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <ul className="p-1">
              {remoteFiles.length === 0 && !remoteError && !isValidating && (
                <li className="px-1 py-1 text-xs text-gray-11">
                  No schema files.
                </li>
              )}
              {remoteFiles.map((f) => (
                <li key={f.name}>
                  <button
                    type="button"
                    onClick={() => setSelectedName(f.name)}
                    className={cn(
                      "w-full rounded px-2 py-1 text-left font-mono text-xs transition-colors",
                      selectedFile?.name === f.name
                        ? "bg-gray-4 text-gray-12"
                        : "text-gray-11 hover:bg-gray-3 hover:text-gray-12",
                    )}
                  >
                    ./{f.name}
                  </button>
                </li>
              ))}
              {isValidating && remoteFiles.length === 0 && (
                <li className="flex items-center gap-1 px-2 py-1 text-xs text-gray-11">
                  <ReloadIcon className="icon animate-spin" aria-hidden />{" "}
                  Loading…
                </li>
              )}
            </ul>
          </ScrollArea>
        </div>

        {/* Remote Schema: read-only content */}
        <div className="flex min-w-0 flex-1 flex-col min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-6 px-2 py-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm font-medium text-gray-12">
                Remote Schema
              </span>
              {!remoteError && remoteFiles.length > 0 && (
                <span
                  className="size-0.5 shrink-0 rounded-full bg-success-contrast"
                  aria-hidden
                  title="Loaded"
                />
              )}
            </div>
            <Button
              variant="pill"
              size="sm"
              onClick={handleRefresh}
              disabled={isValidating}
              aria-label="Refresh schema from database"
              className="shrink-0"
            >
              {isValidating ? (
                <ReloadIcon className="icon animate-spin mr-1" aria-hidden />
              ) : (
                <ReloadIcon className="icon mr-1" aria-hidden />
              )}
              Refresh
            </Button>
          </div>
          <div className="shrink-0 px-2 py-0.5 font-mono text-xs text-gray-11">
            {selectedFile ? `./${selectedFile.name}` : "—"}
          </div>
          <div className="h-full max-h-[80svh] min-h-0 flex-1 overflow-x-auto overflow-y-auto bg-gray-12 text-gray-contrast">
            <div className="min-h-full min-h-[12rem] p-2">
              {!remoteError && !selectedFile && !isValidating && (
                <p className="text-gray-2">No file selected.</p>
              )}
              {!remoteError && selectedFile && remoteContent && (
                <div className="shell-output-editor--dark bg-gray-12 min-w-max w-fit">
                  <CodeEditor
                    value={remoteContent}
                    readOnly
                    language="go"
                    data-color-mode="dark"
                    padding={13}
                    minHeight={120}
                    spellCheck={false}
                    style={{
                      fontSize: 13,
                      backgroundColor: "transparent",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
                      minWidth: "min-content",
                    }}
                  />
                </div>
              )}
              {isValidating && !selectedFile && (
                <p className="text-gray-2 flex items-center gap-1">
                  <ReloadIcon className="icon animate-spin" aria-hidden />{" "}
                  Loading…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
