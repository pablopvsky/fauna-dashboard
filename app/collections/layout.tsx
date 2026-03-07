import { getCollectionNamesList } from "@/utils/fauna-client";
import { CollectionsSidebar } from "@/components/CollectionsSidebar";

export default async function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collectionNames = await getCollectionNamesList();

  return (
    <div className="flex flex-1 min-h-0">
      <CollectionsSidebar collectionNames={collectionNames} />
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
    </div>
  );
}
