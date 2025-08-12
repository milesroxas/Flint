import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
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
    <Tabs
      value={mode}
      onValueChange={(value) => onChange(value as LintViewMode)}
      className={className}
    >
      <TabsList className="relative overflow-hidden">
        <div
          className="absolute inset-y-1 left-1 rounded-xs bg-accent text-accent-foreground shadow-sm transition-transform duration-300 ease-out"
          style={{
            width:
              mode === "element" ? "calc(50% - 0rem)" : "calc(50% - 0.5rem)",
            transform:
              mode === "page"
                ? "translateX(0%)"
                : "translateX(calc(100% - 0.5rem))",
          }}
        />
        <TabsTrigger
          value="page"
          className="group relative z-10 basis-1/2 grow-0 px-2 data-[state=active]:px-2"
        >
          <File className="size-3.5" />
          <span>Page</span>
        </TabsTrigger>
        <TabsTrigger
          value="element"
          className="group relative z-10 basis-1/2 grow-0 px-2 data-[state=active]:px-2"
        >
          <SquareSlash className="size-3.5" />
          <span>Element</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
