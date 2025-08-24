// src/components/LintPageButton.tsx
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LintPageButtonProps {
  onClick: () => void;
  loading?: boolean;
  issueCount?: number;
  fullWidth?: boolean;
  className?: string;
  label?: string; // optional override label
}

export function LintPageButton({
  onClick,
  loading = false,
  issueCount = 0,
  fullWidth,
  className = "",
  label,
}: LintPageButtonProps) {
  const isDestructive = issueCount > 0;
  const computedLabel =
    label ??
    (loading ? "Linting..." : isDestructive ? "Re-lint" : "Lint Full Page");

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      aria-disabled={loading}
      aria-busy={loading}
      size="sm"
      className={cn(fullWidth && "w-full", className)}
      variant={isDestructive ? "destructive" : "default"}
      title={computedLabel}
    >
      {loading ? (
        <>
          {/* Spinner inherits text color from the button's foreground */}
          <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Linting</span>
          <span aria-live="polite">{computedLabel}</span>
        </>
      ) : (
        <>{computedLabel}</>
      )}
    </Button>
  );
}
