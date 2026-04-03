"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Eraser, Download, FolderOpen, Play, Copy, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
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
const SHELL_TABS_STORAGE_KEY = "fauna-shell-query-tabs-v1";
const MAX_QUERY_HISTORY = 100;

type OutputEntry = {
  id: string;
  query?: string;
  result?: unknown;
  error?: string;
  code?: string;
  timestamp: number;
};

type ShellTabState = {
  id: string;
  title: string;
  draft: string;
  historyIndex: number;
  queryHistory: string[];
  output: OutputEntry[];
};

function defaultTabTitle(index1Based: number) {
  return `Query ${index1Based}`;
}

function createEmptyTab(index1Based: number): ShellTabState {
  return {
    id: crypto.randomUUID(),
    title: defaultTabTitle(index1Based),
    draft: "",
    historyIndex: -1,
    queryHistory: [],
    output: [],
  };
}

type PersistedShellTabs = {
  activeTabId: string;
  tabs: { id: string; title?: string; draft: string; queryHistory: string[] }[];
};

function loadInitialTabs(): { tabs: ShellTabState[]; activeTabId: string } {
  if (typeof window === "undefined") {
    const t = createEmptyTab(1);
    return { tabs: [t], activeTabId: t.id };
  }
  try {
    const raw = window.localStorage.getItem(SHELL_TABS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedShellTabs;
      if (
        parsed &&
        typeof parsed.activeTabId === "string" &&
        Array.isArray(parsed.tabs) &&
        parsed.tabs.length > 0
      ) {
        const tabs: ShellTabState[] = parsed.tabs.map((row, i) => ({
          id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
          title:
            typeof row.title === "string" && row.title.trim().length > 0
              ? row.title.trim()
              : defaultTabTitle(i + 1),
          draft: typeof row.draft === "string" ? row.draft : "",
          historyIndex: -1,
          queryHistory: Array.isArray(row.queryHistory) ? row.queryHistory : [],
          output: [],
        }));
        const active =
          tabs.some((t) => t.id === parsed.activeTabId) && parsed.activeTabId
            ? parsed.activeTabId
            : tabs[0].id;
        return { tabs, activeTabId: active };
      }
    }
  } catch {
    // fall through
  }
  let migratedHistory: string[] = [];
  try {
    const legacy = window.localStorage.getItem(CODE_EDITOR_STORAGE_KEY);
    const parsed = legacy ? (JSON.parse(legacy) as unknown) : [];
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      migratedHistory = parsed;
    }
  } catch {
    // ignore
  }
  const t = createEmptyTab(1);
  if (migratedHistory.length > 0) {
    t.queryHistory = migratedHistory;
  }
  return { tabs: [t], activeTabId: t.id };
}

