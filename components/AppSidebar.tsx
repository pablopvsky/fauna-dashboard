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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/Sidebar";
import Button from "@/components/ui/Button";

import type {
  SidebarMenuConfig,
  SidebarMenuConfigItem,
  SidebarMenuExternalItem,
  SidebarMenuLinkItem,
} from "@/config/sidebar-menu";
import { getSidebarMenuIcon } from "@/config/sidebar-menu";
import { getStoredCredentials, CONNECTION_CHANGED_EVENT } from "@/utils/fauna-auth-store";

type AppSidebarProps = {
  menuItems: SidebarMenuConfig;
  title?: string;
};

const AUTH_URL = "/";

function isSeparator(item: SidebarMenuConfigItem): item is { type: "separator" } {
  return "type" in item && item.type === "separator";
}

function isExternalItem(
  item: SidebarMenuConfigItem
): item is SidebarMenuExternalItem {
  return "type" in item && item.type === "external";
}

function isLinkItem(item: SidebarMenuConfigItem): item is SidebarMenuLinkItem {
  return !("type" in item) || item.type === "link" || !item.type;
}

function splitMenuItems(menuItems: SidebarMenuConfig) {
  const sepIndex = menuItems.findIndex(isSeparator);
  const main =
    sepIndex < 0 ? menuItems : menuItems.slice(0, sepIndex);
  const afterSeparator =
    sepIndex < 0 ? [] : menuItems.slice(sepIndex + 1);
  return { main, afterSeparator };
}

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

  const { main, afterSeparator } = splitMenuItems(menuItems);

  const renderLinkItem = (item: SidebarMenuLinkItem) => {
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
  };

  const renderExternalItem = (item: SidebarMenuExternalItem) => {
    const IconComponent = getSidebarMenuIcon(item.icon);
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild tooltip={item.title}>
          <Button
            mode="menu"
            asChild
            className="gap-1 w-full justify-start group-data-[collapsible=icon]:justify-center font-medium cursor-pointer"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="contents"
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
            </a>
          </Button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

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
              {main.filter(isLinkItem).map(renderLinkItem)}
            </SidebarMenu>
          </SidebarGroupContent>
          {afterSeparator.length > 0 && (
            <>
              <SidebarSeparator />
              <SidebarGroupContent>
                <SidebarMenu>
                  {afterSeparator.map((item) =>
                    isExternalItem(item)
                      ? renderExternalItem(item)
                      : isLinkItem(item)
                        ? renderLinkItem(item)
                        : null
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
