"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type DefaultEdgeOptions,
  type NodeTypes,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SCHEMA_NODES, SCHEMA_EDGES } from "@/utils/schema-graph-data";
import { NeuronNode } from "@/components/NeuronNode";

const nodeTypes: NodeTypes = { neuron: NeuronNode };

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
  type: "smoothstep",
  style: { stroke: "var(--color-gray-4)" },
};

type SchemaGraphProps = {
  selectedNodeId?: string | null;
  onNodeSelect?: (id: string | null) => void;
};

export function SchemaGraph({ selectedNodeId = null, onNodeSelect }: SchemaGraphProps) {
  const nodes = useMemo<Node[]>(
    () =>
      SCHEMA_NODES.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [selectedNodeId]
  );

  return (
    <div className="h-[calc(100vh)] w-full min-h-[480px] bg-gray-1">
      <ReactFlow
        nodes={nodes}
        edges={SCHEMA_EDGES}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_e, node) => {
          const next = node.id === selectedNodeId ? null : node.id;
          onNodeSelect?.(next);
        }}
        className="schema-flow"
      >
        <Background gap={16} size={1} color="var(--color-gray-a6)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
