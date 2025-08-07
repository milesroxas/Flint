// src/components/LintPageButton.tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LintPageButtonProps {
  onClick: () => void;
  loading?: boolean;
  issueCount?: number;
}

export function LintPageButton({
  onClick,
  loading,
  issueCount,
}: LintPageButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      size="sm"
      className="rounded-full"
      variant={issueCount ? "destructive" : "default"}
    >
      {loading ? (
        <>
          <Loader2 className="mr-1 h-4 w-4 animate-spin text-muted-foreground" />
          Linting...
        </>
      ) : (
        <>{issueCount ? "Re-lint" : "Lint Full Page"}</>
      )}
    </Button>
  );
}
