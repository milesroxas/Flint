// File: src/index.tsx

import "./styles/globals.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Header from "@/components/Header";
import { LintPanel } from "@/features/linter/components/LintPanel";

const Root: React.FC = () => (
  <div className="h-full flex flex-col">
    <Header />
    <LintPanel />
  </div>
);

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
