// src/features/linter/hooks/usePageLint.ts
import { usePageLintStore } from '@/features/linter/store/usePageLintStore';


export function usePageLint() {
  return usePageLintStore();
}