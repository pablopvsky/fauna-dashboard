"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    <main className="p-4">
     
    </main>
  );
}
