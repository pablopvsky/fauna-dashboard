import Link from "next/link";
import { listCollections } from "@/utils/fauna-client";

interface CollectionDef {
  name?: string;
  [key: string]: unknown;
}

export default async function CollectionsListPage() {
  const response = await listCollections();
  const pageResult = (response as { data?: { data?: CollectionDef[] } })?.data;
  const items = pageResult?.data ?? [];
  const names = items
    .map((c) => (typeof c?.name === "string" ? c.name : null))
    .filter((n): n is string => n != null)
    .sort((a, b) => a.localeCompare(b));

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-gray-12 mb-4">Collections</h1>
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
    </main>
  );
}
