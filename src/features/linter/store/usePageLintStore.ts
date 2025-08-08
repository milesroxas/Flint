// src/features/linter/store/usePageLintStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { RuleResult } from '@/features/linter/model/rule.types';
import { scanCurrentPage } from '@/processes/scan/scan-current-page';
// import { defaultRules } from '@/features/linter/rules/default-rules';

// Process orchestrator handles service setup per scan

interface PageLintState {
  results: RuleResult[];
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
          const elements = await webflow.getAllElements();
          const results = await scanCurrentPage(elements);
          set({ results, loading: false });
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
        set({ results: [], error: null, hasRun: false });
      },
    }),
    {
      name: 'page-lint-store',
      serialize: { options: true },
    }
  )
);

export const usePageLint = usePageLintStore;