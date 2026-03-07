"use client";

import { useState } from "react";
import Link from "next/link";
import { SchemaGraph } from "@/components/SchemaGraph";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/Drawer";
import { SCHEMA_NODES } from "@/utils/schema-graph-data";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/TableCollection";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function NodesPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = selectedNodeId
    ? SCHEMA_NODES.find((n) => n.id === selectedNodeId)
    : null;
  const title = String(selectedNode?.data?.label ?? "Details");

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedNodeId(null);
  };

  return (
    <main>
      <SchemaGraph
        selectedNodeId={selectedNodeId}
        onNodeSelect={setSelectedNodeId}
      />
      <Drawer
        open={!!selectedNodeId}
        onOpenChange={handleOpenChange}
        direction="right"
      >
        <DrawerContent className="inset-x-auto left-auto right-0 top-3 bottom-3 mt-0 flex w-40 max-w-[85vw] flex-col rounded-l-md rounded-t-none border-l border-t border-b border-gray-6 [&>div:first-child]:hidden">
          <DrawerHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-gray-6 p-1 px-2">
            <DrawerTitle asChild>
              <Link
                href={selectedNodeId ? `/collections/${selectedNodeId}` : "#"}
                className="text-lg font-semibold leading-none tracking-tight text-gray-12 hover:underline"
              >
                {title}
                <span className="icon ml-0.5" aria-hidden>↗</span>
              </Link>
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="link" size="icon" aria-label="Close">
                <Cross2Icon className="icon" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-auto p-1 px-2">
            {selectedNodeId && (
              <DataTable
                collectionName={selectedNodeId}
                pageSize={25}
                className="w-full"
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
