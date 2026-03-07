"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AgentsSidebar } from "@/components/AgentsSidebar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import type { AgentProfile } from "@/utils/fauna-client/agents";

type AgentPanelClientProps = {
  agent: AgentProfile;
  children: React.ReactNode;
};

export function AgentPanelClient({ agent, children }: AgentPanelClientProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [sessionChatOpen, setSessionChatOpen] = useState(false);

  const handleSessionChatOpenChange = (next: boolean) => {
    if (!next) setSessionChatOpen(false);
  };

  return (
    <>
      <AgentsSidebar
        agent={agent}
        uptime="—"
        actionsCount={0}
        isPaused={isPaused}
        onPauseToggle={() => setIsPaused((p) => !p)}
        onConfig={() => {}}
        onOpenSessionChat={() => setSessionChatOpen(true)}
      />
      {children}
      <Drawer
        open={sessionChatOpen}
        onOpenChange={handleSessionChatOpenChange}
        direction="right"
      >
        <DrawerContent className="inset-x-auto left-auto right-0 top-3 bottom-3 mt-0 flex w-40 max-w-[85vw] flex-col rounded-l-md rounded-t-none border-l border-t border-b border-gray-6 [&>div:first-child]:hidden">
          <DrawerHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-gray-6 p-1 px-2">
            <DrawerTitle className="text-lg font-semibold leading-none tracking-tight text-gray-12">
              Chat to session
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="link" size="icon" aria-label="Close">
                <X className="icon" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-auto p-2 flex flex-col gap-3">
            {/* TODO: wire chat to agent sessionKey; use session key for API / identity */}
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-12">
                Hola, {agent.name}.
              </p>
              <p className="text-base font-medium text-gray-11">
                ¿Por dónde empezamos?
              </p>
            </div>
            <div className="mt-auto rounded-lg border border-gray-6 bg-gray-2 p-2 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Introduce una petición para el agente"
                className="w-full rounded-md border border-gray-5 bg-gray-1 px-2 py-2 text-sm text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-accent-8"
                aria-label="Request"
              />
              <div className="flex items-center justify-between gap-2 text-xs text-gray-10">
                <span>Herramientas</span>
                <span>Rápido</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
