import React, { useMemo } from "react";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";

interface RecognizedElementsViewProps {
  presetId?: string;
  projectElements?: string[];
}

export const RecognizedElementsView: React.FC<RecognizedElementsViewProps> = ({
  presetId = "lumos",
  projectElements = [],
}) => {
  const recognizedElements = useMemo(() => {
    const { presetElementsService } = getLinterServices();
    return presetElementsService.getForPreset(presetId);
  }, [presetId]);

  const elements = recognizedElements.categories;
  const examples = recognizedElements.examples;
  const presetName =
    presetId.charAt(0).toUpperCase() + presetId.slice(1).replace("-", "-");

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Description */}
        <div className="text-sm text-muted-foreground">
          These are the recognized element terms for the {presetName} preset.
          Using these terms in your class names will pass validation.
        </div>

        {/* Standard Elements by Category */}
        {Object.entries(elements).map(([category, terms]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {terms.map((term) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="justify-start font-mono text-xs"
                >
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {/* Project-Defined Elements */}
        {projectElements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Project-Defined
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {projectElements.map((term) => (
                <Badge
                  key={term}
                  variant="outline"
                  className="justify-start font-mono text-xs border-blue-200 text-blue-700"
                >
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Example Usage
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            {examples.map((example, index) => (
              <div key={index}>
                <code className="bg-muted px-1 py-0.5 rounded">
                  {example.code}
                </code>{" "}
                - {example.description}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
