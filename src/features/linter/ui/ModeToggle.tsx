import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <TabsList>
        <TabsTrigger value="page" className="group">
          <File className="hidden group-data-[state=active]:inline-block" />
          Page
        </TabsTrigger>
        <TabsTrigger value="element" className="group">
          <SquareSlash className="hidden group-data-[state=active]:inline-block" />
          Element
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
