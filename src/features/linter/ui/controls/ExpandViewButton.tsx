import React from "react";
import { Button } from "@/shared/ui/button";
import { Eye, List } from "lucide-react";
import { cn } from "@/shared/utils";

interface ExpandViewButtonProps {
  onClick: () => void;
  isExpanded?: boolean;
  className?: string;
  text?: string;
}

export const ExpandViewButton: React.FC<ExpandViewButtonProps> = ({
  onClick,
  isExpanded = false,
  className,
  text,
}) => {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      className={cn(className, "cursor-pointer my-2")}
      title={isExpanded ? "Back to violations" : "View recognized elements"}
    >
      {isExpanded ? (
        <>
          <List className="h-3 w-3 mr-1" />
          <span className="text-xs">Back</span>
        </>
      ) : (
        <>
          <Eye className="h-3 w-3 mr-1" />
          <span className="text-xs">{text || "View"}</span>
        </>
      )}
    </Button>
  );
};
