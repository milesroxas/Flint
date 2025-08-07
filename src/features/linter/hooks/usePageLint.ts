// src/features/linter/hooks/usePageLint.ts
import { usePageLintStore } from '@/features/linter/store/usePageLintStore';

// Simple direct export - no need for selector since we want all properties
export function usePageLint() {
  return usePageLintStore();
}