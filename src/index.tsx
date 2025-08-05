import "./styles/globals.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Header from "@/components/Header";
import { LintPanel } from "@/features/linter/components/LintPanel";
import { ScrollArea } from "@/components/ui/scroll-area";

const Root: React.FC = () => (
  <div className="h-full flex flex-col">
    <Header />
    <ScrollArea className="flex-1">
      <LintPanel />
    </ScrollArea>
  </div>
);

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
