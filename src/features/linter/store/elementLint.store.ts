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
  inComponentContext: boolean;
  selectedIsComponentInstance: boolean;
  autoEnterEnabled: boolean;
  lastSelectedElementKey: string | null;
  componentElementIds: string[]; // normalized ids for elements within current component context
}

interface ElementLintActions {
  refresh: () => Promise<void>;
  clear: () => void;
  setStructuralContext: (enabled: boolean) => void;
  enterComponentContext: () => Promise<void>;
  exitComponentContext: () => Promise<void>;
}

type ElementLintStore = ElementLintState & ElementLintActions;

const initialState: ElementLintState = {
  results: [],
  classNames: [],
  roles: [],
  loading: false,
  error: null,
  structuralContext: false, // Default to enabled for better detection
  inComponentContext: false,
  selectedIsComponentInstance: false,
  autoEnterEnabled: true,
  lastSelectedElementKey: null,
  componentElementIds: [],
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
              inComponentContext: false,
              selectedIsComponentInstance: false,
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
            selectedIsComponentInstance: !!isComponentInstance,
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
            set({
              results: [],
              classNames: [],
              roles: [],
              loading: false,
              inComponentContext: false,
            });
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
            // Do not infer inComponentContext from selection; only set on explicit enter/exit
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

      enterComponentContext: async () => {
        try {
          const wf: any = (window as any).webflow;
          const state = get();
          if (!state.structuralContext) return; // only meaningful in structural mode
          if (!wf || typeof wf.getSelectedElement !== "function") return;
          const el = await wf.getSelectedElement();
          const isComponentInstance = (el as any)?.type === "ComponentInstance";
          if (!isComponentInstance) return;
          if (typeof wf.enterComponent === "function") {
            (window as any).__flowlint_ignoreNextSelectedEvent = true;
            await wf.enterComponent(el);
          }
          // after entering, capture all element ids within this component context
          let componentElementIds: string[] = [];
          try {
            if (typeof wf.getAllElements === "function") {
              const inside = await wf.getAllElements();
              if (Array.isArray(inside)) {
                componentElementIds = inside.map((e: any) => toElementKey(e));
              }
            }
          } catch {}

          set({
            inComponentContext: true,
            selectedIsComponentInstance: true,
            autoEnterEnabled: true,
            componentElementIds,
          });
          await get().refresh();
        } catch (e) {
          debug.warn("enterComponentContext failed", e);
        }
      },

      exitComponentContext: async () => {
        try {
          const wf: any = (window as any).webflow;
          if (wf && typeof wf.exitComponent === "function") {
            (window as any).__flowlint_ignoreNextSelectedEvent = true;
            await wf.exitComponent();
          }
          // Preserve results; just flip the context flag so UI shows Enter again
          set({
            inComponentContext: false,
            autoEnterEnabled: false,
            componentElementIds: [],
          });
        } catch (e) {
          debug.warn("exitComponentContext failed", e);
          set({
            inComponentContext: false,
            autoEnterEnabled: false,
            componentElementIds: [],
          });
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
      const g: any = window as any;
      if (g.__flowlint_ignoreNextSelectedEvent) {
        g.__flowlint_ignoreNextSelectedEvent = false;
        return;
      }
      const isComponentInstance = (el as any)?.type === "ComponentInstance";
      useElementLintStore.setState({
        selectedIsComponentInstance: !!isComponentInstance,
        lastSelectedElementKey: el ? toElementKey(el as any) : null,
        autoEnterEnabled: true, // Re-enable auto-enter on explicit user selection change
      });

      // If we are currently inside a component, and the newly selected element
      // is NOT inside the current component's element set, exit and preserve results.
      try {
        const state = useElementLintStore.getState();
        const selectedKey = el ? toElementKey(el as any) : null;
        if (
          state.inComponentContext &&
          selectedKey &&
          state.componentElementIds.length > 0 &&
          !state.componentElementIds.includes(selectedKey)
        ) {
          const wf: any = (window as any).webflow;
          if (wf && typeof wf.exitComponent === "function") {
            (window as any).__flowlint_ignoreNextSelectedEvent = true;
            await wf.exitComponent();
          }
          // Do not overwrite results; exit component context and stop here
          useElementLintStore.setState({
            inComponentContext: false,
            autoEnterEnabled: false,
            componentElementIds: [],
            loading: false,
          });
          return;
        }
      } catch (e) {
        // ignore errors in this path; continue with default handling
      }
      if (
        !el ||
        (typeof el.getStyles !== "function" &&
          !(useElementLintStore.getState().structuralContext &&
            isComponentInstance))
      ) {
        useElementLintStore.setState({
          results: [],
          classNames: [],
          roles: [],
          loading: false,
          // leave inComponentContext unchanged; explicit exit handles it
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
          // Do not infer inComponentContext here
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
