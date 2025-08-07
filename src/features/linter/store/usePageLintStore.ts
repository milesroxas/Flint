// src/features/linter/store/usePageLintStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { RuleResult } from '@/features/linter/types/rule-types';
import { createPageLintService } from '@/features/linter/services/page-lint-service';
import { StyleService } from '@/features/linter/services/style-service';
import { RuleRunner } from '@/features/linter/services/rule-runner'; 
import { RuleRegistry } from '@/features/linter/services/rule-registry';
import { UtilityClassAnalyzer } from '@/features/linter/services/utility-class-analyzer';
import { defaultRules } from '@/features/linter/rules/default-rules';

// initialize services once…
const styleService = new StyleService();
const utilityAnalyzer = new UtilityClassAnalyzer();
const ruleRegistry = new RuleRegistry();
ruleRegistry.registerRules(defaultRules);
const ruleRunner = new RuleRunner(ruleRegistry, utilityAnalyzer);
const pageLintService = createPageLintService(styleService, ruleRunner);

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

        // mark that we've run at least once
        set({ hasRun: true, loading: true, error: null });

        try {
          const elements = await webflow.getAllElements();
          const results = await pageLintService.lintCurrentPage(elements);
          set({ results, loading: false });
        } catch (error) {
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
