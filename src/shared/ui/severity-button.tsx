import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";
import type { Severity } from "@/features/linter/model/rule.types";

const severityDot: Record<Severity, string> = {
  error: "bg-error",
  warning: "bg-warning",
  suggestion: "bg-suggestion",
};

const severityDotActive: Record<Severity, string> = {
  error: "bg-error-foreground",
  warning: "bg-warning-foreground",
  suggestion: "bg-suggestion-foreground",
};

const severityText: Record<Severity, string> = {
  error: "text-error",
  warning: "text-warning-foreground",
  suggestion: "text-suggestion-foreground",
};

const severityBg: Record<Severity, string> = {
  error:
    "bg-error/10 hover:bg-error-hover active:bg-error-active text-error hover:text-error-foreground",
  warning:
    "bg-warning/20 hover:bg-warning-hover active:bg-warning-active text-warning",
  suggestion:
    "bg-suggestion/20 hover:bg-suggestion-hover active:bg-suggestion-active text-suggestion",
};

const severityBgActive: Record<Severity, string> = {
  error:
    "bg-error-hover hover:bg-error-active active:bg-error-active text-error-foreground",
  warning:
    "bg-warning hover:bg-warning-active active:bg-warning-active text-warning-foreground",
  suggestion:
    "bg-suggestion-hover hover:bg-suggestion-active active:bg-suggestion-active text-suggestion-foreground",
};

const severityButtonVariants = cva(
  "relative overflow-hidden duration-300 ease-in-out outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[border-radius,background-color,color,opacity,padding] [border-radius:var(--rb)] [will-change:border-radius]",
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
      {
        severity: "error",
        active: false,
        className: cn(severityBg.error, "hover:text-error-foreground"),
      },
      {
        severity: "warning",
        active: false,
        className: cn(severityBg.warning, "hover:text-warning-foreground"),
      },
      {
        severity: "suggestion",
        active: false,
        className: cn(
          severityBg.suggestion,
          "hover:text-suggestion-foreground"
        ),
      },
      {
        severity: "error",
        active: true,
        className: cn(severityBgActive.error, "text-error-foreground"),
      },
      {
        severity: "warning",
        active: true,
        className: cn(severityBgActive.warning, "text-warning-foreground"),
      },
      {
        severity: "suggestion",
        active: true,
        className: cn(
          severityBgActive.suggestion,
          "text-suggestion-foreground"
        ),
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
  shouldStartCounting?: boolean;
  staggerDelay?: number;
  onCountAnimationComplete?: () => void;
}

export const SeverityButton: React.FC<SeverityButtonProps> = ({
  severity,
  count,
  condensed = false,
  active = false,
  expandedLabel,
  onClick,
  className,
  shouldStartCounting = false,
  staggerDelay = 0,
  onCountAnimationComplete,
  ...props
}) => {
  const [animatedCount, setAnimatedCount] = React.useState(0);
  const [isCountingComplete, setIsCountingComplete] = React.useState(false);
  const countRef = React.useRef<HTMLSpanElement>(null);
  const expandedCountRef = React.useRef<HTMLSpanElement>(null);

  // Animated count-up effect
  React.useEffect(() => {
    if (shouldStartCounting && count > 0) {
      const duration = 800;
      const increment = count / (duration / 16); // 60fps
      let currentCount = 0;

      const animate = () => {
        currentCount += increment;
        if (currentCount >= count) {
          setAnimatedCount(count);
          if (!isCountingComplete) {
            setIsCountingComplete(true);
            // Use a slight delay before calling completion to ensure animation visibility
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                onCountAnimationComplete?.();
              });
            });
          }
        } else {
          setAnimatedCount(Math.floor(currentCount));
          requestAnimationFrame(animate);
        }
      };

      // Add stagger delay before starting animation
      const startAnimation = () => {
        requestAnimationFrame(animate);
      };

      if (staggerDelay > 0) {
        const timer = setTimeout(startAnimation, staggerDelay);
        return () => clearTimeout(timer);
      } else {
        startAnimation();
      }
    }
  }, [
    shouldStartCounting,
    count,
    staggerDelay,
    onCountAnimationComplete,
    isCountingComplete,
  ]);

  // Re-arm counting on each cycle start regardless of count changes
  React.useEffect(() => {
    if (shouldStartCounting) {
      setAnimatedCount(0);
      setIsCountingComplete(false);
    }
  }, [shouldStartCounting]);

  // Reset state when count changes (for new linting cycles)
  React.useEffect(() => {
    if (count === 0) {
      setAnimatedCount(0);
      setIsCountingComplete(false);
    }
  }, [count]);

  // Avoid flashing from final count to 0 by not showing the target count
  // until counting actually starts. Show 0 pre-count, animate to target.
  const displayCount =
    shouldStartCounting || isCountingComplete ? animatedCount : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        severityButtonVariants({ severity, condensed, active }),
        "transition-all duration-300 ease-gentle",
        shouldStartCounting && "animate-count-up",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1 text-xs transition-[opacity,transform] duration-500 ease-gentle",
          condensed ? "opacity-100" : "opacity-0"
        )}
      >
        <span
          className={cn(
            "inline-block size-2 rounded-full",
            active ? severityDotActive[severity] : severityDot[severity]
          )}
        />
        <span
          ref={expandedCountRef}
          className="transition-all duration-300 ease-gentle tabular-nums"
        >
          {displayCount}
        </span>
        <span>{expandedLabel}</span>
      </span>

      <span
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-[opacity,transform] duration-500 ease-gentle",
          condensed ? "opacity-0" : "opacity-100"
        )}
      >
        <span
          ref={countRef}
          className="text-lg font-semibold leading-none transition-all duration-300 ease-gentle tabular-nums"
        >
          {displayCount}
        </span>
        <span className="mt-1 text-xs">{expandedLabel}</span>
      </span>

      <span className="invisible select-none">
        <span className={cn(condensed ? "text-[10px]" : "text-xl")}>0</span>
      </span>
    </button>
  );
};

export default SeverityButton;
