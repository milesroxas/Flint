import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { PanelHeaderWithBack } from "@/shared/ui/panel-header";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { cn } from "@/shared/utils";

interface ExpandedContentProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ExpandedContent: React.FC<ExpandedContentProps> = ({ title, onBack, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  /** Derived from the ScrollArea viewport via onIsScrolledChange — scroll position lives only in the DOM. */
  const [headerCompact, setHeaderCompact] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const onScrollTopChange = useCallback((isScrolled: boolean) => {
    setHeaderCompact(isScrolled);
  }, []);

  return (
    <div
      className={cn(
        "h-full flex flex-col min-h-0 transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
        className
      )}
    >
      <PanelHeaderWithBack title={title} onBack={onBack} compact={headerCompact} />

      <ScrollArea className="min-h-0 flex-1" onIsScrolledChange={onScrollTopChange}>
        {children}
      </ScrollArea>
    </div>
  );
};
