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
  loading,
  issueCount,
  fullWidth,
  className = "",
  label,
}: LintPageButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      size="sm"
      className={cn(fullWidth && "w-full", className)}
      variant={issueCount ? "destructive" : "default"}
    >
      {loading ? (
        <>
          <Loader2 className="mr-1 h-4 w-4 animate-spin text-muted-foreground" />
          Linting...
        </>
      ) : label ? (
        <>{label}</>
      ) : (
        <>{issueCount ? "Re-lint" : "Lint Full Page"}</>
      )}
    </Button>
  );
}
