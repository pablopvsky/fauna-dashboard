import Link from "next/link";
import { getCollectionNamesList } from "@/utils/fauna-client";

export default async function CollectionsListPage() {
  const names = await getCollectionNamesList();

  return (
    <main className="p-4">
      
    </main>
  );
}
