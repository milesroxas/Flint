import { ArrowLeft, Eye } from "lucide-react";
import type React from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

interface ExpandViewButtonProps {
  onClick: () => void;
  isExpanded?: boolean;
  className?: string;
  text?: string;
}

export const ExpandViewButton: React.FC<ExpandViewButtonProps> = ({ onClick, isExpanded = false, className, text }) => {
  return (
    <Button size="sm" variant="outline" onClick={onClick} className={cn("h-7 w-full", className)}>
      {isExpanded ? (
        <>
          <ArrowLeft />
          Back to violations
        </>
      ) : (
        <>
          <Eye />
          {text || "View recognized elements"}
        </>
      )}
    </Button>
  );
};
