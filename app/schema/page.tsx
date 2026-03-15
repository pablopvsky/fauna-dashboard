"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { SchemaPanel } from "@/components/SchemaPanel";

export default function SchemaPage() {
  return (
    <RequireAuth>
      <div className="flex min-h-0 flex-1 flex-col w-full">
        <SchemaPanel />
      </div>
    </RequireAuth>
  );
}
