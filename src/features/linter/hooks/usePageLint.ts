// src/features/linter/hooks/usePageLint.ts
import { usePageLintStore } from '@/features/linter/store/pageLint.store';


export function usePageLint() {
  return usePageLintStore();
}