// src/features/linter/store/usePageLintStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { RuleResult } from '@/features/linter/model/rule.types';
import { createPageLintService } from '@/features/linter/services/page-lint-service';
import { createStyleService } from '@/features/linter/services/style-service';
import { createRuleRunner } from '@/features/linter/services/rule-runner'; 
import { createRuleRegistry } from '@/features/linter/services/rule-registry';
import { createUtilityClassAnalyzer } from '@/features/linter/services/utility-class-analyzer';
import { defaultRules } from '@/features/linter/rules/default-rules';

// Initialize services once using factory functions
const styleService = createStyleService();
const utilityAnalyzer = createUtilityClassAnalyzer();
const ruleRegistry = createRuleRegistry();

// Register rules and build initial property maps
ruleRegistry.registerRules(defaultRules);

const ruleRunner = createRuleRunner(ruleRegistry, utilityAnalyzer);
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

        // Mark that we've run at least once
        set({ hasRun: true, loading: true, error: null });

        try {
          // Get all elements from Webflow
          const elements = await webflow.getAllElements();
          
          // Build property maps for utility class analysis
          const allStyles = await styleService.getAllStylesWithProperties();
          utilityAnalyzer.buildPropertyMaps(allStyles);
          
          // Run the page lint with context awareness
          const results = await pageLintService.lintCurrentPage(elements);
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