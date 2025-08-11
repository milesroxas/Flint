import React from "react";

export type LintViewMode = "element" | "page";

interface ModeToggleProps {
  mode: LintViewMode;
  onChange: (mode: LintViewMode) => void;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onChange,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        className={`text-xs px-2 py-1 rounded ${
          mode === "page" ? "bg-slate-200" : "bg-transparent"
        }`}
        onClick={() => onChange("page")}
      >
        Page
      </button>
      <button
        className={`text-xs px-2 py-1 rounded ${
          mode === "element" ? "bg-slate-200" : "bg-transparent"
        }`}
        onClick={() => onChange("element")}
      >
        Element
      </button>
    </div>
  );
};
