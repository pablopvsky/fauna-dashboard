"use client";

import type { TaskItem, MessageItem } from "@/utils/fauna-client/tasks";
import type { ActivityItem } from "@/utils/fauna-client/agents";
import { cn } from "@/utils/class-names";

type AgentMainContentProps = {
  currentTask: TaskItem | null;
  messages: MessageItem[];
  activities: ActivityItem[];
};

const sectionContainer =
  "rounded-lg border border-gray-6 bg-gray-1 p-2 min-h-0 flex flex-col";

function formatActivityTs(ts: string): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60_000);
    const diffH = Math.floor(diffM / 60);
    if (diffM < 1) return "now";
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  } catch {
    return ts;
  }
}

export function AgentMainContent({
  currentTask,
  messages,
  activities,
}: AgentMainContentProps) {
  return (
    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
      {/* Current Task */}
      <section aria-labelledby="current-task-heading" className={sectionContainer}>
        <h2
          id="current-task-heading"
          className="text-xs font-medium text-gray-10 uppercase tracking-wide mb-2"
        >
          Current Task
        </h2>
        {currentTask ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-12">
              {currentTask.title || "Untitled task"}
            </p>
            {currentTask.description ? (
              <p className="text-sm text-gray-11 line-clamp-3">
                {currentTask.description}
              </p>
            ) : null}
            <div className="flex gap-2 flex-wrap">
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-sm border",
                  "border-gray-6 bg-gray-2 text-gray-11"
                )}
              >
                {currentTask.status || "—"}
              </span>
              {currentTask.phase ? (
                <span className="text-xs px-1.5 py-0.5 rounded-sm border border-gray-6 bg-gray-2 text-gray-11">
                  {currentTask.phase}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-10">No current task assigned.</p>
        )}
      </section>

      {/* Chat */}
      <section aria-labelledby="chat-heading" className={sectionContainer}>
        <h2
          id="chat-heading"
          className="text-xs font-medium text-gray-10 uppercase tracking-wide mb-2"
        >
          Chat
        </h2>
        <div className="flex-1 min-h-24 max-h-48 overflow-auto flex flex-col gap-2">
          {messages.length > 0 ? (
            <ul className="list-none flex flex-col gap-2">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className="text-sm p-2 rounded-sm bg-gray-2 border border-gray-5 text-gray-12"
                >
                  <p className="text-gray-11 text-xs mb-1">Agent message</p>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-10">No messages yet. Chat will appear here.</p>
          )}
        </div>
      </section>

      {/* Live Activity stream */}
      <section aria-labelledby="activity-heading" className={sectionContainer}>
        <h2
          id="activity-heading"
          className="text-xs font-medium text-gray-10 uppercase tracking-wide mb-2"
        >
          Live Activity stream
        </h2>
        <div className="flex-1 min-h-24 max-h-64 overflow-auto flex flex-col gap-1.5">
          {activities.length > 0 ? (
            <ul className="list-none flex flex-col gap-1.5" role="log" aria-live="polite">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex gap-2 text-sm py-1.5 border-b border-gray-5 last:border-0"
                >
                  <span className="text-gray-10 shrink-0 tabular-nums">
                    {formatActivityTs(a.ts)}
                  </span>
                  <span className="text-gray-10 shrink-0 uppercase text-[10px]">
                    {a.type || "—"}
                  </span>
                  <span className="text-gray-12 truncate min-w-0">{a.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-10">No recent activity.</p>
          )}
        </div>
      </section>
    </div>
  );
}
