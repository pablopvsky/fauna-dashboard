import { DataTable } from "@/components/TableCollection";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { name } = await params;
  return (
    <main className="p-4">
      <DataTable collectionName={name} pageSize={50} />
    </main>
  );
}
