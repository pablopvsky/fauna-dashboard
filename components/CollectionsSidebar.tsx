"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/class-names";

type CollectionsSidebarProps = {
  collectionNames: string[];
};

export function CollectionsSidebar({ collectionNames }: CollectionsSidebarProps) {
  const pathname = usePathname();
  const currentName = pathname?.startsWith("/collections/")
    ? pathname.replace(/^\/collections\//, "").split("/")[0]
    : null;

  return (
    <aside
      className="w-25 shrink-0 border-r border-gray-6 bg-gray-1 flex flex-col"
      aria-label="Collections"
    >
      <div className="p-2 border-b border-gray-6 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-12">Collections</h2>
        <span
          className="text-xs uppercase tracking-wide text-gray-10 cursor-default"
          aria-hidden
        >
 
        </span>
      </div>
      <nav className="flex-1 overflow-auto p-1">
        <ul className="list-none">
          {collectionNames.length === 0 ? (
            <li className="px-2 py-1.5 text-gray-11 text-sm">
              No collections
            </li>
          ) : (
            collectionNames.map((name) => {
              const href = `/collections/${encodeURIComponent(name)}`;
              const isActive = currentName === name;
              return (
                <li key={name}>
                  <Link
                    href={href}
                    className={cn(
                      "block px-2 py-1.5 text-sm font-medium rounded-sm border-l-2 -ml-px pl-2",
                      isActive
                        ? "text-accent-11 border-accent-9 bg-accent-2"
                        : "text-gray-12 border-transparent hover:bg-gray-2 hover:text-accent-11",
                    )}
                  >
                    {name}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </nav>
    </aside>
  );
}
