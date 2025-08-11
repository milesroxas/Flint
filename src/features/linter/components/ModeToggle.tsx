import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={mode === "page" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onChange("page")}
      >
        Page
      </Button>
      <Button
        variant={mode === "element" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onChange("element")}
      >
        Element
      </Button>
    </div>
  );
};
