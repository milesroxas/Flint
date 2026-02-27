import "./styles/globals.css";
import { createRoot } from "react-dom/client";
import Header from "@/app/ui/Header";
import { useExpandedView } from "@/features/linter/store/expandedView.store";
import { ExpandedContent } from "@/features/linter/ui/expanded/ExpandedContent";
import { RecognizedElementsView } from "@/features/linter/ui/expanded/RecognizedElementsView";
import { ThirdPartyLibrariesView } from "@/features/linter/ui/expanded/ThirdPartyLibrariesView";
import { LinterPanel } from "@/features/linter/view/LinterPanel";
import { SettingsPanel } from "@/features/settings/ui/SettingsPanel";
import ExtensionWrapper from "@/features/window/components/ExtensionWrapper";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { cn } from "@/shared/utils";

const Root = () => {
  const { isActive, content, closeExpandedView } = useExpandedView();

  return (
    <ThemeProvider defaultTheme="light" storageKey="flowlint-ui-theme">
      <ExtensionWrapper>
        <div className="flex h-full flex-col relative overflow-hidden">
          {/* Main App Content */}
          <div
            className={cn(
              "flex h-full flex-col transition-all duration-300 ease-in-out",
              isActive ? "translate-x-[-100%] opacity-0" : "translate-x-0 opacity-100"
            )}
          >
            <Header />
            <div className="flex-1 min-h-0">
              <LinterPanel />
            </div>
          </div>

          {/* Expanded View Content */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col transition-all duration-300 ease-in-out",
              isActive ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}
          >
            {isActive && content && content.type === "recognized-elements" && (
              <ExpandedContent title={content.title} onClose={closeExpandedView}>
                <RecognizedElementsView
                  presetId={(content.data as any)?.presetId || ""}
                  projectElements={(content.data as any)?.projectElements || []}
                />
              </ExpandedContent>
            )}
            {isActive && content && content.type === "settings" && (
              <ExpandedContent title={content.title} onClose={closeExpandedView}>
                <SettingsPanel />
              </ExpandedContent>
            )}
            {isActive && content && content.type === "third-party-libraries" && (
              <ExpandedContent title={content.title} onClose={closeExpandedView}>
                <ThirdPartyLibrariesView />
              </ExpandedContent>
            )}
          </div>
        </div>
      </ExtensionWrapper>
    </ThemeProvider>
  );
};

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