function persistTabs(tabs: ShellTabState[], activeTabId: string) {
  try {
    const payload: PersistedShellTabs = {
      activeTabId,
      tabs: tabs.map((t) => ({
        id: t.id,
        title: t.title,
        draft: t.draft,
        queryHistory: t.queryHistory,
      })),
    };
    window.localStorage.setItem(
      SHELL_TABS_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // ignore
  }
}

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

const DEFAULT_SSR_TAB_ID = "shell-tab-default";

export function ShellPanel({ injectQueryRef }: ShellPanelProps) {
  const [tabs, setTabs] = useState<ShellTabState[]>(() => [
    {
      id: DEFAULT_SSR_TAB_ID,
      title: defaultTabTitle(1),
      draft: "",
      historyIndex: -1,
      queryHistory: [],
      output: [],
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(DEFAULT_SSR_TAB_ID);
  const [hasRestoredTabs, setHasRestoredTabs] = useState(false);

  useEffect(() => {
    const { tabs: nextTabs, activeTabId: nextActive } = loadInitialTabs();
    setTabs(nextTabs);
    setActiveTabId(nextActive);
    setHasRestoredTabs(true);
  }, []);

  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  const activeTab =
    tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const queryHistory = activeTab?.queryHistory ?? [];
  const historyIndex = activeTab?.historyIndex ?? -1;
  const currentDraft = activeTab?.draft ?? "";
  const output = activeTab?.output ?? [];
  const displayValue =
    historyIndex >= 0 && queryHistory.length > 0
      ? queryHistory[historyIndex]
      : currentDraft;

  const [collectionNames, setCollectionNames] = useState<string[]>([]);
  const [collectionIndexes, setCollectionIndexes] = useState<
    { name: string; collectionName: string }[]
  >([]);
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

  useEffect(() => {
    if (!hasRestoredTabs) return;
    persistTabs(tabs, activeTabId);
  }, [tabs, activeTabId, hasRestoredTabs]);

  useEffect(() => {
    if (tabs.length === 0) return;
    if (!tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const onHistoryUp = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabIdRef.current) return t;
        if (t.queryHistory.length === 0) return t;
        const nextIdx =
          t.historyIndex <= 0 ? t.queryHistory.length - 1 : t.historyIndex - 1;
        return { ...t, historyIndex: nextIdx };
      }),
    );
  }, []);

  const onHistoryDown = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabIdRef.current) return t;
        if (t.queryHistory.length === 0) return t;
        const nextIdx =
          t.historyIndex < 0 || t.historyIndex >= t.queryHistory.length - 1
            ? -1
            : t.historyIndex + 1;
        return { ...t, historyIndex: nextIdx };
      }),
    );
  }, []);

  const addTab = useCallback(() => {
    setTabs((prev) => {
      const next = createEmptyTab(prev.length + 1);
      setActiveTabId(next.id);
      return [...prev, next];
    });
  }, []);

  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameDraftRef = useRef(renameDraft);
  renameDraftRef.current = renameDraft;
  const renameInputRef = useRef<HTMLInputElement>(null);
  const skipRenameBlurRef = useRef(false);

  useEffect(() => {
    if (!renamingTabId) return;
    const el = renameInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [renamingTabId]);

  const beginRename = useCallback((tabId: string, currentTitle: string) => {
    setRenameDraft(currentTitle);
    renameDraftRef.current = currentTitle;
    setRenamingTabId(tabId);
  }, []);

  const finishRename = useCallback((tabId: string, raw: string) => {
    setTabs((prev) => {
      const i = prev.findIndex((t) => t.id === tabId);
      if (i < 0) return prev;
      const title =
        raw.trim().length > 0 ? raw.trim() : defaultTabTitle(i + 1);
      return prev.map((t) => (t.id === tabId ? { ...t, title } : t));
    });
    setRenamingTabId(null);
  }, []);

  const removeTab = useCallback((id: string) => {
    setRenamingTabId((r) => (r === id ? null : r));
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const i = prev.findIndex((t) => t.id === id);
      if (i < 0) return prev;
      const next = prev.filter((t) => t.id !== id);
      if (activeTabIdRef.current === id) {
        const pick = prev[i + 1]?.id ?? prev[i - 1]?.id ?? next[0].id;
        setActiveTabId(pick);
      }
      return next;
    });
  }, []);

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
      const id = activeTabIdRef.current;
      setTabs((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, draft: query, historyIndex: -1 } : t,
        ),
      );
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
    const id = activeTabId;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, output: [], draft: "", historyIndex: -1 }
          : t,
      ),
    );
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
    const tabId = activeTabId;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, draft: text, historyIndex: -1 } : t,
        ),
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRun = async () => {
    const tabId = activeTabId;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const fromHistory =
      tab.historyIndex >= 0 && tab.queryHistory.length > 0
        ? tab.queryHistory[tab.historyIndex]
        : tab.draft;
    const query = fromHistory.trim();
    if (!query) return;

    const nextHistory =
      tab.queryHistory[tab.queryHistory.length - 1] === query
        ? tab.queryHistory
        : [...tab.queryHistory, query].slice(-MAX_QUERY_HISTORY);

    const entry: OutputEntry = {
      id: crypto.randomUUID(),
      query,
      timestamp: Date.now(),
    };

    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? {
              ...t,
              queryHistory: nextHistory,
              historyIndex: -1,
              output: [...t.output, entry],
            }
          : t,
      ),
    );
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
        setTabs((prev) =>
          prev.map((t) =>
            t.id !== tabId
              ? t
              : {
                  ...t,
                  output: t.output.map((item) =>
                    item.id === entry.id
                      ? {
                          ...item,
                          error: `Server returned non-JSON (${res.status}). Check connection and auth. ${preview}${text.length > 150 ? "…" : ""}`,
                        }
                      : item,
                  ),
                },
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

      setTabs((prev) =>
        prev.map((t) =>
          t.id !== tabId
            ? t
            : {
                ...t,
                output: t.output.map((item) =>
                  item.id === entry.id
                    ? {
                        ...item,
                        result,
                        error: errMsg,
                        code: json.code,
                      }
                    : item,
                ),
              },
        ),
      );

      if (!errMsg) {
        refreshCollectionNames();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setTabs((prev) =>
        prev.map((t) =>
          t.id !== tabId
            ? t
            : {
                ...t,
                output: t.output.map((item) =>
                  item.id === entry.id ? { ...item, error: message } : item,
                ),
              },
        ),
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-gray-1 gap-0.5 p-0.5">
      <header className="flex w-full min-w-0 max-w-full shrink-0 flex-wrap items-center justify-between gap-2 px-2 pb-1">
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

      <div className="flex min-w-0 shrink-0 items-stretch gap-0 border-b border-gray-6">
        <Tabs
          value={activeTabId}
          onValueChange={setActiveTabId}
          className="flex min-w-0 flex-1 flex-col gap-0"
        >
          <TabsList className="h-auto min-h-3 w-full min-w-0 max-w-full justify-start overflow-x-auto rounded-none border-0 bg-transparent px-1">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="text-gray-10 data-[state=active]:text-gray-11 hover:text-gray-11 hover:bg-gray-a2 inline-flex h-[calc(100%+1px)] w-12 min-w-12 max-w-12 shrink-0 flex-none cursor-pointer items-center gap-0.5 border-b-transparent px-1 py-1 data-[state=active]:border-b-2 data-[state=active]:border-b-gray-a6"
              >
                {renamingTabId === t.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameDraft}
                    className="min-w-0 flex-1 bg-transparent text-xs text-inherit outline-none"
                    aria-label="Tab name"
                    onChange={(e) => {
                      setRenameDraft(e.target.value);
                      renameDraftRef.current = e.target.value;
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        skipRenameBlurRef.current = true;
                        setRenamingTabId(null);
                      }
                    }}
                    onBlur={() => {
                      if (skipRenameBlurRef.current) {
                        skipRenameBlurRef.current = false;
                        return;
                      }
                      finishRename(t.id, renameDraftRef.current);
                    }}
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate text-left text-xs"
                    title={`${t.title} — double-click to rename`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      beginRename(t.id, t.title);
                    }}
                  >
                    {t.title}
                  </span>
                )}
                <button
                  type="button"
                  disabled={tabs.length <= 1}
                  className="text-gray-10 hover:text-gray-11 disabled:pointer-events-none disabled:opacity-40 shrink-0 rounded-sm p-0.5 hover:bg-gray-a3"
                  aria-label={`Close ${t.title}`}
                  title={
                    tabs.length <= 1
                      ? "Cannot close the last tab"
                      : "Close tab"
                  }
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(t.id);
                  }}
                >
                  <TrashIcon className="icon" aria-hidden />
                </button>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          type="button"
          size="sm"
          variant="pill"
          className="shrink-0 self-center rounded-none"
          aria-label="New query tab"
          title="New query tab"
          onClick={addTab}
        >
          <PlusIcon className="icon" aria-hidden />
        </Button>
      </div>

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
              const id = activeTabIdRef.current;
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === id ? { ...t, draft: v, historyIndex: -1 } : t,
                ),
              );
            }}
            collectionNames={collectionNames}
            collectionIndexes={collectionIndexes}
            historyNavigationActive={queryHistory.length > 0}
            onHistoryUp={onHistoryUp}
            onHistoryDown={onHistoryDown}
          />
        </div>
        <p className="text-xs text-gray-11 px-0.5 my-0">
          Ctrl+Space suggestions · ↑↓ in list, or history when list closed
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
