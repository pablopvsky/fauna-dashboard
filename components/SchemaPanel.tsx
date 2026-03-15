"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  ReloadIcon,
  CheckIcon,
  Cross2Icon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";
import { dashboardFetch } from "@/utils/dashboard-api";
import { cn } from "@/utils/class-names";
import "@uiw/react-textarea-code-editor/dist.css";
import "@/styles/shell-editor-pink.css";
import "@/styles/shell-editor-dark.css";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

type StagedStatus = "pending" | "ready" | "failed" | null;

type PulledFile = { name: string; content: string };

type RemoteSchemaData = {
  files: PulledFile[];
  error?: string;
};

async function fetchRemoteSchema(): Promise<RemoteSchemaData> {
  const listRes = await dashboardFetch("/api/schema/files");
  if (!listRes.ok) {
    const data = await listRes.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || listRes.statusText);
  }
  const listData = (await listRes.json()) as { files?: (string | { filename?: string })[] };
  const rawNames = Array.isArray(listData.files) ? listData.files : [];
  const names = rawNames.map((n) =>
    typeof n === "string" ? n : (n && typeof n === "object" && "filename" in n ? (n as { filename: string }).filename : "")
  ).filter(Boolean);
  if (names.length === 0) {
    return { files: [] };
  }
  const files: PulledFile[] = [];
  for (const name of names) {
    const fileRes = await dashboardFetch(`/api/schema/files?name=${encodeURIComponent(name)}`);
    if (!fileRes.ok) {
      const errData = await fileRes.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || fileRes.statusText);
    }
    const content = await fileRes.text();
    try {
      const parsed = JSON.parse(content) as { content?: string };
      files.push({ name, content: typeof parsed.content === "string" ? parsed.content : content });
    } catch {
      files.push({ name, content });
    }
  }
  return { files };
}

const SCHEMA_REMOTE_KEY = "schema-remote";

