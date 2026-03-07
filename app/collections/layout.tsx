import { CollectionsSidebar } from "@/components/CollectionsSidebar";

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0">
      <CollectionsSidebar />
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
    </div>
  );
}
