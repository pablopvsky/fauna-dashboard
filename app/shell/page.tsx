"use client";

import { useRef } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { ShellPanel } from "@/components/ShellPanel";
import { ShellSidebar } from "@/components/ShellSidebar";

export default function ShellPage() {
  const setQueryRef = useRef<((query: string) => void) | null>(null);

  return (
    <RequireAuth>
    <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-hidden">
      <ShellSidebar
        onSelectHistoryEntry={(query) => setQueryRef.current?.(query)}
      />
      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden">
        <ShellPanel injectQueryRef={setQueryRef} />
      </div>
    </div>
    </RequireAuth>
  );
}
