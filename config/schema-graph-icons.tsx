"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Bot,
  Briefcase,
  CircleDot,
  ExternalLink,
  FileText,
  GitBranch,
  ListTodo,
  MessageSquare,
  Rocket,
  User,
  UserCog,
} from "lucide-react";
import { getIconNameForTable } from "./schema-graph-icons.config";

/** Map of Lucide icon names (from config) to components. Add new icons here when you add them to the config. */
const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Bell,
  Bot,
  Briefcase,
  CircleDot,
  ExternalLink,
  FileText,
  GitBranch,
  ListTodo,
  MessageSquare,
  Rocket,
  User,
  UserCog,
};

/**
 * Returns the Lucide icon component for a schema table/collection.
 * Uses the default icon (CircleDot) when the table is not in the config or the icon name is unknown.
 */
export function getIconForTable(tableId: string): LucideIcon {
  const name = getIconNameForTable(tableId);
  return ICON_MAP[name] ?? CircleDot;
}
