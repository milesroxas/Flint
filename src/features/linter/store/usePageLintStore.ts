// src/features/linter/store/usePageLintStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { RuleResult } from '@/features/linter/model/rule.types';
import { scanCurrentPageWithMeta } from '@/processes/scan/scan-current-page';
import { ensureLinterInitialized } from '@/features/linter/model/linter.factory';
// import { defaultRules } from '@/features/linter/rules/default-rules';

// Process orchestrator handles service setup per scan

interface PageLintState {
  results: RuleResult[];
  passedClassNames: string[];
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
  loading: false,
  error: null,
  hasRun: false,
};

export const usePageLintStore = create<PageLintStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      lintPage: async () => {
        if (get().loading) return;

        // Mark that we've run at least once
        set({ hasRun: true, loading: true, error: null });

        try {
          ensureLinterInitialized("balanced");
          const elements = await webflow.getAllElements();
          const { results, classNames } = await scanCurrentPageWithMeta(elements);
          set({ results, passedClassNames: classNames, loading: false });
        } catch (error) {
          console.error('[PageLintStore] Error during linting:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to lint page',
            results: [],
            loading: false,
          });
        }
      },

      clearResults: () => {
        set({ results: [], passedClassNames: [], error: null, hasRun: false });
      },
    }),
    {
      name: 'page-lint-store',
      serialize: { options: true },
    }
  )
);

export const usePageLint = usePageLintStore;