import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { scanSelectedElement } from "@/features/linter/use-cases/scan-selected-element";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";
import { createDebugger } from "@/shared/utils/debug";
import { toElementKey } from "@/entities/element/lib/id";

// Intentionally unused type guard removed to satisfy no-unused-vars rule; access via window.webflow at runtime

interface ElementLintState {
  results: RuleResult[];
  classNames: string[];
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
  roles: [],
  loading: false,
  error: null,
  structuralContext: false,
  lastSelectedElementKey: null,
};

const debug = createDebugger("element-lint-store");

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
              roles: [],
              loading: false,
            });
            return;
          }
          const el = await wf.getSelectedElement();
          const isComponentInstance = (el as any)?.type === "ComponentInstance";
          debug.log(
            "refresh: selected element type",
            (el as any)?.type,
            "structuralContext",
            get().structuralContext
          );
          set({
            lastSelectedElementKey: el ? toElementKey(el as any) : null,
          });
          if (
            !el ||
            (typeof el.getStyles !== "function" &&
              !(get().structuralContext && isComponentInstance))
          ) {
            debug.warn(
              "refresh: skipping lint; getStyles missing and not component in structural mode"
            );
            set({ results: [], classNames: [], roles: [], loading: false });
            return;
          }
          const state = get();
          const results = await scanSelectedElement(
            el,
            state.structuralContext
          );
          set({
            results,
            classNames: [],
            roles: [],
            loading: false,
          });
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error("[ElementLintStore] refresh failed", err);
          set({
            ...initialState,
            error:
              err instanceof Error ? err.message : "Failed to lint element",
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
          !(
            useElementLintStore.getState().structuralContext &&
            isComponentInstance
          ))
      ) {
        useElementLintStore.setState({
          results: [],
          classNames: [],
          roles: [],
          loading: false,
        });
        return;
      }

      useElementLintStore.setState({ loading: true, error: null });
      try {
        const state = useElementLintStore.getState();
        debug.log("event: structuralContext", state.structuralContext);
        const results = await scanSelectedElement(el, state.structuralContext);
        useElementLintStore.setState({
          results,
          classNames: [],
          roles: [],
          loading: false,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[ElementLintStore] event lint failed", err);
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
