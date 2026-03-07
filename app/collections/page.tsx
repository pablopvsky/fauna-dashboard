"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { dashboardFetch } from "@/utils/dashboard-api";

export default function CollectionsListPage() {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardFetch("/api/collections");
        const body = await res.json();
        if (!cancelled && body.success && Array.isArray(body.names)) {
          setNames(body.names);
        } else if (!body.success) {
          setError(body.error ?? "Failed to load collections");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RequireAuth>
      <main className="p-4">
        <h1 className="h2 text-gray-12 mb-4">Collections</h1>
        {loading && <p className="text-gray-11">Loading…</p>}
        {error && (
          <p className="text-red-11 text-sm">{error}</p>
        )}
        {!loading && !error && (
          <ul className="list-none space-y-1">
            {names.length === 0 ? (
              <li className="text-gray-11">No collections found.</li>
            ) : (
              names.map((name) => (
                <li key={name}>
                  <Link
                    href={`/collections/${encodeURIComponent(name)}`}
                    className="text-accent-11 hover:underline font-medium"
                  >
                    {name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
