"use client";

import { useParams, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { DataTable } from "@/components/TableCollection";

export default function CollectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const pageParam = searchParams?.get("page");
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined;

  return (
    <RequireAuth>
      <main className="p-4">
        <DataTable
          collectionName={name}
          pageSize={50}
          initialPage={initialPage}
        />
      </main>
    </RequireAuth>
  );
}
