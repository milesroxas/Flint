import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

export interface PanelHeaderWithBackProps {
  title: string;
  onBack: () => void;
  /** When true, header uses compact padding and typography (e.g. while scroll content is offset). */
  compact?: boolean;
  /** Screen reader label for the back control. */
  backLabel?: string;
  className?: string;
}

/**
 * Full-width subpanel header: back control on the left, title beside it.
 */
export function PanelHeaderWithBack({
  title,
  onBack,
  compact = false,
  backLabel = "Back",
  className,
}: PanelHeaderWithBackProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b transition-[padding,min-height] duration-300 ease-out",
        compact ? "min-h-9 px-3 py-2" : "min-h-[52px] p-4",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        aria-label={backLabel}
        className={cn("shrink-0 p-0 transition-[height,width] duration-300 ease-out", compact ? "h-5 w-5" : "h-6 w-6")}
      >
        <ArrowLeft
          className={cn("transition-[height,width] duration-300 ease-out", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
          aria-hidden
        />
      </Button>
      <h2
        className={cn(
          "min-w-0 flex-1 truncate font-medium transition-[font-size,line-height] duration-300 ease-out",
          compact ? "text-xs leading-tight" : "text-sm leading-snug"
        )}
      >
        {title}
      </h2>
    </div>
  );
}
