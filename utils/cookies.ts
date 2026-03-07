import { cookies } from "next/headers";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Gets the sidebar state from cookies on the server side
 * @returns boolean - true if expanded, false if collapsed
 */
export async function getSidebarState(): Promise<boolean> {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get(SIDEBAR_COOKIE_NAME);

  return sidebarState?.value === "true";
}
