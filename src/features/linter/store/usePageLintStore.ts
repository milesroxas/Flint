// src/features/linter/store/usePageLintStore.ts
import posthog from "posthog-js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { isThirdPartyClass } from "@/features/linter/lib/third-party-libraries";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { invalidatePageContextCache } from "@/features/linter/services/lint-context.service";
import { useLinterSettingsStore } from "@/features/linter/store/linterSettings.store";
import { scanCurrentPageWithMeta } from "@/features/linter/use-cases/scan-current-page";
import { useAnimationStore } from "./animation.store";

interface PageLintState {
  results: RuleResult[];
  passedClassNames: string[];
  ignoredClassNames: string[];
  loading: boolean;
  error: string | null;
  hasRun: boolean;
}

interface PageLintActions {
  lintPage: () => Promise<void>;
  clearResults: () => void;
}

type PageLintStore = PageLintState & PageLintActions;

const initialState: PageLintState = {
  results: [],
  passedClassNames: [],
  ignoredClassNames: [],
  loading: false,
  error: null,
  hasRun: false,
};

function buildClassFilter(): ((name: string) => boolean) | undefined {
  const { ignoreThirdPartyClasses } = useLinterSettingsStore.getState();
  return ignoreThirdPartyClasses ? (name: string) => !isThirdPartyClass(name) : undefined;
}

export const usePageLintStore = create<PageLintStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      lintPage: async () => {
        if (get().loading) return;

        // Coordinate with animation store
        useAnimationStore.getState().startLinting();

        // Mark that we've run at least once
        set({ hasRun: true, loading: true, error: null });

        try {
          ensureLinterInitialized("balanced");

          // Invalidate cache before scanning to ensure fresh results for page mode
          invalidatePageContextCache();

          const elements = await webflow.getAllElements();
          const { results, classNames, ignoredClassNames } = await scanCurrentPageWithMeta(elements, {
            classFilter: buildClassFilter(),
          });
          set({ results, passedClassNames: classNames, ignoredClassNames, loading: false });

          // Trigger severity tiles animation after results are ready
          requestAnimationFrame(() => {
            useAnimationStore.getState().showSeverityTiles();
          });
        } catch (error) {
          console.error("[PageLintStore] Error during linting:", error);
          posthog.capture("lint_error", {
            mode: "page",
            error: error instanceof Error ? error.message : "Failed to lint page",
          });
          set({
            error: error instanceof Error ? error.message : "Failed to lint page",
            results: [],
            loading: false,
          });
          // Reset animation state on error
          useAnimationStore.getState().reset();
        }
      },

      clearResults: () => {
        set({
          results: [],
          passedClassNames: [],
          ignoredClassNames: [],
          error: null,
          hasRun: false,
        });
      },
    }),
    {
      name: "page-lint-store",
      serialize: { options: true },
    }
  )
);

export const usePageLint = usePageLintStore;
