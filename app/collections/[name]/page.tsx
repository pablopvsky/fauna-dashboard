"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { DataTable } from "@/components/TableCollection";
import { getConnections, getStoredCredentials } from "@/utils/fauna-auth-store";

export default function CollectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const pageParam = searchParams?.get("page");
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined;
  const [activeConnectionName, setActiveConnectionName] = useState<string | null>(null);

  useEffect(() => {
    const creds = getStoredCredentials();
    if (creds) {
      const { connections, activeId } = getConnections();
      const active = activeId ? connections.find((c) => c.id === activeId) : null;
      setActiveConnectionName(active?.name ?? null);
    } else {
      setActiveConnectionName(null);
    }
  }, []);

  return (
    <RequireAuth>
      <main className="p-4">
        {activeConnectionName && (
          <p className="text-sm text-gray-11 mb-2">
            Using connection: <span className="font-medium text-gray-12">{activeConnectionName}</span>
          </p>
        )}
        <DataTable
          collectionName={name}
          pageSize={50}
          initialPage={initialPage}
        />
      </main>
    </RequireAuth>
  );
}
