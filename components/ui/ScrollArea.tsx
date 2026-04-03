"use client"
/**
 * @description Augments native scroll functionality for custom cross-browser styling.
 */
import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/utils/class-names"

const ScrollViewport = ScrollAreaPrimitive.Viewport;

type ScrollAreaProps = React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.Root
> & {
    /** Use both axes when content can be wider than the viewport (e.g. code / JSON). */
    scrollbarMode?: "vertical" | "both";
};

const ScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    ScrollAreaProps
>(({ className, children, scrollbarMode = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden cursor-default", className)}
        {...props}
    >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
            {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation="vertical" />
        {scrollbarMode === "both" ? (
            <ScrollBar orientation="horizontal" />
        ) : null}
        <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
            "flex touch-none select-none transition-colors cursor-default bg-gray-a2",
            orientation === "vertical" &&
            "h-full w-0.5 border-l border-l-transparent p-[1px]",
            orientation === "horizontal" &&
            "h-0.5 flex-col border-t border-t-transparent p-[1px]",
            className
        )}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-gray-6 cursor-grab active:cursor-grabbing" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar, ScrollViewport }
