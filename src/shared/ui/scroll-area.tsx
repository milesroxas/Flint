import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

interface ScrollAreaProps
  extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  onIsScrolledChange?: (value: boolean) => void;
}

function ScrollArea({
  className,
  children,
  onIsScrolledChange,
  ...props
}: ScrollAreaProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrolled = el.scrollTop > 0;
      setIsScrolled(scrolled);
      if (onIsScrolledChange) onIsScrolledChange(scrolled);
    };
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true } as any);
    return () => {
      el.removeEventListener("scroll", handleScroll as any);
    };
  }, [onIsScrolledChange]);

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
