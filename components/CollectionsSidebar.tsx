"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/class-names";
import { dashboardFetch } from "@/utils/dashboard-api";

export function CollectionsSidebar() {
  const pathname = usePathname();
  const [collectionNames, setCollectionNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardFetch("/api/collections");
        const body = await res.json();
        if (!cancelled && body.success && Array.isArray(body.names)) {
          setCollectionNames(body.names);
          setError(null);
        } else if (!body.success) {
          setError(body.error ?? null);
          setCollectionNames([]);
        }
      } catch {
        if (!cancelled) setError("Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentName = pathname?.startsWith("/collections/")
    ? pathname.replace(/^\/collections\//, "").split("/")[0]
    : null;

  return (
    <aside
      className="w-25 shrink-0 border-r border-gray-6 bg-gray-1 flex flex-col"
      aria-label="Collections"
    >
      <div className="p-2 border-b border-gray-6 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-12">Collections</h2>
      </div>
      <nav className="flex-1 overflow-auto p-1">
        <ul className="list-none">
          {loading ? (
            <li className="px-2 py-1.5 text-gray-11 text-sm">Loading…</li>
          ) : error ? (
            <li className="px-2 py-1.5 text-red-11 text-xs">{error}</li>
          ) : collectionNames.length === 0 ? (
            <li className="px-2 py-1.5 text-gray-11 text-sm">
              No collections
            </li>
          ) : (
            collectionNames.map((name) => {
              const href = `/collections/${encodeURIComponent(name)}`;
              const isActive = currentName === name;
              return (
                <li key={name}>
                  <Link
                    href={href}
                    className={cn(
                      "block px-2 py-1.5 text-sm font-medium rounded-sm border-l-2 -ml-px pl-2",
                      isActive
                        ? "text-accent-11 border-accent-9 bg-accent-2"
                        : "text-gray-12 border-transparent hover:bg-gray-2 hover:text-accent-11",
                    )}
                  >
                    {name}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </nav>
    </aside>
  );
}
