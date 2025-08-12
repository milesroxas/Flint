import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Severity } from "@/features/linter/model/rule.types";
import {
  severityDot,
  severityText,
  severityBg,
  severityBgActive,
} from "@/features/linter/lib/severity-styles";

const severityButtonVariants = cva(
  "relative overflow-hidden duration-300 ease-in-out outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[border-radius,background-color,color,opacity,transform,padding] [border-radius:var(--rb)] [will-change:border-radius]",
  {
    variants: {
      severity: {
        error: cn(severityText.error),
        warning: cn(severityText.warning),
        suggestion: cn(severityText.suggestion),
      },
      condensed: {
        true: "px-2 py-0 [--rb:9999px]",
        false: "px-4 py-3 [--rb:4px]",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      { severity: "error", active: false, className: cn(severityBg.error) },
      { severity: "warning", active: false, className: cn(severityBg.warning) },
      {
        severity: "suggestion",
        active: false,
        className: cn(severityBg.suggestion),
      },
      {
        severity: "error",
        active: true,
        className: cn(severityBgActive.error),
      },
      {
        severity: "warning",
        active: true,
        className: cn(severityBgActive.warning),
      },
      {
        severity: "suggestion",
        active: true,
        className: cn(severityBgActive.suggestion),
      },
    ],
    defaultVariants: {
      active: false,
      condensed: false,
    },
  }
);

interface SeverityButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof severityButtonVariants> {
  severity: Severity;
  count: number;
  expandedLabel: string;
}

export const SeverityButton: React.FC<SeverityButtonProps> = ({
  severity,
  count,
  condensed = false,
  active = false,
  expandedLabel,
  onClick,
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        severityButtonVariants({ severity, condensed, active }),
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1 text-xs transition-[opacity,transform] duration-300 ease-in-out",
          condensed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        )}
      >
        <span
          className={cn(
            "inline-block size-2 rounded-full",
            severityDot[severity]
          )}
        />
        {count}
        <span>{expandedLabel}</span>
      </span>

      <span
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-[opacity,transform] duration-300 ease-in-out",
          condensed ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        )}
      >
        <span className="text-lg font-semibold leading-none">{count}</span>
        <span className="mt-1 text-xs">{expandedLabel}</span>
      </span>

      {/* Reserve space to prevent height shift */}
      <span className="invisible select-none">
        <span className={cn(condensed ? "text-[10px]" : "text-xl")}>0</span>
      </span>
    </button>
  );
};

export default SeverityButton;
