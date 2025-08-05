import "./styles/globals.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Header from "@/components/Header";
import { LintPanel } from "@/features/linter/components/LintPanel";
import ExtensionWrapper from "@/features/window/components/ExtensionWrapper";
import { ScrollArea } from "@/components/ui/scroll-area";

const Root: React.FC = () => (
  <ExtensionWrapper>
    <div>
      <Header />
      <ScrollArea className="flex-1">
        <LintPanel />
      </ScrollArea>
    </div>
  </ExtensionWrapper>
);

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
