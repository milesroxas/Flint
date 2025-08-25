import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/shared/utils";

interface ScrollAreaProps
  extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  onIsScrolledChange?: (value: boolean) => void;
  onScrollDirectionChange?: (direction: "up" | "down") => void;
}

function ScrollArea({
  className,
  children,
  onIsScrolledChange,
  onScrollDirectionChange,
  ...props
}: ScrollAreaProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const lastTopRef = React.useRef(0);
  const emittedDirRef = React.useRef<"up" | "down" | null>(null);
  const pendingDirRef = React.useRef<"up" | "down" | null>(null);
  const pendingAccumRef = React.useRef(0);
  const lastEmitTimeRef = React.useRef(0);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrolled = el.scrollTop > 0;
      setIsScrolled(scrolled);
      if (onIsScrolledChange) onIsScrolledChange(scrolled);

      if (onScrollDirectionChange) {
        const prevTop = lastTopRef.current;
        const nextTop = el.scrollTop;
        const delta = nextTop - prevTop;
        const absDelta = Math.abs(delta);
        // Update lastTop always at the end

        // Ignore tiny jitter
        if (absDelta >= 2) {
          const dir: "up" | "down" = delta > 0 ? "down" : "up";

          // Determine if we're at extremes to avoid bounce flicker
          const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
          const nearBottom = nextTop >= maxTop - 8;
          const nearTop = nextTop <= 8;

          // Hysteresis threshold for emitting a change
          const threshold = 32; // px of sustained movement before emit

          if (emittedDirRef.current === null) {
            // First-time emit requires threshold
            if (pendingDirRef.current === dir) {
              pendingAccumRef.current += absDelta;
            } else {
              pendingDirRef.current = dir;
              pendingAccumRef.current = absDelta;
            }

            const passedThreshold = pendingAccumRef.current >= threshold;
            const blockedByBottom =
              dir === "up" ? false : nearBottom && !passedThreshold;
            const blockedByTop =
              dir === "down" ? false : nearTop && !passedThreshold;

            const now = Date.now();
            const timeSinceLastEmit = now - lastEmitTimeRef.current;
            const minEmitInterval = 150; // ms minimum between direction changes

            if (
              passedThreshold &&
              !blockedByBottom &&
              !blockedByTop &&
              timeSinceLastEmit >= minEmitInterval
            ) {
              emittedDirRef.current = dir;
              pendingDirRef.current = null;
              pendingAccumRef.current = 0;
              lastEmitTimeRef.current = now;
              onScrollDirectionChange(dir);
            }
          } else if (dir === emittedDirRef.current) {
            // Same as last emitted: clear pending
            pendingDirRef.current = null;
            pendingAccumRef.current = 0;
          } else {
            // Different than last emitted: accumulate until threshold
            if (pendingDirRef.current === dir) {
              pendingAccumRef.current += absDelta;
            } else {
              pendingDirRef.current = dir;
              pendingAccumRef.current = absDelta;
            }

            const passedThreshold = pendingAccumRef.current >= threshold;
            const blockedByBottom =
              dir === "up" ? false : nearBottom && !passedThreshold;
            const blockedByTop =
              dir === "down" ? false : nearTop && !passedThreshold;

            const now = Date.now();
            const timeSinceLastEmit = now - lastEmitTimeRef.current;
            const minEmitInterval = 150; // ms minimum between direction changes

            if (
              passedThreshold &&
              !blockedByBottom &&
              !blockedByTop &&
              timeSinceLastEmit >= minEmitInterval
            ) {
              emittedDirRef.current = dir;
              pendingDirRef.current = null;
              pendingAccumRef.current = 0;
              lastEmitTimeRef.current = now;
              onScrollDirectionChange(dir);
            }
          }
        }

        lastTopRef.current = nextTop;
      }
    };
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true } as any);
    return () => {
      el.removeEventListener("scroll", handleScroll as any);
    };
  }, [onIsScrolledChange, onScrollDirectionChange]);

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        ref={viewportRef}
        className="focus-visible:ring-ring/50 w-full h-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 overflow-y-auto"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {isScrolled && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-background to-transparent" />
      )}
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none absolute",
        orientation === "vertical" &&
          "right-0 top-0 h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "left-0 bottom-0 h-2.5 w-full flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
