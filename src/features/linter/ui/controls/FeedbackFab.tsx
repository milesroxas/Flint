import { MessageSquare } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

const FEEDBACK_URL = "https://www.milesroxas.com/flint-feedback";

interface FeedbackFabProps {
  className?: string;
}

/** Floating action button — feedback CTA, warm accent to contrast cool-blue primary. */
export function FeedbackFab({ className }: FeedbackFabProps) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "h-10 w-10 rounded-full",
        "bg-[oklch(0.65_0.17_55)] text-white",
        "hover:bg-[oklch(0.6_0.17_55)] active:bg-[oklch(0.55_0.17_55)]",
        "shadow-md hover:shadow-lg transition-all active:shadow-sm focus-visible:ring-offset-2",
        "dark:bg-[oklch(0.72_0.15_55)] dark:hover:bg-[oklch(0.67_0.15_55)] dark:active:bg-[oklch(0.62_0.15_55)]",
        className
      )}
      asChild
    >
      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Submit feedback"
        title="Submit feedback"
      >
        <MessageSquare className="size-4" aria-hidden />
      </a>
    </Button>
  );
}
