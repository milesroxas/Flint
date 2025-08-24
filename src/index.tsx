import "./styles/globals.css";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import Header from "@/app/ui/Header";
import ExtensionWrapper from "@/features/window/components/ExtensionWrapper";

import { LinterPanel } from "@/features/linter/view/LinterPanel";
import { ExpandedContent } from "@/features/linter/ui/expanded/ExpandedContent";
import { RecognizedElementsView } from "@/features/linter/ui/expanded/RecognizedElementsView";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import { cn } from "@/lib/utils";

const Root: React.FC = () => {
  const [expandedView, setExpandedView] = useState<{
    isActive: boolean;
    contentType: string | null;
    data: unknown;
  }>({
    isActive: false,
    contentType: null,
    data: null,
  });

  const openExpandedView = (contentType: string, data?: unknown) => {
    setExpandedView({
      isActive: true,
      contentType,
      data: data || null,
    });
  };

  const closeExpandedView = () => {
    setExpandedView({
      isActive: false,
      contentType: null,
      data: null,
    });
  };

  return (
    <ExtensionWrapper>
      <div className="flex h-full flex-col relative overflow-hidden">
        {/* Main App Content */}
        <div
          className={cn(
            "flex h-full flex-col transition-all duration-300 ease-in-out",
            expandedView.isActive
              ? "translate-x-[-100%] opacity-0"
              : "translate-x-0 opacity-100"
          )}
        >
          <Header />
          <div className="flex-1 min-h-0">
            <LinterPanel onOpenExpandedView={openExpandedView} />
          </div>
        </div>

        {/* Expanded View Content */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col transition-all duration-300 ease-in-out",
            expandedView.isActive
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          )}
        >
          {expandedView.isActive && (
            <>
              {expandedView.contentType === "recognized-elements" && (
                <ExpandedContent
                  title="Recognized Elements"
                  onClose={closeExpandedView}
                >
                  <RecognizedElementsView
                    presetId={getCurrentPreset()}
                    projectElements={[]}
                  />
                </ExpandedContent>
              )}
            </>
          )}
        </div>
      </div>
    </ExtensionWrapper>
  );
};

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
