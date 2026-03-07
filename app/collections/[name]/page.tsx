import { DataTable } from "@/components/TableCollection";

interface PageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { name } = await params;
  const { page: pageParam } = await searchParams;
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined;
  return (
    <main className="p-4">
      <DataTable
        collectionName={name}
        pageSize={50}
        initialPage={initialPage}
      />
    </main>
  );
}
