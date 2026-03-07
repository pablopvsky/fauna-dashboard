"use client";

import { RequireAuth } from "@/components/RequireAuth";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/Empty";

export default function CollectionsPage() {
  return (
    <RequireAuth>
      <main className="flex flex-1 min-h-0 p-4">
        <Empty className="border border-gray-6 rounded-lg text-gray-11">
          <EmptyHeader>
            <EmptyTitle className="text-gray-12">Pick a collection</EmptyTitle>
            <EmptyDescription className="text-gray-11">
              Choose a collection from the sidebar to view and manage its documents.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    </RequireAuth>
  );
}
