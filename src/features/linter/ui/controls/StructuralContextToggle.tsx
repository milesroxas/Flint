import type React from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

interface StructuralContextToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export const StructuralContextToggle: React.FC<StructuralContextToggleProps> = ({ enabled, onChange, className }) => {
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(!enabled)}
      className={cn(
        "h-6 gap-1.5 text-xs transition-colors",
        enabled && "border-l-2 border-l-primary-hover ",
        className
      )}
      aria-label={`${enabled ? "Disable" : "Enable"} structural context for wrapper detection`}
      title={
        enabled
          ? "Structural context enabled - wrapper detection uses parent/child relationships"
          : "Structural context disabled - wrapper detection uses naming only"
      }
    >
      <span
        className={cn("h-2 w-2 rounded-full transition-colors", enabled ? "bg-green-500" : "bg-muted-foreground/40")}
      />
      Structure
    </Button>
  );
};
