import { GearIcon, HomeIcon } from "@radix-ui/react-icons";
import { Brain, CogIcon, FolderOpen, Terminal } from "lucide-react";
import type { ComponentType } from "react";

export type SidebarMenuConfigItem = {
  title: string;
  url: string;
  icon?: string;
};

export type SidebarMenuConfig = SidebarMenuConfigItem[];

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Brain,
  FolderOpen,
  Gear: CogIcon,
  Terminal,
};

export function getSidebarMenuIcon(
  iconName?: string
): ComponentType<{ className?: string }> | null {
  if (!iconName) return null;
  return ICON_MAP[iconName] ?? null;
}
