import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

interface ExpandedContentProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ExpandedContent: React.FC<ExpandedContentProps> = ({
  title,
  onClose,
  children,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={cn(
        "h-full flex flex-col min-h-0 transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-medium">{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};
