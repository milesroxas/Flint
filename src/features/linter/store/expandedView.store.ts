import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Domain types for expanded view content
export type ExpandedViewContentType =
  | "recognized-elements"
  | "rule-documentation"
  | "diagnostic-details"
  | "settings"
  | "suggested-fixes"
  | "third-party-libraries";

export interface ExpandedViewContent {
  type: ExpandedViewContentType;
  title: string;
  data?: unknown;
  sourceRuleId?: string;
}

interface ExpandedViewState {
  isActive: boolean;
  content: ExpandedViewContent | null;
}

interface ExpandedViewActions {
  openExpandedView: (content: ExpandedViewContent) => void;
  closeExpandedView: () => void;
}

type ExpandedViewStore = ExpandedViewState & ExpandedViewActions;

const initialState: ExpandedViewState = {
  isActive: false,
  content: null,
};

export const useExpandedViewStore = create<ExpandedViewStore>()(
  devtools(
    (set) => ({
      ...initialState,

      openExpandedView: (content: ExpandedViewContent) => {
        set({
          isActive: true,
          content,
        });
      },

      closeExpandedView: () => {
        set({
          isActive: false,
          content: null,
        });
      },
    }),
    {
      name: "expanded-view-store",
      serialize: { options: true },
    }
  )
);

// Convenience hook
export const useExpandedView = useExpandedViewStore;
