/**
 * Maps schema collection (table) ids to Lucide icon names.
 * Used by the schema graph to show an icon per node.
 * If a table is missing, the default icon is used.
 */

export const DEFAULT_ICON = "CircleDot";

/** Table id → Lucide icon name (PascalCase as in lucide-react). */
export const SCHEMA_GRAPH_ICONS: Record<string, string> = {
  agents: "Bot",
  external_items: "ExternalLink",
  tasks: "ListTodo",
  task_edges: "GitBranch",
  messages: "MessageSquare",
  activities: "Activity",
  documents: "FileText",
  notifications: "Bell",
  users: "User",
  agent_users: "UserCog",
  sprints: "Rocket",
  projects: "Briefcase",
};

/**
 * Returns the Lucide icon name for a schema table/collection.
 * Uses DEFAULT_ICON when the table is not in the config.
 */
export function getIconNameForTable(tableId: string): string {
  return SCHEMA_GRAPH_ICONS[tableId] ?? DEFAULT_ICON;
}
