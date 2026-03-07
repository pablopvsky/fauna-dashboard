"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/Sidebar";
import Button from "@/components/ui/Button";

import type { SidebarMenuConfig } from "@/config/sidebar-menu";
import { getSidebarMenuIcon } from "@/config/sidebar-menu";
import { getStoredCredentials, CONNECTION_CHANGED_EVENT } from "@/utils/fauna-auth-store";

type AppSidebarProps = {
  menuItems: SidebarMenuConfig;
  title?: string;
};

const AUTH_URL = "/";

export function AppSidebar({
  menuItems,
  title = "Fauna Dashboard",
}: AppSidebarProps) {
  const pathname = usePathname();
  const [hasAuth, setHasAuth] = useState<boolean | null>(null);

  const refreshAuth = () => setHasAuth(!!getStoredCredentials());

  useEffect(() => {
    refreshAuth();
  }, [pathname]);

  useEffect(() => {
    const handler = () => refreshAuth();
    window.addEventListener(CONNECTION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CONNECTION_CHANGED_EVENT, handler);
  }, []);

  const isActive = (url: string) => pathname === url;
  const isAuthItem = (url: string) => url === AUTH_URL;
  const isDisabled = (url: string) => hasAuth === false && !isAuthItem(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-1">
            <SidebarTrigger className="hidden md:block" />
            <span className="p text-accent-12 font-semibold group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity">
              {title}
            </span>
          </div>
        </SidebarHeader>
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const IconComponent = getSidebarMenuIcon(item.icon);
                const disabled = isDisabled(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild={!disabled}
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      {disabled ? (
                        <Button
                          mode="menu"
                          disabled
                          aria-disabled="true"
                          className="gap-1 w-full justify-start group-data-[collapsible=icon]:justify-center font-medium opacity-50 cursor-not-allowed pointer-events-none"
                        >
                          {IconComponent && (
                            <IconComponent
                              className="icon shrink-0 text-accent-10"
                              aria-hidden="true"
                            />
                          )}
                          <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity">
                            {item.title}
                          </span>
                        </Button>
                      ) : (
                        <Button
                          mode="menu"
                          asChild
                          className="gap-1 w-full justify-start group-data-[collapsible=icon]:justify-center font-medium cursor-pointer"
                        >
                          <Link href={item.url}>
                            {IconComponent && (
                              <IconComponent
                                className="icon shrink-0 text-accent-10"
                                aria-hidden="true"
                              />
                            )}
                            <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden transition-opacity">
                              {item.title}
                            </span>
                          </Link>
                        </Button>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
