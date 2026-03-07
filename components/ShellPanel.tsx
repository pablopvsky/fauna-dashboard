"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Eraser, Download, FolderOpen, Play, Copy, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { dashboardFetch } from "@/utils/dashboard-api";
import "@uiw/react-textarea-code-editor/dist.css";
import "@/styles/shell-editor-pink.css";

const CODE_EDITOR_STORAGE_KEY = "fauna-shell-query-history";
const MAX_QUERY_HISTORY = 100;

const CodeEditor = dynamic(
  () =>
    import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

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
    <div className="overflow-x-auto font-mono text-sm">
      {lines.map((line, i) => (
        <div
          key={i}
          className="flex hover:bg-gray-11 border-r border-transparent"
        >
          <span
            className="select-none shrink-0 w-4 pr-2 text-right text-gray-8 border-r border-gray-6"
            aria-hidden
          >
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 whitespace-pre break-words pl-2">
            {line || "\u00A0"}
          </span>
        </div>
      ))}
    </div>
  );
}

type ShellPanelProps = {
  injectQueryRef?: React.MutableRefObject<((query: string) => void) | null>;
};

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
  const displayValue = historyIndex >= 0 && queryHistory.length > 0
    ? queryHistory[historyIndex]
    : currentDraft;

  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  const saveHistory = (next: string[]) => {
    setQueryHistory(next);
    try {
      window.localStorage.setItem(CODE_EDITOR_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleHistoryKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (queryHistory.length === 0) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistoryIndex((i) =>
        i <= 0 ? queryHistory.length - 1 : i - 1
      );
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistoryIndex((i) =>
        i < 0 || i >= queryHistory.length - 1 ? -1 : i + 1
      );
    }
  };

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

  // Scroll output to bottom whenever a new result is added or updated
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
    const blob = new Blob(
      [JSON.stringify({ results: output }, null, 2)],
      { type: "application/json" }
    );
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
      let json: { success?: boolean; data?: unknown; error?: string | { message?: string }; code?: string };
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        const preview = text.slice(0, 150).replace(/\n/g, " ");
        setOutput((prev) =>
          prev.map((item) =>
            item.id === entry.id
              ? { ...item, error: `Server returned non-JSON (${res.status}). Check connection and auth. ${preview}${text.length > 150 ? "…" : ""}` }
              : item
          )
        );
        return;
      }
      const errMsg =
        json.success === false
          ? (typeof json.error === "string" ? json.error : (json.error as { message?: string })?.message ?? "Query failed")
          : (json as { error?: { message?: string } }).error?.message;
      const result = errMsg ? undefined : ("data" in json ? json.data : undefined);

      setOutput((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                result,
                error: errMsg,
                code: json.code,
              }
            : item
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setOutput((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, error: message } : item
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-1 gap-0.5 p-0.5">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-6 px-2 py-1.5">
        <h1 className="text-sm font-semibold text-gray-12">Shell</h1>
        <div className="flex items-center gap-1">
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

      {/* Output - fills available height, always visible */}
      <ScrollArea className="min-h-0 flex-[2] bg-gray-12 text-gray-contrast">
        <div className="min-h-full min-h-[12rem] space-y-2 p-2">
          {output.length === 0 && (
            <p className="text-sm text-gray-2">Run a query to see results here.</p>
          )}
          {output.map((item) => (
            <div key={item.id} className="relative">
              <div className="sticky right-1 top-1 w-full justify-end flex">
                <Button
                  size="sm"
                  variant="fill"
                  className="size-2 p-0"
                  onClick={() => copyOutput(item)}
                  aria-label={copiedId === item.id ? "Copied" : "Copy to clipboard"}
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
                <div className="mb-1 pr-8 truncate text-gray-8" title={item.query}>
                  {item.query.length > 80 ? `${item.query.slice(0, 80)}...` : item.query}
                </div>
              )}
              <div className={item.query ? "" : "pt-6"}>
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
      </ScrollArea>


      {/* Query + Run */}
      <div className="flex shrink-0 flex-col gap-1 pt-0.5">
        <div className="shell-query-editor--pink bg-gray-3">
          <CodeEditor
            value={displayValue}
            onChange={(e) => {
              setCurrentDraft(e.target.value);
              setHistoryIndex(-1);
            }}
            onKeyDown={handleHistoryKeyDown}
            placeholder="Write your FQL query here... (↑↓ history)"
            language="ts"
            data-color-mode="light"
            padding={13}
            minHeight={80}
            spellCheck={false}
            style={{
              fontSize: 13,
              backgroundColor: "transparent",
              fontFamily:
                "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
            }}
          />
        </div>
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
