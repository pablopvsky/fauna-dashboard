import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/Sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { getSidebarState } from "@/utils/cookies";

import sidebarMenu from "@/config/sidebar-menu.json";
import type { SidebarMenuConfig } from "@/config/sidebar-menu";

type AppLayoutProps = {
  children: React.ReactNode;
  /** Optional menu config. Defaults to sidebar-menu.json */
  menuItems?: SidebarMenuConfig;
  /** Sidebar title when collapsed/expanded */
  title?: string;
};

export async function AppLayout({
  children,
  menuItems = sidebarMenu as SidebarMenuConfig,
  title = "Fauna Dashboard",
}: AppLayoutProps) {
  const sidebarOpen = await getSidebarState();

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar menuItems={menuItems} title={title} />
      <SidebarInset className="min-h-0 flex flex-col">
        <main className="flex-1 min-h-0 overflow-auto flex flex-col p-0.5">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
