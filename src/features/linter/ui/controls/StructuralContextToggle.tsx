import React from "react";
import { cn } from "@/lib/utils";

interface StructuralContextToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export const StructuralContextToggle: React.FC<
  StructuralContextToggleProps
> = ({ enabled, onChange, className }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "inline-flex cursor-pointer py-0 items-center gap-2 px-2 h-7 rounded-none text-xs transition-all duration-200",
        "outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        enabled
          ? "bg-accent text-accent-foreground hover:bg-slate-800 border-l-2 border-green-500"
          : "bg-background text-muted-foreground hover:bg-accent/50 border border-input hover:text-accent-foreground",
        className
      )}
      aria-label={`${
        enabled ? "Disable" : "Enable"
      } structural context for wrapper detection`}
      title={
        enabled
          ? "Structural context enabled - wrapper detection uses parent/child relationships"
          : "Structural context disabled - wrapper detection uses naming only"
      }
    >
      <span className="font-medium">Structure</span>
    </button>
  );
};
