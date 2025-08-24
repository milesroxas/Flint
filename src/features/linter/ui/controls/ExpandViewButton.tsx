import React from "react";
import { Button } from "@/shared/ui/button";
import { Eye, List } from "lucide-react";

interface ExpandViewButtonProps {
  onClick: () => void;
  isExpanded?: boolean;
  className?: string;
}

export const ExpandViewButton: React.FC<ExpandViewButtonProps> = ({
  onClick,
  isExpanded = false,
  className,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
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
          <span className="text-xs">View</span>
        </>
      )}
    </Button>
  );
};
