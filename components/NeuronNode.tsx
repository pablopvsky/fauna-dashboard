"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getIconForTable } from "@/config/schema-graph-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

const SIZE = 72;
const ICON_SIZE = 22;

export function NeuronNode({ data, selected }: NodeProps) {
  const label = (data?.label as string) ?? "";
  const Icon = getIconForTable(label);

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!border-2 !border-[var(--color-info)] !bg-[var(--color-gray-surface)] !w-1 !h-1"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex flex-col items-center justify-center gap-0.5 rounded-full border-2 bg-[var(--color-gray-2)] font-medium text-[var(--color-gray-12)] shadow-md transition-shadow selection:bg-transparent"
            style={{
              width: SIZE,
              height: SIZE,
              borderColor: "var(--color-success)",
              boxShadow:  "0 0 0 2px var(--color-info), 0 0 16px rgba(9, 39, 236, 0.25)",
            }}
          >
            <Icon
              size={ICON_SIZE}
              className="shrink-0 text-accent-9"
              strokeWidth={2}
              aria-hidden
            />
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!border-2 !border-[var(--color-info)] !bg-[var(--color-gray-surface)] !w-1 !h-1"
      />
    </>
  );
}
