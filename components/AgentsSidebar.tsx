"use client";

import { MessageSquare, Pause, Play, Settings } from "lucide-react";
import { cn } from "@/utils/class-names";
import Button from "@/components/ui/Button";
import type { AgentProfile, AgentStatus } from "@/utils/fauna-client/agents";

type AgentsSidebarProps = {
  agent: AgentProfile;
  /** Placeholder: uptime display (e.g. "2h 34m" or "—") */
  uptime?: string;
  /** Placeholder: actions count for KPI */
  actionsCount?: number;
  /** Whether agent is currently paused (controls pause/play button state) */
  isPaused?: boolean;
  onPauseToggle?: () => void;
  onConfig?: () => void;
  /** Opens the session chat drawer (same pattern as node sidebar on home) */
  onOpenSessionChat?: () => void;
};

const statusLabel: Record<AgentStatus, string> = {
  idle: "Idle",
  active: "Active",
  blocked: "Blocked",
};

const statusDotClass: Record<AgentStatus, string> = {
  idle: "bg-gray-8",
  active: "bg-success-contrast",
  blocked: "bg-danger-contrast",
};

export function AgentsSidebar({
  agent,
  uptime = "—",
  actionsCount = 0,
  isPaused = false,
  onPauseToggle,
  onConfig,
  onOpenSessionChat,
}: AgentsSidebarProps) {
  return (
    <aside
      className="w-25 shrink-0 min-h-0 border-r border-gray-6 bg-gray-1 flex flex-col overflow-auto"
      aria-label="Agent profile"
    >
      {/* Section 1: Name, role, status, pause, config */}
      <div className="p-2 border-b border-gray-6 flex flex-col gap-1">
        <h2
          className="text-sm font-semibold text-gray-12 truncate m-0"
          title={agent.name}
        >
          {agent.name}
        </h2>
        {agent.role ? (
          <p className="text-xs text-gray-11 truncate m-0" title={agent.role}>
            {agent.role}
          </p>
        ) : null}

        <div className="flex items-center gap-1">
          <span
            className={cn(
              "size-1 rounded-full shrink-0",
              statusDotClass[agent.status],
            )}
            aria-hidden
          />
          <span className="text-xs text-gray-11">
            {statusLabel[agent.status]}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="pill"
            size="icon"
            onClick={onPauseToggle}
            aria-label={isPaused ? "Resume agent" : "Pause agent"}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="icon" /> : <Pause className="icon" />}
          </Button>
          <Button
            variant="pill"
            size="icon"
            onClick={onConfig}
            aria-label="Agent config"
            title="Config"
          >
            <Settings className="icon" />
          </Button>
        </div>
      </div>
      {/* Section 4: Chat to session key — opens drawer (same pattern as node sidebar on home) */}
      <div className="p-1 border-b border-gray-6">
        <Button
          variant="pill"
          className="w-full justify-center gap-1.5"
          onClick={onOpenSessionChat}
          aria-label="Open chat to session"
        >
          <MessageSquare className="icon" />
          Chat to session
        </Button>
      </div>

      {/* Section 2: Uptime & Actions KPIs */}
      <div className="p-2 border-b border-gray-6 flex flex-col gap-2">
        <h3 className="text-xs font-medium text-gray-10 uppercase tracking-wide">
          KPIs
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-sm bg-gray-2 p-1.5 border border-gray-5">
            <p className="text-[10px] uppercase tracking-wide text-gray-10">
              Uptime
            </p>
            <p className="text-sm font-semibold text-gray-12 mt-0.5">
              {uptime}
            </p>
          </div>
          <div className="rounded-sm bg-gray-2 p-1.5 border border-gray-5">
            <p className="text-[10px] uppercase tracking-wide text-gray-10">
              Actions
            </p>
            <p className="text-sm font-semibold text-gray-12 mt-0.5">
              {actionsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Memory & context (aside scrolls as a whole) */}
      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <h3 className="text-xs font-medium text-gray-10 uppercase tracking-wide">
          Memory & context
        </h3>
        <div className="rounded-sm bg-gray-2 p-2 border border-gray-5 min-h-12">
          <p className="text-xs text-gray-11">
            No context loaded. Memory and context will appear here when
            available.
          </p>
        </div>
      </div>
    </aside>
  );
}
