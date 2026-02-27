import type React from "react";
import { THIRD_PARTY_LIBRARIES } from "@/features/linter/lib/third-party-libraries";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";

export const ThirdPartyLibrariesView: React.FC = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="text-sm text-muted-foreground">
          The following third-party library classes are skipped during linting when the 3rd Party toggle is enabled.
          Using these classes will not produce violations.
        </div>

        {THIRD_PARTY_LIBRARIES.map((library) => (
          <div key={library.id} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide">{library.name}</h3>
              <span className="text-[10px] text-muted-foreground">{library.classes.length} classes</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{library.description}</p>
            <div className="grid grid-cols-2 gap-1">
              {library.classes.map((cls) => (
                <Badge key={cls} variant="secondary" className="justify-start font-mono text-xs">
                  {cls}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
