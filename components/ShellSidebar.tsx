"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { History, FolderTree } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  fetchRemoteSchema,
  SCHEMA_REMOTE_SWR_KEY,
  type RemoteSchemaData,
} from "@/utils/remote-schema-fetch";
import { parseFslCollections } from "@/utils/parse-fsl-collections";

const SHELL_HISTORY_STORAGE_KEY = "fauna-shell-query-history";

type SidePanelId = "history" | "explorer";

type ShellSidebarProps = {
  onSelectHistoryEntry?: (query: string) => void;
};

export function ShellSidebar({ onSelectHistoryEntry }: ShellSidebarProps) {
  const [sidePanel, setSidePanel] = useState<SidePanelId | null>(null);
  const [historyItems, setHistoryItems] = useState<string[]>([]);

  const { data: schemaData, error: schemaError, isLoading: schemaLoading } =
    useSWR<RemoteSchemaData>(
      sidePanel === "explorer" ? SCHEMA_REMOTE_SWR_KEY : null,
      fetchRemoteSchema,
      {
        revalidateOnFocus: true,
        dedupingInterval: 2000,
      },
    );

  const collections = useMemo(() => {
    if (!schemaData?.files?.length) return [];
    const merged = schemaData.files.map((f) => f.content).join("\n\n");
    return parseFslCollections(merged);
  }, [schemaData]);

  const loadHistory = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(SHELL_HISTORY_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      setHistoryItems(list.slice().reverse());
    } catch {
      setHistoryItems([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHELL_HISTORY_STORAGE_KEY) loadHistory();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadHistory]);

  const togglePanel = (id: SidePanelId) => {
    setSidePanel((p) => {
      if (p === id) return null;
      if (id === "history") loadHistory();
      return id;
    });
  };

  const closePanel = () => setSidePanel(null);

  return (
    <div className="flex h-full min-h-0 shrink-0">
      <aside
        className="flex h-full min-h-0 w-4 shrink-0 flex-col border-r border-gray-6 bg-gray-1 py-2"
        aria-label="Shell tools"
      >
        <nav className="flex flex-1 flex-col items-center gap-1 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="pill"
                size="icon"
                className="size-3"
                onClick={() => togglePanel("history")}
                aria-pressed={sidePanel === "history"}
                aria-label="History"
              >
                <History className="icon" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">History</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="pill"
                size="icon"
                className="size-3"
                onClick={() => togglePanel("explorer")}
                aria-pressed={sidePanel === "explorer"}
                aria-label="Schema explorer"
              >
                <FolderTree className="icon" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Schema explorer</TooltipContent>
          </Tooltip>
        </nav>
      </aside>

      {sidePanel === "history" && (
        <aside
          className="flex h-full min-h-0 w-[min(22rem,38vw)] min-w-[11rem] max-w-[26rem] shrink-0 flex-col border-r border-gray-6 bg-gray-2"
          aria-label="Query history"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-6 px-2 py-1.5">
            <h2 className="text-sm font-semibold text-gray-12">History</h2>
            <Button
              variant="pill"
              size="icon"
              className="size-3 shrink-0"
              onClick={closePanel}
              aria-label="Close panel"
            >
              <Cross2Icon className="icon" aria-hidden />
            </Button>
          </header>
          <ScrollArea scrollbarMode="both" className="min-h-0 min-w-0 flex-1">
            <ul className="list-none p-0">
              {historyItems.length === 0 ? (
                <li className="border-b border-gray-6 px-2 py-1.5 text-sm text-gray-11">
                  No queries in history
                </li>
              ) : (
                historyItems.map((query, i) => (
                  <li
                    key={`${i}-${query.slice(0, 20)}`}
                    className="border-b border-gray-6 last:border-b-0"
                  >
                    <button
                      type="button"
                      className="max-w-full w-full min-w-0 rounded-none px-2 py-1.5 text-left font-mono text-sm text-gray-12 hover:bg-gray-3 focus-visible:bg-gray-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8 focus-visible:ring-inset"
                      title={query}
                      onClick={() => {
                        onSelectHistoryEntry?.(query);
                        closePanel();
                      }}
                      onKeyDown={(e) => {
                        const el = e.currentTarget.querySelector(
                          "[data-history-scroll]",
                        ) as HTMLElement | null;
                        if (
                          !el ||
                          el.scrollWidth <= el.clientWidth + 1
                        ) {
                          return;
                        }
                        if (e.key === "ArrowLeft") {
                          e.preventDefault();
                          el.scrollBy({ left: -48, behavior: "smooth" });
                        } else if (e.key === "ArrowRight") {
                          e.preventDefault();
                          el.scrollBy({ left: 48, behavior: "smooth" });
                        }
                      }}
                    >
                      <span
                        data-history-scroll
                        className="block max-w-full min-w-0 overflow-x-auto whitespace-pre [scrollbar-width:thin]"
                      >
                        {query}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </aside>
      )}

      {sidePanel === "explorer" && (
        <aside
          className="flex h-full min-h-0 w-[min(22rem,38vw)] min-w-[11rem] max-w-[26rem] shrink-0 flex-col border-r border-gray-6 bg-gray-2"
          aria-label="Schema explorer"
        >
          <header className="shrink-0 space-y-1 border-b border-gray-6 px-2 py-1.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-12">
                Schema explorer
              </h2>
              <Button
                variant="pill"
                size="icon"
                className="size-3 shrink-0"
                onClick={closePanel}
                aria-label="Close panel"
              >
                <Cross2Icon className="icon" aria-hidden />
              </Button>
            </div>
            <p className="pr-1 text-xs leading-snug text-gray-11">
              Collections, fields, and indexes from your remote schema (same
              source as the{" "}
              <Link
                href="/schema"
                className="text-accent-9 underline-offset-2 hover:underline"
              >
                Schema
              </Link>{" "}
              page).
            </p>
          </header>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-2 pb-3">
              {schemaLoading && (
                <p className="text-sm text-gray-11">Loading schema…</p>
              )}
              {schemaError && (
                <p className="text-sm text-danger-contrast" role="alert">
                  {schemaError instanceof Error
                    ? schemaError.message
                    : "Failed to load schema."}
                </p>
              )}
              {!schemaLoading &&
                !schemaError &&
                (!schemaData?.files?.length ? (
                  <p className="text-sm text-gray-11">
                    No schema files on this database. Open the{" "}
                    <Link
                      href="/schema"
                      className="text-accent-9 underline-offset-2 hover:underline"
                    >
                      Schema
                    </Link>{" "}
                    page.
                  </p>
                ) : collections.length === 0 ? (
                  <p className="text-sm text-gray-11">
                    No <code className="font-mono text-xs">collection</code>{" "}
                    blocks found. View raw files on{" "}
                    <Link
                      href="/schema"
                      className="text-accent-9 underline-offset-2 hover:underline"
                    >
                      Schema
                    </Link>
                    .
                  </p>
                ) : (
                  <Accordion type="multiple" className="w-full space-y-1">
                    {collections.map((c, index) => (
                      <AccordionItem
                        key={c.name}
                        value={`collection-${index}-${c.name}`}
                        className="rounded-md border border-gray-6 bg-gray-1"
                      >
                        <AccordionTrigger className="h-auto min-h-0 border-0 py-1.5 font-mono text-sm font-medium text-gray-12">
                          <span className="min-w-0 flex-1 truncate text-left">
                            {c.name}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-1.5 border-t border-gray-6 pt-1.5">
                          <div>
                            <p className="text-xs font-medium text-gray-11">
                              Fields
                            </p>
                            {c.fields.length === 0 ? (
                              <p className="text-xs text-gray-11">None parsed</p>
                            ) : (
                              <ul className="mt-0.5 list-none space-y-0.5 font-mono text-xs text-gray-12">
                                {c.fields.map((f) => (
                                  <li key={f.name} className="break-words">
                                    <span className="text-accent-9">{f.name}</span>
                                    <span className="text-gray-11">: </span>
                                    <span>{f.definition}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-11">
                              Indexes
                            </p>
                            {c.indexes.length === 0 ? (
                              <p className="text-xs text-gray-11">None parsed</p>
                            ) : (
                              <ul className="mt-0.5 list-none space-y-0.5 font-mono text-xs text-gray-12">
                                {c.indexes.map((idx) => (
                                  <li key={idx.name} className="break-words">
                                    <span className="text-accent-9">{idx.name}</span>
                                    {idx.summary ? (
                                      <span className="text-gray-11">
                                        {" "}
                                        — {idx.summary}
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ))}
              <Button variant="pill" size="sm" className="w-full" asChild>
                <Link href="/schema">Open full schema viewer</Link>
              </Button>
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
