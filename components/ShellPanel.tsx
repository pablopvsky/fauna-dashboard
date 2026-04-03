"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Download, FolderOpen, Play, Copy, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { dashboardFetch } from "@/utils/dashboard-api";

const ShellQueryEditor = dynamic(
  () =>
    import("@/components/ShellQueryEditor").then((m) => m.ShellQueryEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[120px] rounded-[var(--aura-input-radius)] border border-gray-6 bg-gray-3"
        aria-hidden
      />
    ),
  },
);

const CODE_EDITOR_STORAGE_KEY = "fauna-shell-query-history";
const MAX_QUERY_HISTORY = 100;

type OutputEntry = {
  id: string;
  query?: string;
  result?: unknown;
  error?: string;
  code?: string;
  timestamp: number;
};

function OutputWithLineNumbers({ text }: { text: string | undefined }) {
  const lines = (text ?? "").split("\n");
  return (
    <div className="min-w-0 overflow-x-auto font-mono text-sm">
      <div className="inline-block min-w-full align-top">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex min-w-0 hover:bg-gray-11"
          >
            <span
              className="select-none shrink-0 w-4 pr-2 text-right text-gray-8 border-r border-gray-6"
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="whitespace-pre pl-2 pr-2">{line || "\u00A0"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type ShellPanelProps = {
  injectQueryRef?: React.MutableRefObject<((query: string) => void) | null>;
};

type CollectionsApiJson = {
  success?: boolean;
  names?: string[];
  collections?: { name?: string; indexes?: string[] }[];
};

async function fetchShellSchemaCompletions(): Promise<{
  names: string[];
  collectionIndexes: { name: string; collectionName: string }[];
}> {
  const res = await dashboardFetch("/api/collections");
  const json = (await res.json()) as CollectionsApiJson;
  if (!res.ok || json.success !== true || !Array.isArray(json.names)) {
    return { names: [], collectionIndexes: [] };
  }
  const collectionIndexes: { name: string; collectionName: string }[] = [];
  for (const c of json.collections ?? []) {
    const collName = typeof c?.name === "string" ? c.name : "";
    if (!collName || !Array.isArray(c.indexes)) continue;
    for (const idx of c.indexes) {
      if (typeof idx === "string" && idx.length > 0) {
        collectionIndexes.push({ name: idx, collectionName: collName });
      }
    }
  }
  collectionIndexes.sort((a, b) => {
    const c = a.collectionName.localeCompare(b.collectionName);
    if (c !== 0) return c;
    return a.name.localeCompare(b.name);
  });
  return { names: json.names, collectionIndexes };
}

export function ShellPanel({ injectQueryRef }: ShellPanelProps) {
  const [queryHistory, setQueryHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(CODE_EDITOR_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDraft, setCurrentDraft] = useState("");
  const displayValue =
    historyIndex >= 0 && queryHistory.length > 0
      ? queryHistory[historyIndex]
      : currentDraft;

  const [collectionNames, setCollectionNames] = useState<string[]>([]);
  const [collectionIndexes, setCollectionIndexes] = useState<
    { name: string; collectionName: string }[]
  >([]);
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  const refreshCollectionNames = useCallback(() => {
    void fetchShellSchemaCompletions().then(({ names, collectionIndexes: idx }) => {
      setCollectionNames(names);
      setCollectionIndexes(idx);
    });
  }, []);

  useEffect(() => {
    refreshCollectionNames();
  }, [refreshCollectionNames]);

  const saveHistory = (next: string[]) => {
    setQueryHistory(next);
    try {
      window.localStorage.setItem(
        CODE_EDITOR_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
  };

  const onHistoryUp = useCallback(() => {
    if (queryHistory.length === 0) return;
    setHistoryIndex((i) => (i <= 0 ? queryHistory.length - 1 : i - 1));
  }, [queryHistory]);

  const onHistoryDown = useCallback(() => {
    if (queryHistory.length === 0) return;
    setHistoryIndex((i) =>
      i < 0 || i >= queryHistory.length - 1 ? -1 : i + 1,
    );
  }, [queryHistory]);

  const copyOutput = (item: OutputEntry) => {
    const text = item.error
      ? [item.code && `${item.code}: `, item.error].filter(Boolean).join("")
      : JSON.stringify(item.result, null, 2);
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    if (!injectQueryRef) return;
    injectQueryRef.current = (query: string) => {
      setCurrentDraft(query);
      setHistoryIndex(-1);
    };
    return () => {
      injectQueryRef.current = null;
    };
  }, [injectQueryRef]);

  useEffect(() => {
    if (output.length === 0) return;
    const t = requestAnimationFrame(() => {
      outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(t);
  }, [output]);

  const handleClear = () => {
    setOutput([]);
    setCurrentDraft("");
    setHistoryIndex(-1);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ results: output }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fauna-shell-results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentDraft(String(reader.result ?? ""));
      setHistoryIndex(-1);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRun = async () => {
    const query = displayValue.trim();
    if (!query) return;

    const nextHistory =
      queryHistory[queryHistory.length - 1] === query
        ? queryHistory
        : [...queryHistory, query].slice(-MAX_QUERY_HISTORY);
    saveHistory(nextHistory);
    setHistoryIndex(-1);

    const entry: OutputEntry = {
      id: crypto.randomUUID(),
      query,
      timestamp: Date.now(),
    };
    setOutput((prev) => [...prev, entry]);
    setIsRunning(true);

    try {
      const res = await dashboardFetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const text = await res.text();
      let json: {
        success?: boolean;
        data?: unknown;
        error?: string | { message?: string };
        code?: string;
      };
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        const preview = text.slice(0, 150).replace(/\n/g, " ");
        setOutput((prev) =>
          prev.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  error: `Server returned non-JSON (${res.status}). Check connection and auth. ${preview}${text.length > 150 ? "…" : ""}`,
                }
              : item,
          ),
        );
        return;
      }
      const errMsg =
        json.success === false
          ? typeof json.error === "string"
            ? json.error
            : ((json.error as { message?: string })?.message ?? "Query failed")
          : (json as { error?: { message?: string } }).error?.message;
      const result = errMsg ? undefined : "data" in json ? json.data : undefined;

      setOutput((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                result,
                error: errMsg,
                code: json.code,
              }
            : item,
        ),
      );

      if (!errMsg) {
        refreshCollectionNames();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setOutput((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, error: message } : item,
        ),
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-gray-1 gap-0.5 p-0.5">
      <header className="flex w-full min-w-0 max-w-full shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-6 px-2 pb-1">
        <h1 className="shrink-0 text-sm font-semibold text-gray-12">Shell</h1>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
          <Button size="sm" variant="pill" onClick={handleClear}>
            <span className="flex items-center gap-1">
              <Eraser className="icon shrink-0" aria-hidden />
              Clear
            </span>
          </Button>
          <Button size="sm" variant="pill" onClick={handleDownload}>
            <span className="flex items-center gap-1">
              <Download className="icon shrink-0" aria-hidden />
              Download
            </span>
          </Button>
          <Button size="sm" variant="pill" onClick={handleOpenFile}>
            <span className="flex items-center gap-1">
              <FolderOpen className="icon shrink-0" aria-hidden />
              Open file
            </span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fql,.txt,text/*"
            className="hidden"
            aria-hidden
            onChange={handleFileChange}
          />
        </div>
      </header>

      <div
        role="region"
        aria-label="Query results"
        className="min-h-0 min-w-0 max-w-full flex-1 overflow-auto bg-gray-12 text-gray-contrast"
      >
        <div className="min-h-[12rem] min-h-full min-w-0 w-full max-w-full space-y-2 p-2">
          {output.length === 0 && (
            <p className="text-sm text-gray-2">
              Run a query to see results here.
            </p>
          )}
          {output.map((item) => (
            <div key={item.id} className="relative min-w-0 max-w-full">
              <div className="absolute right-1 top-1 z-10">
                <Button
                  size="sm"
                  variant="fill"
                  className="size-2 p-0"
                  onClick={() => copyOutput(item)}
                  aria-label={
                    copiedId === item.id ? "Copied" : "Copy to clipboard"
                  }
                  title="Copy to clipboard"
                >
                  {copiedId === item.id ? (
                    <Check className="icon" aria-hidden />
                  ) : (
                    <Copy className="icon" aria-hidden />
                  )}
                </Button>
              </div>
              {item.query && (
                <div
                  className="mb-1 max-w-full pr-8 truncate text-gray-8"
                  title={item.query}
                >
                  {item.query.length > 80
                    ? `${item.query.slice(0, 80)}...`
                    : item.query}
                </div>
              )}
              <div
                className={
                  item.query ? "min-w-0 max-w-full" : "min-w-0 max-w-full pt-6"
                }
              >
                {item.error ? (
                  <OutputWithLineNumbers
                    text={[item.code && `${item.code}: `, item.error]
                      .filter(Boolean)
                      .join("")}
                  />
                ) : (
                  <OutputWithLineNumbers
                    text={JSON.stringify(item.result, null, 2)}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={outputEndRef} aria-hidden />
        </div>
      </div>

      <div className="relative z-20 flex min-w-0 max-w-full shrink-0 flex-col gap-1 overflow-visible pt-0.5">
        <div className="min-w-0 max-w-full">
          <ShellQueryEditor
            value={displayValue}
            onChange={(v) => {
              setCurrentDraft(v);
              setHistoryIndex(-1);
            }}
            collectionNames={collectionNames}
            collectionIndexes={collectionIndexes}
            historyNavigationActive={queryHistory.length > 0}
            onHistoryUp={onHistoryUp}
            onHistoryDown={onHistoryDown}
          />
        </div>
        <p className="text-xs text-gray-11 px-0.5 my-0">
          Ctrl+Space suggestions · ↑↓ when history exists
        </p>
        <div>
          <Button
            onClick={handleRun}
            disabled={isRunning || !displayValue.trim()}
            isLoading={isRunning}
            isLoadingText="Running..."
          >
            <span className="flex items-center gap-1">
              <Play className="icon shrink-0" aria-hidden />
              Run query
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
