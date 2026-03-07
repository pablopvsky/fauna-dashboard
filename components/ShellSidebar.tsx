"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  History,
  BookMarked,
  FolderTree,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";

const SHELL_HISTORY_STORAGE_KEY = "fauna-shell-query-history";

type DrawerId = "docs" | "history" | "playbook" | "explorer" | null;

type ShellSidebarProps = {
  onSelectHistoryEntry?: (query: string) => void;
};

export function ShellSidebar({ onSelectHistoryEntry }: ShellSidebarProps) {
  const [openDrawer, setOpenDrawer] = useState<DrawerId>(null);
  const [historyItems, setHistoryItems] = useState<string[]>([]);

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

  const open = (id: DrawerId) => () => {
    setOpenDrawer(id);
    if (id === "history") loadHistory();
  };
  const close = () => setOpenDrawer(null);

  return (
    <aside
      className="w-4 shrink-0 flex flex-col border-r border-gray-6 bg-gray-1 py-2"
      aria-label="Shell tools"
    >
      <nav className="flex flex-1 flex-col items-center gap-1 px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="pill"
              size="icon"
              className="size-3"
              onClick={open("docs")}
              aria-label="Docs"
            >
              <BookOpen className="icon" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Docs</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="pill"
              size="icon"
              className="size-3"
              onClick={open("history")}
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
              onClick={open("playbook")}
              aria-label="Playbook"
            >
              <BookMarked className="icon" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Playbook</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="pill"
              size="icon"
              className="size-3"
              onClick={open("explorer")}
              aria-label="Explorer"
            >
              <FolderTree className="icon" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Explorer</TooltipContent>
        </Tooltip>
      </nav>

      {/* Docs drawer */}
      <Drawer open={openDrawer === "docs"} onOpenChange={(o) => !o && close()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Docs</DrawerTitle>
          </DrawerHeader>
          <div className="p-2 text-sm text-gray-11">TODO</div>
        </DrawerContent>
      </Drawer>

      {/* History drawer */}
      <Drawer open={openDrawer === "history"} onOpenChange={(o) => !o && close()}>
        <DrawerContent className="max-h-[70vh] flex flex-col">
          <DrawerHeader>
            <DrawerTitle>History</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 min-h-0">
            <ul className="list-none p-2 space-y-0.5">
              {historyItems.length === 0 ? (
                <li className="px-2 py-1.5 text-gray-11 text-sm">
                  No queries in history
                </li>
              ) : (
                historyItems.map((query, i) => (
                  <li key={`${i}-${query.slice(0, 20)}`}>
                    <button
                      type="button"
                      className="w-full text-left px-2 py-1.5 text-sm rounded-sm truncate hover:bg-gray-3 text-gray-12 font-mono max-w-full"
                      title={query}
                      onClick={() => {
                        onSelectHistoryEntry?.(query);
                        close();
                      }}
                    >
                      {query.length > 60 ? `${query.slice(0, 60)}…` : query}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Playbook drawer */}
      <Drawer open={openDrawer === "playbook"} onOpenChange={(o) => !o && close()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Playbook</DrawerTitle>
          </DrawerHeader>
          <div className="p-2 text-sm text-gray-11">TODO</div>
        </DrawerContent>
      </Drawer>

      {/* Explorer drawer */}
      <Drawer open={openDrawer === "explorer"} onOpenChange={(o) => !o && close()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Explorer</DrawerTitle>
          </DrawerHeader>
          <div className="p-2 text-sm text-gray-11">TODO</div>
        </DrawerContent>
      </Drawer>
    </aside>
  );
}
