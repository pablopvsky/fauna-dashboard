"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";
import { RequireAuth } from "@/components/RequireAuth";
import { DataTable } from "@/components/TableCollection";
import { getConnections, getStoredCredentials } from "@/utils/fauna-auth-store";
import { Button } from "@/components/ui/Button";

export default function CollectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const pageParam = searchParams?.get("page");
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined;
  const [activeConnectionName, setActiveConnectionName] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            {activeConnectionName && (
              <p className="text-sm text-gray-11">
                Using connection:{" "}
                <span className="font-medium text-gray-12">{activeConnectionName}</span>
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            aria-label="Refresh collection"
            variant="pill"
            size="icon"
          >
            <ReloadIcon className="icon" aria-hidden />
          </Button>
        </div>
        <DataTable
          collectionName={name}
          pageSize={50}
          initialPage={initialPage}
          refreshKey={refreshKey}
        />
      </main>
    </RequireAuth>
  );
}
