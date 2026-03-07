"use client";

import { useRef } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { ShellPanel } from "@/components/ShellPanel";
import { ShellSidebar } from "@/components/ShellSidebar";

export default function ShellPage() {
  const setQueryRef = useRef<((query: string) => void) | null>(null);

  return (
    <RequireAuth>
    <div className="flex h-[calc(100vh)] w-full min-h-[480px]">
      <ShellSidebar
        onSelectHistoryEntry={(query) => setQueryRef.current?.(query)}
      />
      <div className="min-w-0 flex-1">
        <ShellPanel injectQueryRef={setQueryRef} />
      </div>
    </div>
    </RequireAuth>
  );
}
