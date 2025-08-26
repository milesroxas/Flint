import React from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

interface StructuralContextToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export const StructuralContextToggle: React.FC<
  StructuralContextToggleProps
> = ({ enabled, onChange, className }) => {
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(!enabled)}
      className={cn(
        "h-6 text-xs transition-colors",
        enabled && "border-l-2 border-l-primary-hover ",
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
      Structure
    </Button>
  );
};