export function SchemaPanel() {
  const { data: remoteData, error: remoteError, mutate, isValidating } = useSWR<RemoteSchemaData>(
    SCHEMA_REMOTE_KEY,
    fetchRemoteSchema,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  const remoteFiles = remoteData?.files ?? [];
  const primaryFile = remoteFiles[0];
  const remoteContent = primaryFile?.content ?? "";
  const primaryFilename = primaryFile?.name ?? "main.fsl";

  const [localContent, setLocalContent] = useState("");
  const [localFilename, setLocalFilename] = useState(primaryFilename);
  const [status, setStatus] = useState<StagedStatus>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pushAsActive, setPushAsActive] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [abandonLoading, setAbandonLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isDirty = localContent.trim() !== (primaryFile?.content ?? "").trim();
  const hasStaged = status !== null;

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setActionError(null);
    try {
      const res = await dashboardFetch("/api/schema/status");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || res.statusText);
      }
      const data = (await res.json()) as { status: StagedStatus };
      setStatus(data.status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load status");
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const handlePull = useCallback(async () => {
    setActionError(null);
    const data = await mutate();
    if (data?.files?.[0]) {
      setLocalContent(data.files[0].content);
      setLocalFilename(data.files[0].name);
    }
    await fetchStatus();
  }, [mutate, fetchStatus]);

  const handlePush = useCallback(async () => {
    const filename = localFilename.trim() || primaryFilename;
    const content = localContent.trim();
    if (!content) {
      setActionError("Enter schema content to push.");
      return;
    }
    setPushLoading(true);
    setActionError(null);
    try {
      const res = await dashboardFetch("/api/schema/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: { [filename]: content },
          active: pushAsActive,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      await fetchStatus();
      if (pushAsActive) await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to push schema");
    } finally {
      setPushLoading(false);
    }
  }, [localContent, localFilename, primaryFilename, pushAsActive, fetchStatus, mutate]);

  const handleCommit = useCallback(async () => {
    setCommitLoading(true);
    setActionError(null);
    try {
      const res = await dashboardFetch("/api/schema/commit", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      await fetchStatus();
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to commit");
    } finally {
      setCommitLoading(false);
    }
  }, [fetchStatus, mutate]);

  const handleAbandon = useCallback(async () => {
    if (typeof window !== "undefined" && !window.confirm("Abandon staged schema changes?")) return;
    setAbandonLoading(true);
    setActionError(null);
    try {
      const res = await dashboardFetch("/api/schema/abandon", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      await fetchStatus();
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to abandon");
    } finally {
      setAbandonLoading(false);
    }
  }, [fetchStatus, mutate]);

  const syncLocalFromRemote = useCallback(() => {
    if (primaryFile) {
      setLocalContent(primaryFile.content);
      setLocalFilename(primaryFile.name);
    }
  }, [primaryFile]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="flex h-full flex-col bg-gray-1 gap-0.5 p-0.5 min-h-0">
      {/* Header: legend, status, commit/abandon */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-6 px-2 py-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-12">Schema</h1>
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-success-contrast" aria-hidden />
              Added
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-danger-contrast" aria-hidden />
              Removed
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-warning-contrast" aria-hidden />
              Modified
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-11">
            {statusLoading ? "…" : status === null ? "No staged schema" : `Staged: ${status}`}
          </span>
          {hasStaged && (
            <>
              <Button
                variant="pill"
                size="sm"
                onClick={handleCommit}
                disabled={status !== "ready" || commitLoading}
                aria-label="Commit staged schema"
              >
                {commitLoading ? <ReloadIcon className="icon animate-spin" aria-hidden /> : <CheckIcon className="icon" aria-hidden />}
                Commit
              </Button>
              <Button
                variant="pill"
                size="sm"
                onClick={handleAbandon}
                disabled={abandonLoading}
                aria-label="Abandon staged schema"
                className="text-danger-contrast hover:text-danger-contrast"
              >
                {abandonLoading ? <ReloadIcon className="icon animate-spin" aria-hidden /> : <Cross2Icon className="icon" aria-hidden />}
                Abandon
              </Button>
            </>
          )}
        </div>
      </header>

      {actionError && (
        <div className="shrink-0 px-2 py-1 text-sm text-danger-contrast" role="alert">
          {actionError}
        </div>
      )}

      {/* Split: Local | [Pull/Push] | Remote */}
      <div className="flex min-h-0 flex-1 gap-0 border-t border-gray-6" style={{ minHeight: "24rem" }}>
        {/* Left: Local Schema */}
        <div className="flex min-w-0 flex-1 flex-col border-r border-gray-6 min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-6 px-2 py-1.5">
            <span className="text-sm font-medium text-gray-12">Local Schema</span>
            {isDirty && (
              <Badge variant="outline" status="warning" className="text-xs">
                UNSAVED
              </Badge>
            )}
          </div>
          <div className="shrink-0 px-2 py-0.5 font-mono text-xs text-gray-11">
            ./{localFilename}
          </div>
          <div className="min-h-0 flex-1 max-h-[80svh] overflow-x-auto overflow-y-auto shell-query-editor--pink bg-gray-3">
            <CodeEditor
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="Pull remote schema or paste .fsl content…"
              language="go"
              data-color-mode="light"
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
        </div>

        {/* Center: Pull / Push buttons */}
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-r border-gray-6 bg-gray-2 px-0.5 py-2">
          <Button
            variant="pill"
            size="icon"
            onClick={handlePull}
            disabled={isValidating || !!remoteError}
            aria-label="Pull remote schema into local"
            title="Pull (refresh remote and copy to local)"
          >
            <ArrowLeftIcon className="icon" aria-hidden />
          </Button>
          <Button
            variant="pill"
            size="icon"
            onClick={handlePush}
            disabled={pushLoading || !localContent.trim()}
            aria-label="Push local schema to remote"
            title="Push local schema"
          >
            {pushLoading ? (
              <ReloadIcon className="icon animate-spin" aria-hidden />
            ) : (
              <ArrowRightIcon className="icon" aria-hidden />
            )}
          </Button>
          <div className="flex flex-col items-center gap-1 pt-2">
            <Checkbox
              id="schema-push-active"
              checked={pushAsActive}
              onCheckedChange={(checked) => setPushAsActive(checked === true)}
            />
            <Label htmlFor="schema-push-active" className="text-xs font-normal cursor-pointer text-gray-11">
              Push active
            </Label>
          </div>
        </div>

        {/* Right: Remote Schema */}
        <div className="flex min-w-0 flex-1 flex-col min-h-0">
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-6 px-2 py-1.5">
            <span className="text-sm font-medium text-gray-12">Remote Schema</span>
            {!remoteError && remoteFiles.length > 0 && (
              <span className="size-1.5 rounded-full bg-success-contrast" aria-hidden title="Connected" />
            )}
          </div>
          <div className="shrink-0 px-2 py-0.5 font-mono text-xs text-gray-11">
            {primaryFile ? `./${primaryFile.name}` : "—"}
          </div>
          <div className="h-full max-h-[80svh] min-h-0 flex-1 overflow-x-auto overflow-y-auto bg-gray-12 text-gray-contrast">
            <div className="min-h-full min-h-[12rem] p-2">
              {remoteError && (
                <p className="text-danger-contrast">
                  {remoteError instanceof Error ? remoteError.message : "Failed to load remote schema."}
                </p>
              )}
              {!remoteError && remoteFiles.length === 0 && !isValidating && (
                <p className="text-gray-2">Pull to load remote schema.</p>
              )}
              {!remoteError && remoteContent && (
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
              {isValidating && (
                <p className="text-gray-2 flex items-center gap-1">
                  <ReloadIcon className="icon animate-spin" aria-hidden /> Loading…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
