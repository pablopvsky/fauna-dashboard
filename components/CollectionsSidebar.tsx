"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons";
import { cn } from "@/utils/class-names";
import { dashboardFetch } from "@/utils/dashboard-api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function CollectionsSidebar() {
  const pathname = usePathname();
  const [collectionNames, setCollectionNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refreshCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardFetch("/api/collections");
      const body = await res.json();
      if (body.success && Array.isArray(body.names)) {
        setCollectionNames(body.names);
        setError(null);
      } else {
        setError(body.error ?? null);
        setCollectionNames([]);
      }
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  const currentName = pathname?.startsWith("/collections/")
    ? pathname.replace(/^\/collections\//, "").split("/")[0]
    : null;

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collectionNames;
    return collectionNames.filter((name) =>
      name.toLowerCase().includes(q),
    );
  }, [collectionNames, search]);

  return (
    <aside
      className="w-25 shrink-0 border-r border-gray-6 bg-gray-1 flex flex-col"
      aria-label="Collections"
    >
      <div className="p-2 border-b border-gray-6 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-12">Collections</h2>
          <Button
            type="button"
            onClick={() => refreshCollections()}
            disabled={loading}
            aria-label="Refresh collections"
            variant="pill"
            size="icon"
            >
            <ReloadIcon className="icon" aria-hidden />
          </Button>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon
            className="icon text-gray-11 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections…"
            aria-label="Search collections"
            className="pl-4"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-auto p-1">
        <ul className="list-none">
          {loading ? (
            <li className="px-2 py-1.5 text-gray-11 text-sm">Loading…</li>
          ) : error ? (
            <li className="px-2 py-1.5 text-red-11 text-xs">{error}</li>
          ) : filteredNames.length === 0 ? (
            <li className="px-2 py-1.5 text-gray-11 text-sm">
              {search.trim() ? "No matching collections" : "No collections"}
            </li>
          ) : (
            filteredNames.map((name) => {
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
