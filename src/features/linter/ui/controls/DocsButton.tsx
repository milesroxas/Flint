import { BookOpen } from "lucide-react";
import type React from "react";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import { Button } from "@/shared/ui/button";

const PRESET_DOCS: Record<string, string> = {
  lumos: "https://timothyricks.notion.site/Lumos-Framework-6d1139068f7442d49494ec3b581cf09d",
  "client-first": "https://finsweet.com/client-first/docs",
};

interface DocsButtonProps {
  className?: string;
}

export const DocsButton: React.FC<DocsButtonProps> = ({ className }) => {
  const preset = getCurrentPreset();
  const docsUrl = PRESET_DOCS[preset];

  if (!docsUrl) {
    return null;
  }

  const handleClick = () => {
    window.open(docsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
      title={`${preset} documentation`}
      aria-label={`Open ${preset} documentation`}
    >
      <BookOpen className="size-3" aria-hidden="true" />
    </Button>
  );
};
