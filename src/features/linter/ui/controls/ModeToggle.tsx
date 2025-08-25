import React from "react";
import { cn } from "@/shared/utils";
import { File, SquareSlash } from "lucide-react";

export type LintViewMode = "element" | "page";

interface ModeToggleProps {
  mode: LintViewMode;
  onChange: (mode: LintViewMode) => void;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex bg-muted rounded-xs px-1 text-muted-foreground",
        "grid grid-cols-2 gap-0 w-fit h-8",
        className
      )}
      role="tablist"
      aria-label="Lint view mode"
    >
      {/* Sliding background indicator */}
      <div
        className={cn(
          "absolute inset-y-1 rounded-xs bg-accent/50 shadow-xs",
          "transition-transform duration-300 ease-out",
          "w-[calc(50%-4px)]" // Account for container padding
        )}
        style={{
          transform:
            mode === "page"
              ? "translateX(4px)"
              : "translateX(calc(100% + 2px))",
        }}
        aria-hidden="true"
      />

      {/* Page tab */}
      <button
        type="button"
        role="tab"
        aria-selected={mode === "page"}
        aria-controls="page-content"
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-1.5",
          "px-2 py-0 text-xs font-medium whitespace-nowrap rounded-xs",
          "transition-colors duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          mode === "page"
            ? "text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange("page")}
      >
        <File className="size-3.5" />
        <span>Page</span>
      </button>

      {/* Element tab */}
      <button
        type="button"
        role="tab"
        aria-selected={mode === "element"}
        aria-controls="element-content"
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-1.5",
          "px-2 py-0 text-xs font-medium whitespace-nowrap rounded-xs",
          "transition-colors duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          mode === "element"
            ? "text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange("element")}
      >
        <SquareSlash className="size-3.5" />
        <span>Element</span>
      </button>
    </div>
  );
};
