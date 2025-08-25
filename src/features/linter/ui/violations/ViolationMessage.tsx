import React from "react";
import { cn } from "@/shared/utils";

interface ViolationMessageProps {
  variant: "plain" | "list";
  message: React.ReactNode;
  example?: string;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Minimal wrapper to standardize how violation messages are displayed.
 * - variant="plain": message + optional example chip
 * - variant="list": message + indented list body + optional footer
 */
export const ViolationMessage: React.FC<ViolationMessageProps> = ({
  variant,
  message,
  example,
  footer,
  className,
  children,
}) => {
  return (
    <div className={cn("space-y-2 w-full min-w-0 overflow-hidden", className)}>
      <p className="text-muted-foreground">{message}</p>

      {variant === "list" ? (
        <div className="space-y-1.5 pl-2 border-l-2 border-muted w-full min-w-0 overflow-hidden">
          {children}
        </div>
      ) : example ? (
        <p className="mt-1 font-mono text-[11px] inline-block">
          <span className="text-muted-foreground font-sans font-medium">
            Sample:
          </span>{" "}
          {example}
        </p>
      ) : null}

      {footer && (
        <p className="text-[11px] text-muted-foreground italic">{footer}</p>
      )}
    </div>
  );
};

export default ViolationMessage;
