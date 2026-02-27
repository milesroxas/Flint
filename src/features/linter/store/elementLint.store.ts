import posthog from "posthog-js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toElementKey } from "@/entities/element/lib/id";
import { isThirdPartyClass } from "@/features/linter/lib/third-party-libraries";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import type { ElementRole } from "@/features/linter/model/linter.types";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { useLinterSettingsStore } from "@/features/linter/store/linterSettings.store";
import { scanSelectedElement } from "@/features/linter/use-cases/scan-selected-element";
import { createDebugger } from "@/shared/utils/debug";

// Intentionally unused type guard removed to satisfy no-unused-vars rule; access via window.webflow at runtime

interface ElementLintState {
  results: RuleResult[];
  classNames: string[];
  ignoredClassNames: string[];
  roles: ElementRole[];
  loading: boolean;
  error: string | null;
  structuralContext: boolean;
  lastSelectedElementKey: string | null;
}

interface ElementLintActions {
  refresh: () => Promise<void>;
  clear: () => void;
  setStructuralContext: (enabled: boolean) => void;
}

type ElementLintStore = ElementLintState & ElementLintActions;

const initialState: ElementLintState = {
  results: [],
  classNames: [],
  ignoredClassNames: [],
  roles: [],
  loading: false,
  error: null,
  structuralContext: false,
  lastSelectedElementKey: null,
};

const debug = createDebugger("element-lint-store");

function buildClassFilter(): ((name: string) => boolean) | undefined {
  const { ignoreThirdPartyClasses } = useLinterSettingsStore.getState();
  return ignoreThirdPartyClasses ? (name: string) => !isThirdPartyClass(name) : undefined;
}

export const useElementLintStore = create<ElementLintStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      refresh: async () => {
        if (get().loading) return;
        try {
          ensureLinterInitialized("balanced");
          set({ loading: true, error: null });
          const wf: any = (window as any).webflow;
          if (!wf || typeof wf.getSelectedElement !== "function") {
            set({
              results: [],
              classNames: [],
              ignoredClassNames: [],
              roles: [],
              loading: false,
            });
            return;
          }
          const el = await wf.getSelectedElement();
          const isComponentInstance = (el as any)?.type === "ComponentInstance";
          debug.log("refresh: selected element type", (el as any)?.type, "structuralContext", get().structuralContext);
          set({
            lastSelectedElementKey: el ? toElementKey(el as any) : null,
          });
          if (!el || (typeof el.getStyles !== "function" && !(get().structuralContext && isComponentInstance))) {
            debug.warn("refresh: skipping lint; getStyles missing and not component in structural mode");
            set({ results: [], classNames: [], ignoredClassNames: [], roles: [], loading: false });
            return;
          }
          const state = get();
          const { results, ignoredClassNames } = await scanSelectedElement(el, state.structuralContext, {
            classFilter: buildClassFilter(),
          });
          set({
            results,
            ignoredClassNames,
            classNames: [],
            roles: [],
            loading: false,
          });
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error("[ElementLintStore] refresh failed", err);
          posthog.capture("lint_error", {
            mode: "element",
            error: err instanceof Error ? err.message : "Failed to lint element",
          });
          set({
            ...initialState,
            error: err instanceof Error ? err.message : "Failed to lint element",
          });
        }
      },

      clear: () => set({ ...initialState }),

      setStructuralContext: (enabled: boolean) => {
        set({ structuralContext: enabled });

        // Auto-refresh when structural context setting changes
        const state = get();
        if (!state.loading) {
          void state.refresh();
        }
      },
    }),
    { name: "element-lint-store", serialize: { options: true } }
  )
);

// One-time subscription to Designer selection events
(() => {
  try {
    const wf: any = (window as any).webflow;
    if (!wf || typeof wf.subscribe !== "function") return;
    ensureLinterInitialized("balanced");
    wf.subscribe("selectedelement", async (el: any) => {
      const isComponentInstance = (el as any)?.type === "ComponentInstance";
      const newElementKey = el ? toElementKey(el as any) : null;

      useElementLintStore.setState({
        lastSelectedElementKey: newElementKey,
      });

      if (
        !el ||
        (typeof el.getStyles !== "function" &&
          !(useElementLintStore.getState().structuralContext && isComponentInstance))
      ) {
        useElementLintStore.setState({
          results: [],
          classNames: [],
          ignoredClassNames: [],
          roles: [],
          loading: false,
        });
        return;
      }

      useElementLintStore.setState({ loading: true, error: null });
      try {
        const state = useElementLintStore.getState();
        debug.log("event: structuralContext", state.structuralContext);
        const { results, ignoredClassNames } = await scanSelectedElement(el, state.structuralContext, {
          classFilter: buildClassFilter(),
        });
        useElementLintStore.setState({
          results,
          ignoredClassNames,
          classNames: [],
          roles: [],
          loading: false,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[ElementLintStore] event lint failed", err);
        posthog.capture("lint_error", {
          mode: "element",
          source: "selectedelement",
          error: err instanceof Error ? err.message : "Failed to lint element",
        });
        useElementLintStore.setState({
          ...initialState,
          error: "Failed to lint element",
        });
      }
    });
  } catch {
    // ignore boot errors in non-designer contexts
  }
})();

// Compatibility hook
export const useElementLint = useElementLintStore;
