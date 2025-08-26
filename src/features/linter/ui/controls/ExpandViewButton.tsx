import React, { useState, useEffect } from "react";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevExpanded, setPrevExpanded] = useState(isExpanded);

  useEffect(() => {
    if (prevExpanded !== isExpanded) {
      setIsAnimating(true);
      setPrevExpanded(isExpanded);
      // CSS animation will handle the timing automatically
    }
  }, [isExpanded, prevExpanded]);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      className={cn(
        className,
        "cursor-pointer my-2 transition-all duration-200 ease-out",
        isAnimating && "scale-105"
      )}
      title={isExpanded ? "Back to violations" : "View recognized elements"}
      onTransitionEnd={() => {
        if (isAnimating) {
          setIsAnimating(false);
        }
      }}
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
