import { BookOpen, Brain, CogIcon, FolderOpen, Terminal } from "lucide-react";
import type { ComponentType } from "react";

export type SidebarMenuLinkItem = {
  title: string;
  url: string;
  icon?: string;
  type?: "link";
};

export type SidebarMenuSeparatorItem = { type: "separator" };

export type SidebarMenuExternalItem = {
  title: string;
  url: string;
  icon?: string;
  type: "external";
};

export type SidebarMenuConfigItem =
  | SidebarMenuLinkItem
  | SidebarMenuSeparatorItem
  | SidebarMenuExternalItem;

export type SidebarMenuConfig = SidebarMenuConfigItem[];

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen,
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
